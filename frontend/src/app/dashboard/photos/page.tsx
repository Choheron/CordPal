import PhotoModal from "@/app/ui/dashboard/photos/photo_modal";
import PageTitle from "@/app/ui/dashboard/page_title";
import UploadPhotoModal from "@/app/ui/dashboard/photos/upload_photo_modal";

import { getAllArtists, getAllUploaders, getPhotoshops } from "@/app/lib/photos_utils";
import UserDropdown from "@/app/ui/general/userUiItems/user_dropdown";
import PhotoFilterBlock from "@/app/ui/dashboard/photos/photo_filter_block";

export default async function photos({searchParams}) {
  // Get url params
  const {uploader, artist, tagged} = await searchParams;
  // Make requests to bakend to get uploader list and artist list
  const uploaderList = await getAllUploaders();
  const artistList = await getAllArtists();

  // Load Images
  async function loadImages() {
    const fileListString: any = await getPhotoshops(uploader, artist, tagged);
    if(fileListString.length == 0) {
      return (<p>No Photos meet Filter Criteria</p>)
    }
    const fileList = fileListString.split(',')
    // Cut list into 3 different columns (into a terribly named var)
    var fileListList: any[] = [[],[],[]]
    for (let i = 0; i < fileList.length; i++) {
      // Show images in reverse order (newest uploads first)
      const photoindex = (fileList.length - (i + 1))
      // Show images newest from top left to bottom right
      const listIndex = (i - 1) % 3
      if(fileList[photoindex] == "") {
        continue
      }
      if(listIndex == 0) {
        fileListList[0].push(fileList[photoindex])
      }else if(listIndex == 1) {
        fileListList[1].push(fileList[photoindex])
      } else {
        fileListList[2].push(fileList[photoindex])
      }
    }

    return (
      <div className="flex flex-col lg:flex-row gap-6 w-full 2xl:w-3/4">
        { fileListList.map((list: string[], listIndex: number) => (
          <div key={listIndex} className="w-full flex flex-col gap-6 items-center pt-3">
            { list.map((id: string, index: number) => (
              <PhotoModal
                key={id}
                imageSrc={`/dashboard/photos/api/get-image/${id}`}
                imageID={id}
              />
            ))}
          </div>
        ))}
      </div>
    );
  }

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
      {loadImages()}
    </main>
  );
}
