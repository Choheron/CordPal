import { getAlbum, getAlbumAvgRating, getAlbumOfTheDayData } from "@/app/lib/spotify_utils"
import { ratingToTailwindBgColor } from "@/app/lib/utils"
import PageTitle from "@/app/ui/dashboard/page_title"
import AlbumDisplay from "@/app/ui/dashboard/spotify/album_display"
import ReviewDisplay from "@/app/ui/dashboard/spotify/review_display"
import { Badge, Button } from "@nextui-org/react"
import Link from "next/link"

// Page to display data for a specific album
export default async function Page({
  params,
}: {
  params: Promise<{ albumid: string }>
}) {
  // Retrieive prop of albumid from url
  const albumid = (await params).albumid
  // Retrieve data about album from backend
  const albumObj = await getAlbum(albumid)
  

  // Pull data from album object, return empty string if not available
  function albumData(key) {
    if(key in albumObj) {
      return albumObj[key]
    } else { 
      return ''
    }
  }
  
  return (
    <div className="flex min-h-screen flex-col items-center p-3 pb-36 pt-10">
      <PageTitle text={`${albumData("title")}`} />
      <div className="flex flex-col w-fit justify-center md:w-4/5 gap-2">
        <div className="w-fit mx-auto lg:max-w-[1080px] flex flex-col gap-2 lg:flex-row backdrop-blur-2xl px-2 py-2 my-2 rounded-2xl bg-zinc-800/30 border border-neutral-800">
          <AlbumDisplay 
            title={albumData("title")}
            album_img_src={albumData("album_img_src")}
            album_src={albumData("album_src")}
            artist={albumData("artist")}
            submitter={albumData("submitter")}
            submitter_comment={albumData("submitter_comment")}
            submission_date={albumData("submission_date")}
          />
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