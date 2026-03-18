import { getAllArtists, getAllUploaders, getPhotoshops } from "@/app/lib/photos_utils";
import PhotoFilterBlock from "@/app/ui/dashboard/photos/photo_filter_block";
import PhotoGallery from "@/app/ui/dashboard/photos/image_gallery";
import PageTitle from "@/app/ui/dashboard/page_title";
import UploadPhotoModal from "@/app/ui/dashboard/photos/upload_photo_modal";
import { Suspense } from "react";

async function GalleryLoader({uploader, artist, tagged}) {
  const photos = await getPhotoshops(uploader, artist, tagged);
  return <PhotoGallery photos={photos} />;
}

export default async function photos({searchParams}) {
  // Get url params
  const {uploader, artist, tagged} = await searchParams;
  // Fetch uploader and artist lists in parallel
  const [uploaderList, artistList] = await Promise.all([getAllUploaders(), getAllArtists()]);

  return (
    <main className="flex flex-col items-center lg:px-24 pt-10">
      <PageTitle text="Photoshops" />
      <UploadPhotoModal />
      <PhotoFilterBlock
        uploader={(uploader != undefined) ? uploader : null}
        uploaderList={uploaderList}
        artist={(artist != undefined) ? artist : null}
        artistList={artistList}
        //tagged={tagged}
      />
      <Suspense fallback={<p>Loading photos...</p>}>
        <GalleryLoader uploader={uploader} artist={artist} tagged={tagged} />
      </Suspense>
    </main>
  );
}
