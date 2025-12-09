"use client"

import { useEffect, useState } from "react"
import PhotoModal from "./photo_modal"

export default function PhotoGallery(props) {
  const fileListString: any = props.photos
  // Track screen width
  const [windowWidth, setWindowWidth] = useState(0);

  useEffect(() => {
    // Get Window Width
    if (typeof window !== "undefined") {
      setWindowWidth(window.innerWidth)
    }
  }, [])
  
  const loadImages = () => {
    const fileList = fileListString.split(',')
    // Cut list into 3 different columns (into a terribly named var)
    var fileListList: any[] = [[],[],[],[]]
    for (let i = 0; i < fileList.length; i++) {
      // Show images in reverse order (newest uploads first)
      const photoindex = (fileList.length - (i + 1))
      var listIndex = 0
      if(windowWidth >= 1024) {
        // Show images newest from top left to bottom right (Otherwise put them all in the same list)
        listIndex = (i - 1) % 4
      }
      if(fileList[photoindex] == "") {
        continue
      }
      if(listIndex == 0) {
        fileListList[0].push(fileList[photoindex])
      }else if(listIndex == 1) {
        fileListList[1].push(fileList[photoindex])
      } else if(listIndex == 2) {
        fileListList[2].push(fileList[photoindex])
      } else {
        fileListList[3].push(fileList[photoindex])
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
    )
  }

  
  // Return basic string if no photos found
  if(fileListString.length == 0) {
    return (<p>No Photos meet Filter Criteria</p>)
  }
  return(
    <>
      {loadImages()}
    </>
  )
}