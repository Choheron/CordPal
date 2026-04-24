import { getAllAlbums } from "@/app/lib/aotd_utils";
import AlbumsClient from "@/app/ui/dashboard/aotd/albums_client";

export default async function Page() {
  const albumData = await getAllAlbums()
  return <AlbumsClient albums={albumData['albums_list']} timestamp={albumData['timestamp']} />
}
