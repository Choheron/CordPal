import { getAlbumAvgRating, getAlbumOfTheDayData } from "@/app/lib/spotify_utils"
import { ratingToTailwindBgColor } from "@/app/lib/utils"
import PageTitle from "@/app/ui/dashboard/page_title"
import AlbumDisplay from "@/app/ui/dashboard/spotify/album_display"
import ReviewDisplay from "@/app/ui/dashboard/spotify/review_display"
import { Badge, Button } from "@nextui-org/react"
import Link from "next/link"

// Page to display historial data for an album
export default async function Page({
  params,
}: {
  params: Promise<{ date: string }>
}) {
  const date = (await params).date
  const albumOfTheDayObj = await getAlbumOfTheDayData((await params).date)

  // Pull data from album object, return empty string if not available
  function albumData(key) {
    if(key in albumOfTheDayObj) {
      return albumOfTheDayObj[key]
    } else { 
      return ''
    }
  }
  
  return (
    <div className="flex min-h-screen flex-col items-center p-3 pb-36 pt-10">
      <PageTitle text={`Historical Album Of the Day Data - ${date}`} />
      <div className="flex flex-col w-fit justify-center md:w-4/5 gap-2">
        <p className="mx-auto">
          You are viewing historical Album Of the Day Data, you cannot make any changes or submit any new data on this page.
        </p>
        <div className="w-fit mx-auto lg:max-w-[1080px] flex flex-col gap-2 lg:flex-row">
          <div className="backdrop-blur-2xl px-3 py-3 my-2 mx-auto rounded-2xl bg-zinc-800/30 border border-neutral-800">
            <Badge
              content={(await getAlbumAvgRating(albumData('album_id'), false)).toFixed(2)} 
              size="lg" 
              placement="top-left" 
              shape="rectangle"
              showOutline={false}
              variant="shadow"
              className={`lg:-ml-4 -mt-1 ${ratingToTailwindBgColor((await getAlbumAvgRating(albumData('album_id'), false)).toFixed(2))} lg:text-xl text-black`}
            >
              <AlbumDisplay
                title={albumData("title")}
                album_img_src={albumData("album_img_src")}
                album_src={albumData("album_src")}
                album_spotify_id={albumData("album_id")}
                artist={albumData("artist")}
                submitter={albumData("submitter")}
                submitter_comment={albumData("submitter_comment")}
                submission_date={albumData("submission_date")}
              />
            </Badge>
          </div>
          <div className="backdrop-blur-2xl px-2 py-2 my-2 mx-auto rounded-2xl bg-zinc-800/30 border border-neutral-800">
            <ReviewDisplay
              album_id={albumData("album_id")}
            />
          </div>
        </div>
        <Button 
          as={Link}
          href={"/dashboard/spotify"}
          radius="lg"
          className="w-fit mx-auto hover:underline" 
          variant="bordered"
        >
          Return to Main Page
        </Button> 
      </div>
    </div>    
  )
}