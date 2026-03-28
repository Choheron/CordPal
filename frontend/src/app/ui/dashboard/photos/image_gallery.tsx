"use client"

// PhotoGallery - Masonry grid layout for the photoshops page
//
//
// Expected Props:
//  - photos: String - Comma-separated list of image GUIDs returned by getPhotoshops()

import LazyPhotoCard from "./lazy_photo_card"

export default function PhotoGallery(props) {
  const fileListString: any = props.photos

  // Empty state — no photos match the current filter
  if(fileListString.length == 0) {
    return (<p>No Photos meet Filter Criteria</p>)
  }

  // Split CSV string into array, strip any empty entries (e.g. trailing comma),
  // and reverse so newest uploads appear first (top-left to bottom-right in columns)
  const fileList: string[] = fileListString
    .split(',')
    .filter((id: string) => id !== '')
    .reverse()

  return (
    // CSS columns masonry:
    //   columns-1  → single column on mobile
    //   sm:columns-2 → two columns at sm (640px+)
    //   lg:columns-4 → four columns at lg (1024px+)
    //   gap-6 sets the horizontal gap between columns
    //   2xl:w-3/4 keeps the gallery centered on very wide screens
    <div className="columns-1 sm:columns-2 lg:columns-4 gap-6 w-full 2xl:w-3/4">
      {fileList.map((id: string) => (
        // break-inside-avoid prevents the column renderer from splitting this wrapper
        // div across a column break, which would visually chop a card in half.
        // mb-6 provides vertical spacing between cards in the same column.
        <div key={id} className="mb-6 break-inside-avoid">
          <LazyPhotoCard
            imageSrc={`/dashboard/photos/api/get-image/${id}`}
            imageID={id}
          />
        </div>
      ))}
    </div>
  )
}
