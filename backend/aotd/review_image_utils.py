from .models import (
  Review,
  ReviewImage,
  AotdUserData
)
from django.core.files.storage import FileSystemStorage
from django.core.files.base import ContentFile
from django.db.utils import IntegrityError

import logging
import socket
import ipaddress
import requests
import os
import uuid
import hashlib

from collections import namedtuple
from urllib.parse import urlsplit, urljoin
from PIL import Image, ImageOps
from io import BytesIO


# Declare logging
logger = logging.getLogger()

## ============================================================================================================
## System Configurations
## ============================================================================================================
ALLOWED_FORMATS = {'PNG', 'JPEG', 'WEBP', 'GIF'}
MAX_PIXELS = 100_000_000
MAX_SIDE_PX = 2000
WEBP_QUALITY = 85
# External fetch (re-hosting) limits. These run inline during submitReview while the user waits, so they are deliberately tight.
MAX_FETCH_BYTES = 20 * 1024 * 1024                      # Abandon a remote body once it passes this many bytes
FETCH_CONNECT_TIMEOUT_S = 3                             # Seconds to wait for the TCP connection to open
FETCH_READ_TIMEOUT_S = 5                                # Seconds to wait between chunks once connected
MAX_REDIRECTS = 3                                       # Image CDNs rarely need more than one or two hops
FETCH_USER_AGENT = 'CordPal/0.0.1 ( www.cordpal.app )'  # Matches the MusicBrainz calls in aotd/utils.py
CGNAT_RANGE = ipaddress.ip_network('100.64.0.0/10')     # Carrier-grade NAT; Tailscale hands these out. Not covered by is_private.

## ============================================================================================================
## Exception and Type Definitions
## ============================================================================================================

class ReviewImageError(Exception):
  def __init__(self, message, status_code):
    # Pass the message to the base Exception class
    super().__init__(message)
    # Store custom data
    self.status_code = status_code

ProcessedImage = namedtuple('ProcessedImage', ['data', 'content_type', 'ext', 'width', 'height'])

## ============================================================================================================
## Byte, Disk, and Network Functions
## ============================================================================================================

def processImageBytes(raw: bytes, crid: str = "NOT_PROVIDED") -> ProcessedImage:
  """Use Pillow to process an image and get a ProcessedImage Tuple back."""
  # Pillow needs an image file, so wrap the bytes in a file wrapper
  image_buffer = BytesIO(raw)
  # Open the image file using Pillow and verify it using Pillows methods, this will destroy the image object
  logger.info("Attempting to process image for ReviewImage", extra={'crid': crid})
  try:
    image = Image.open(image_buffer)
    image.verify()
  except:
    logger.error("Provided file is not a valid image", extra={'crid': crid})
    raise ReviewImageError('File is not a valid image', 400)
  # Reset buffer and reopen the image object and begin further checks and manipulation
  image_buffer.seek(0)
  image = Image.open(image_buffer)
  # VERIFIVATION STEP 1: Ensure image is a correct format
  if image.format not in ALLOWED_FORMATS:
    logger.error("Provided file is not a supported file format", extra={'crid': crid, 'provided_format': image.format, 'allowed_formats': ALLOWED_FORMATS})
    raise ReviewImageError(f'Unsupported image format: {image.format}. Supported formats are: {ALLOWED_FORMATS}', 400)
  # VERIFICATION STEP 2: Check filesize and ensure it does not exceed maximum number of pixels
  width, height = image.size
  if ((width * height) > MAX_PIXELS):
    logger.error("Provided image file is too large", extra={'crid': crid, 'width': width, 'height': height})
    raise ReviewImageError(f'Image dimensions too large', 400)
  # VERIFICATION STEP 3: Check if provided image is actually a GIF, if so, return without re-encoding (animation preserved)
  if image.format == "GIF":
    logger.info("Provided file is a GIF, returning gif as is...", extra={'crid': crid})
    return ProcessedImage(data=raw, content_type='image/gif', ext='gif', width=width, height=height)
  # VERIFICATION STEP 4: apply EXIF orientation, then re-encode (which drops the EXIF block itself)
  logger.info("Provided file has passed verification steps, attempting EXIF transpose and thumbnail-ification...", extra={'crid': crid})
  image = ImageOps.exif_transpose(image)
  image.thumbnail((MAX_SIDE_PX, MAX_SIDE_PX), Image.Resampling.LANCZOS)
  if image.mode not in ('RGB', 'RGBA'):
    image = image.convert('RGBA' if 'A' in image.getbands() else 'RGB') 
  # Write the updated image to an out buffer
  out = BytesIO()
  image.save(out, format='WEBP', quality=WEBP_QUALITY)
  data = out.getvalue()
  # Return the final ProcessedImage Tuple
  final_image = ProcessedImage(data=data, content_type='image/webp', ext='webp', width=image.width, height=image.height)
  logger.info("Provided file was properly verified and formatted! Returning ProcessedImage data...", extra={'crid': crid} | final_image._asdict())
  return final_image


def removeReviewImageFile(image_disk_path: str, crid: str = "NOT_PROVIDED") -> None:
  """
  Calls os.remove on the provided image filepath, allowing for cleanup and graceful handling of nonexistant images. 
  To be used for garbage collection, failure paths in image upload, and possible admin actions.
  """
  logger.info(f"Attempting deletion of image file located at: {image_disk_path}...", extra={'crid': crid})
  # Attempt deletion of the file
  try:
    os.remove(image_disk_path)
  except FileNotFoundError:
    pass # File not found, no worries
  except:
    # Handle some kind of extra error
    logger.critical(f"CRITICAL: Unable to remove file located at {image_disk_path}, this could mean orphan data is filling the drive.", extra={'crid': crid})
    raise Exception(f"Failed to remove file located at: {image_disk_path}")
  # Log successful deletion of the file, since in order to reach this point the file either did not exist or it has been terminated
  logger.info(f"File successfully terminated or was unfound (happy path): {image_disk_path}...", extra={'crid': crid})


def storeReviewImage(raw: bytes, uploader: AotdUserData, source_url: str | None = None, crid: str = "NOT_PROVIDED") -> ReviewImage:
  """
  Handle all aspects of storing a review image, assuming it has already been fetched and we have recieved byte data.
  Handles: Image Byte Processing, Hashing, Deduping, File Writing, Row Creation, and cleanup on failure.
  """
  # Attempt to process the image and retrieve data from image
  processedImage = processImageBytes(raw, crid)
  # Generate sha256 for this bytestream
  sha = hashlib.sha256(processedImage.data).hexdigest()
  # Check for existing image file that is the same as this one, if it exists, return it
  existing_image = ReviewImage.objects.filter(sha256=sha).first()
  if(existing_image):
    # ReviewImage already exists, updating its last used timestamp and return the existing ReviewImage row
    logger.info(f"Image attempting upload already exists, updating existing row and returning ReviewImage row.", extra={'crid': crid})
    existing_image.touchLastUsed()
    return existing_image
  # Generate a uuid4 for this image
  image_uuid = uuid.uuid4()
  # Determine the filename for this image and the write path
  filename = f'{image_uuid.hex}.{processedImage.ext}'
  write_path = os.getenv("REVIEW_IMAGE_PATH")
  full_disk_path = os.path.join(write_path, filename)
  # Attempt to write file to disk
  logger.info(f"Attempting to write Review Image to {full_disk_path}", extra={'crid': crid})
  try:
    file_storage = FileSystemStorage(location=write_path)
    file_storage.save(filename, ContentFile(processedImage.data))
  except:
    logger.exception("storeReviewImage failed to write file to disk, attempting image file cleanup...", extra={'crid': crid})
    removeReviewImageFile(full_disk_path, crid)
    raise
  # Build ReviewImage Row for storage
  try:
    review_image = ReviewImage(
      image_id=image_uuid,
      sha256=sha,
      uploader=uploader,
      filename=filename,
      filetype=processedImage.content_type,
      size_bytes=len(processedImage.data),
      width=processedImage.width,
      height=processedImage.height,
      source_url=source_url
    )
    review_image.save()
    return review_image
  except IntegrityError:
    logger.warning("Failed to create ReviewImage object due to integrity error, cleaning up this file and looking for existing image file...", extra={'crid': crid})
    # Cleanup failed review_image
    removeReviewImageFile(full_disk_path, crid)
    # Check for existing ReviewImage
    existing_image = ReviewImage.objects.filter(sha256=sha).first()
    if(existing_image):
      # ReviewImage located after failed attempt, updating its last used timestamp and return the existing ReviewImage row
      logger.info(f"Image attempting upload already exists, updating existing row and returning existing ReviewImage row...", extra={'crid': crid})
      existing_image.touchLastUsed()
      return existing_image
    # If there is still an issue, raise it
    raise
  except:
    logger.exception("Failed to create ReviewImage object, initiating cleanup of ReviewImage file...", extra={'crid': crid})
    removeReviewImageFile(full_disk_path, crid)
    raise


def fetchExternalImage(url: str, crid: str = "NOT_PROVIDED") -> bytes:
  """
  Download an image from a user-supplied URL with SSRF protections, returning the raw bytes.

  The returned bytes have NOT been proven to be an image yet; the caller hands them to
  processImageBytes, which is the only judge of that.

  Client-facing error messages are deliberately generic ("could not be fetched") no matter what went
  wrong. If we told the caller "connection refused" versus "timed out", the endpoint would become a
  port scanner for our own network: an attacker could learn which internal ports have something
  listening. The detailed reason always goes to the server log with the CRID instead.
  """
  logger.info("Attempting to fetch external image", extra={'crid': crid, 'url': url})
  # Loop because a response may be a redirect, in which case come back around with the new URL.
  # MAX_REDIRECTS + 1 because the first iteration is the original request, not a redirect.
  for hop in range(MAX_REDIRECTS + 1):
    # STEP 1: Only https, and only with a hostname.
    parts = urlsplit(url)
    if parts.scheme != 'https' or not parts.hostname:
      logger.warning("External image URL rejected: not https or no host", extra={'crid': crid, 'url': url, 'hop': hop})
      raise ReviewImageError('Image URL must be an https address', 422)
    # STEP 2: Resolve the host and refuse anything that lands inside our network. See assertPublicHost.
    assertPublicHost(parts.hostname, crid)
    # ------------------------------------------------------------------------------------------------
    # STEP 3: Make the request, with three deliberate settings:
    #   stream=True            -> do not read the body yet; we will pull it in chunks with a size cap.
    #   allow_redirects=False  -> requests would otherwise follow a redirect to an internal address
    #                             automatically, silently replacing the URL we just validated.
    #                             We handle redirects ourselves (STEP 4) so each hop is re-checked.
    #   timeout=(connect, read)-> a server that accepts the connection and never answers would otherwise
    #                             hang this worker. Production runs the single-process dev server, so a
    #                             hung worker is a hung API.
    # The headers carry ONLY a user agent: no cookies, nothing from the user's request. The remote server
    # should learn nothing beyond "CordPal fetched an image".
    # ------------------------------------------------------------------------------------------------
    try:
      response = requests.get(
        url,
        stream=True,
        allow_redirects=False,
        timeout=(FETCH_CONNECT_TIMEOUT_S, FETCH_READ_TIMEOUT_S),
        headers={'User-Agent': FETCH_USER_AGENT},
      )
    except requests.RequestException as e:
      # Covers DNS failure at connect time, refused connections, timeouts, TLS errors. One generic message.
      logger.warning("External image fetch failed", extra={'crid': crid, 'url': url, 'hop': hop, 'error': repr(e)})
      raise ReviewImageError('Image URL could not be fetched', 422)
    # ------------------------------------------------------------------------------------------------
    # STEP 4: Handle a redirect by hand.
    # is_redirect is True for 301/302/303/307/308 responses that carry a Location header. The Location
    # may be relative ("/other.gif"), so resolve it against the URL we just requested. Then close this
    # response (we never read its body) and go around the loop, which re-runs STEP 1 and STEP 2 on the
    # new URL. If we run out of loop iterations, the final line of the function raises.
    # ------------------------------------------------------------------------------------------------
    if response.is_redirect:
      next_url = urljoin(url, response.headers.get('Location', ''))
      response.close()
      logger.info("External image fetch redirected", extra={'crid': crid, 'from': url, 'to': next_url, 'hop': hop})
      url = next_url
      continue
    # STEP 5: Anything other than a plain 200 is a failure. Log the real status; tell the client nothing specific.
    if response.status_code != 200:
      logger.warning("External image fetch returned non-200", extra={'crid': crid, 'url': url, 'status': response.status_code})
      response.close()
      raise ReviewImageError('Image URL could not be fetched', 422)
    # STEP 6: Read the body in chunks, counting as we go, and abandon it the moment it exceeds the cap.
    # Content-Length is checked first as a cheap early exit, but it can be absent or a lie, so the
    # running count during streaming is the real enforcement. This bounds both bandwidth and memory,
    # because the whole image sits in memory before Pillow sees it.
    # Note that the remote Content-Type header is never consulted. Pillow decides what these bytes are.
    declared_length = int(response.headers.get('Content-Length') or 0)
    if declared_length > MAX_FETCH_BYTES:
      logger.warning("External image declares a size over the cap", extra={'crid': crid, 'url': url, 'content_length': declared_length})
      response.close()
      raise ReviewImageError('Image URL could not be fetched', 422)
    body = bytearray()
    try:
      for chunk in response.iter_content(chunk_size=64 * 1024):
        body += chunk
        if len(body) > MAX_FETCH_BYTES:
          logger.warning("External image exceeded the size cap while streaming, abandoning", extra={'crid': crid, 'url': url, 'bytes_read': len(body)})
          response.close()
          raise ReviewImageError('Image URL could not be fetched', 422)
    except requests.RequestException as e:
      # A read timeout or dropped connection mid-body lands here.
      logger.warning("External image fetch failed mid-body", extra={'crid': crid, 'url': url, 'error': repr(e)})
      raise ReviewImageError('Image URL could not be fetched', 422)
    finally:
      response.close()
    logger.info("External image fetched successfully", extra={'crid': crid, 'url': url, 'bytes': len(body), 'hops': hop})
    return bytes(body)
  # Only reachable if every iteration was a redirect: the loop ran out before a real response arrived.
  logger.warning("External image fetch exceeded the redirect limit", extra={'crid': crid, 'url': url, 'max_redirects': MAX_REDIRECTS})
  raise ReviewImageError('Image URL could not be fetched', 422)


def assertPublicHost(hostname: str, crid: str = "NOT_PROVIDED") -> None:
  """
  Raise ReviewImageError unless every address this hostname resolves to is a public internet address.
  """
  # Resolve the hostname to every address DNS returns for it (both IPv4 and IPv6).
  # getaddrinfo returns a list of 5-tuples; index 4 is the socket address, whose first element is the IP string.
  # The port argument is irrelevant to resolution but required by the signature; 443 is as good as any.
  # Passing a numeric IP string here is fine too: getaddrinfo hands it straight back, normalised, which is
  # what defeats exotic spellings like "2130706433" or "0x7f000001" for 127.0.0.1.
  try:
    address_infos = socket.getaddrinfo(hostname, 443, proto=socket.IPPROTO_TCP)
  except socket.gaierror:
    logger.warning("External image host could not be resolved", extra={'crid': crid, 'hostname': hostname})
    raise ReviewImageError('Image URL host could not be resolved', 422)
  # Check EVERY returned address, not just the first. An attacker can publish one public address and one
  # private address for the same name and hope the HTTP library happens to pick the private one.
  for info in address_infos:
    ip = ipaddress.ip_address(info[4][0])
    # An IPv4 address can be written as an IPv6 address: "::ffff:127.0.0.1". Left as-is it would pass the
    # checks below because it is technically "an IPv6 address that is not loopback". Unwrap it first.
    if isinstance(ip, ipaddress.IPv6Address) and ip.ipv4_mapped is not None:
      ip = ip.ipv4_mapped
    # Each property covers a family of addresses the backend must never connect to:
    #   is_private    -> 10/8, 172.16/12, 192.168/16, fc00::/7   (the LAN: UNRAID host, other containers, the registry)
    #   is_loopback   -> 127/8, ::1                              (this very process, and anything bound to localhost)
    #   is_link_local -> 169.254/16, fe80::/10                   (cloud metadata services live here)
    #   is_multicast  -> 224/4, ff00::/8                         (never a legitimate image host)
    #   is_reserved   -> 240/4 and assorted IPv6 blocks          (never a legitimate image host)
    #   is_unspecified-> 0.0.0.0, ::                             (some stacks treat this as localhost)
    #   CGNAT_RANGE   -> 100.64/10                               (VPN overlays such as Tailscale; not in is_private)
    if (ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_multicast
        or ip.is_reserved or ip.is_unspecified or ip in CGNAT_RANGE):
      # Log the real reason server-side, but the client message stays generic (see fetchExternalImage docstring).
      logger.warning("External image host resolves to a non-public address, refusing", extra={'crid': crid, 'hostname': hostname, 'ip': str(ip)})
      raise ReviewImageError('Image URL could not be fetched', 422)