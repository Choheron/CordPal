import { getAllArtists, getAllUploaders, getPhotoshops } from "@/app/lib/photos_utils";
import PhotoFilterBlock from "@/app/ui/dashboard/photos/photo_filter_block";
import PhotoGallery from "@/app/ui/dashboard/photos/image_gallery";
import PageTitle from "@/app/ui/dashboard/page_title";
import UploadPhotoModal from "@/app/ui/dashboard/photos/upload_photo_modal";

export default async function photos({searchParams}) {
  // Get url params
  const {uploader, artist, tagged} = await searchParams;
  // Make requests to bakend to get uploader list and artist list
  const uploaderList = await getAllUploaders();
  const artistList = await getAllArtists();

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
      <PhotoGallery 
        photos={await getPhotoshops(uploader, artist, tagged)}
      />
    </main>
  );
}
