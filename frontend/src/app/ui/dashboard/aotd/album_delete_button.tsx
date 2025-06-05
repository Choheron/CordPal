// app/ui/dashboard/aotd/album_delete_button.tsx
'use client'

import { deleteAlbumFromBackend } from "@/app/lib/aotd_utils"
import DeleteModal from "@/app/ui/general/modals/delete_modal"

export default function AlbumDeleteButton({
  albumid,
  albumTitle,
  aotd_dates,
}: {
  albumid: string
  albumTitle: string
  aotd_dates: any
}) {
  const handleDelete = async (reason) => {
    console.log(`Delete confirmed for album ${albumid}...`)
    const status = await deleteAlbumFromBackend(albumid, reason)
    return status
  }

  return (
    <DeleteModal
      confirmCallback={handleDelete}
      cancelCallback={null}
      isButtonDisabled={aotd_dates.length > 0}
      tooltipContent={(aotd_dates.length > 0) ? "Album cannot be deleted, it has been AOtD!" : "Delete Album"}
      titleText={`Delete "${albumTitle}"?`}
      bodyText={`Are you sure you want to delete "${albumTitle}"? You cannot undo this action.`}
      redirectText={'/dashboard/aotd'}
      textboxDescription={"Reason for deletion (Optional)"}
      textboxPlaceholder="(Optional) Input a reason for deleting the album."
    />
  )
}
