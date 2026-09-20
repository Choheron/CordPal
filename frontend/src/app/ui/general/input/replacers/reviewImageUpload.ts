'use client'

// Review image upload helpers for the TipTap editor.
//
// Three entry points feed into here: the toolbar button, a paste containing image files, and a drop of image files.
// All three call insertUploadingImages(), which is the whole flow: validate -> placeholder -> downscale -> upload ->
// swap the placeholder for the real image (or remove it and toast on failure).
//
// Two ideas make this work, and both are worth understanding before editing:
//
//  1. ProseMirror documents are immutable. You never edit a node; you build a *transaction* (view.state.tr) that
//     describes a change, then view.dispatch(tr) produces a new document. Undo/redo fall out of this for free: the
//     placeholder insert and the later swap are just two ordinary steps in history.
//
//  2. Positions are not stable. While an upload is in flight the user can keep typing, so the placeholder's position
//     from insert time is worthless by swap time. Instead the placeholder carries a random token in its `uploading`
//     attribute (see customImage.ts), and the swap walks the CURRENT document looking for that token. Positions are
//     read fresh at the moment they are used, never remembered.

import type { EditorView } from '@tiptap/pm/view'
import type { Node as PMNode } from '@tiptap/pm/model'
import { addToast } from '@heroui/react'
import { uploadReviewImage } from '@/app/lib/review_image_utils'

// ==============================================================================================================
// CONSTANTS  (keep in step with backend/aotd/review_image_utils.py)
// ==============================================================================================================

// What the editor will accept at all. Anything else is refused before any request is made.
export const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
// Matches MAX_UPLOAD_BYTES on the backend. Checked AFTER the browser-side downscale, so a 25 MB phone photo that
// shrinks to 500 KB passes; only a file that is still huge after resizing (or a huge GIF) is rejected here.
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024
// Matches MAX_SIDE_PX on the backend. Nothing in CordPal renders a review image larger than this.
export const MAX_SIDE_PX = 2000
// The spinner shown in the editor while an upload is in flight. An inline SVG as a data: URI so no request is needed.
// The backend sanitizer strips data: sources, so even if a placeholder somehow got submitted it could not be stored.
export const PLACEHOLDER_SRC = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">' +
  '<circle cx="24" cy="24" r="18" fill="none" stroke="#94a3b8" stroke-width="5" stroke-dasharray="28 85" stroke-linecap="round">' +
  '<animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur="1s" repeatCount="indefinite"/>' +
  '</circle></svg>'
)

// ==============================================================================================================
// BROWSER-SIDE DOWNSCALE
// ==============================================================================================================

// Shrink a still image to MAX_SIDE_PX on its longest side before it leaves the browser. This is the primary defence
// against phone photos (5 to 30 MB): the server caps are only the backstop. GIFs are returned untouched because
// redrawing one onto a canvas would keep only its first frame.
export async function downscaleInBrowser(file: File): Promise<File> {
  if (file.type === 'image/gif') return file
  try {
    // The cast is only because older TypeScript DOM typings do not know the imageOrientation option.
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' } as ImageBitmapOptions)
    const scale = Math.min(1, MAX_SIDE_PX / Math.max(bitmap.width, bitmap.height))
    if (scale === 1) {
      bitmap.close()
      return file   // already within the cap; sending the original avoids a needless re-encode
    }
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    // toBlob is callback-based; wrap it in a promise. WebP keeps transparency and is small. A browser that cannot
    // encode WebP silently hands back PNG, which is fine: the server re-encodes to WebP regardless.
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/webp', 0.85))
    if (!blob) return file
    return new File([blob], file.name, { type: blob.type })
  } catch {
    return file
  }
}

// ==============================================================================================================
// PLACEHOLDER LOOKUP
// ==============================================================================================================

type Placeholder = { node: PMNode, pos: number }

// Walk the current document for the image node carrying this upload token. `descendants` calls the callback once
// per node with that node's position; returning false stops the walk early. Returns null if the user deleted the
// placeholder (or undid the insert) while the upload was running, in which case there is nothing to swap.
//
// Matches are pushed into an array rather than assigned to a variable because TypeScript does not see assignments
// made inside a callback, and would otherwise conclude the variable is still null after the walk.
function findPlaceholder(view: EditorView, token: string): Placeholder | null {
  const matches: Placeholder[] = []
  view.state.doc.descendants((node, pos) => {
    if (node.type.name === 'image' && node.attrs.uploading === token) {
      matches.push({ node, pos })
      return false
    }
    return true
  })
  return matches[0] ?? null
}

// A random token per upload. crypto.randomUUID exists in every modern browser on https and on localhost.
function newToken(): string {
  return (typeof crypto !== 'undefined' && 'randomUUID' in crypto) ? crypto.randomUUID() : Math.random().toString(36).slice(2)
}

// ==============================================================================================================
// THE UPLOAD FLOW
// ==============================================================================================================

// Insert one placeholder per file, upload each file, and swap or remove each placeholder when its upload settles.
//
//  view  - the ProseMirror EditorView (editor.view in TipTap; handlePaste/handleDrop receive it directly)
//  files - image files from a file input, the clipboard, or a drop
//  pos   - where to insert. Omitted for the button and paste (use the caret); supplied for drop (the mouse position).
//
// Uploads run concurrently: each one finds its own placeholder by token, so they cannot interfere.
export function insertUploadingImages(view: EditorView, files: File[], pos?: number): void {
  let insertAt = pos
  for (const file of files) {
    // Type check. Cheap, and avoids a round trip for something the server would reject anyway.
    if (!ACCEPTED_TYPES.includes(file.type)) {
      addToast({ title: 'Unsupported image type', description: `${file.name} is ${file.type || 'an unknown type'}. Use PNG, JPEG, GIF, or WebP.`, color: 'danger' })
      continue
    }
    // Insert the placeholder node right away so the user sees where the image will land.
    const token = newToken()
    const node = view.state.schema.nodes.image.create({ src: PLACEHOLDER_SRC, class: 'reviewImage', uploading: token })
    let tr = view.state.tr
    if (insertAt !== undefined) {
      // Drop: insert at the mouse position, then advance so the next file lands after this one.
      try {
        tr = tr.insert(insertAt, node)
        insertAt += node.nodeSize
      } catch {
        // posAtCoords can return a position that cannot hold an inline node (between two blocks, say).
        // Fall back to the caret, same as paste.
        tr = tr.replaceSelectionWith(node)
        insertAt = undefined
      }
    } else {
      // Button/paste: replace the selection with the node. Selection moves to after the node, so multiple files
      // land in order.
      tr = tr.replaceSelectionWith(node)
    }
    view.dispatch(tr)
    // Upload in the background; the placeholder stays put (or moves with the text) until this settles.
    void uploadOne(view, file, token)
  }
}

async function uploadOne(view: EditorView, original: File, token: string): Promise<void> {
  // Downscale, then size-check the result.
  const file = await downscaleInBrowser(original)
  if (file.size > MAX_UPLOAD_BYTES) {
    removePlaceholder(view, token)
    addToast({ title: 'Image too large', description: `${original.name} is ${(file.size / 1024 / 1024).toFixed(1)} MB after resizing; the limit is ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.`, color: 'danger' })
    return
  }
  // Send it. The field name must be attached_image: that is what the Django view reads.
  const formData = new FormData()
  formData.append('attached_image', file, file.name)
  const result = await uploadReviewImage(formData)
  // The editor may have been unmounted while we waited (user navigated away). Nothing to swap in that case.
  if (view.isDestroyed) return
  // Swap or remove.
  if (result.status === 200 && result.url) {
    const found = findPlaceholder(view, token)
    if (!found) return   // user removed the placeholder mid-upload; the orphan GC will collect the stored file
    // setNodeMarkup replaces a node's attributes in place. Its position and everything around it are untouched,
    // so the caret does not jump and nothing the user typed while waiting is disturbed. Clearing `uploading`
    // is what re-enables the review box's Ready checkbox.
    const tr = view.state.tr.setNodeMarkup(found.pos, undefined, { ...found.node.attrs, src: result.url, uploading: null })
    view.dispatch(tr)
  } else {
    removePlaceholder(view, token)
    addToast({
      title: 'Image upload failed',
      description: `${result.error ?? 'Upload failed'} (HTTP ${result.status}). Please contact server administrators with CRID: ${result.crid ?? 'unknown'}.`,
      color: 'danger',
    })
  }
}

// Delete the placeholder node if it is still in the document. nodeSize is 1 for an inline leaf like an image,
// but using it rather than a literal keeps this correct if the node type ever changes.
function removePlaceholder(view: EditorView, token: string): void {
  if (view.isDestroyed) return
  const found = findPlaceholder(view, token)
  if (!found) return
  view.dispatch(view.state.tr.delete(found.pos, found.pos + found.node.nodeSize))
}
