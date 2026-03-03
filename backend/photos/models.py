from django.db import models

from users.models import User

# Model for images
class Image(models.Model):
  # Unique ID for an image
  image_id = models.BigAutoField(
    primary_key=True,
    editable=False,
    unique=True,
  )
  # Title text for Image
  title = models.CharField(max_length=300)
  # Description of Image (optional)
  description = models.TextField(
    default="No Description Provided",
  )
  # Upload timestamp
  upload_timestamp = models.DateTimeField(auto_now_add=True)
  # Uploading User
  uploader = models.ForeignKey(
    User,
    on_delete= models.SET_NULL,
    null=True,
    related_name="uploaded_images"
  )
  # Artist AKA The person who made the edit (Also a user field)
  artist = models.ForeignKey(
    User,
    on_delete=models.SET_NULL,
    null=True,
    blank=True,
    related_name="created_images"
  )
  # Tagged Users
  tagged_users = models.ManyToManyField(
    User,
    related_name="images_tagged_in"
  )
  # Filename of the image
  filename = models.CharField(max_length=300)
  # Filetype of the image
  filetype = models.CharField(
    max_length=100,
    null=True
  )

  # toString Method
  def __str__(self):
    return self.title