import { Suspense } from "react";
import { getAllAlbums } from "@/app/lib/aotd_utils";
import AlbumsClient from "@/app/ui/dashboard/aotd/albums_client";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Album Search"
  }
}

export default async function Page() {
  const albumData = await getAllAlbums()
  return (
    <Suspense>
      <AlbumsClient albums={albumData['albums_list']} timestamp={albumData['timestamp']} />
    </Suspense>
  )
}
