'use server'

import { deleteAlbumFromBackend, getAlbum, getAlbumAvgRating, getAlbumOfTheDayData, getAotdData, getAotdDates } from "@/app/lib/aotd_utils"
import { isUserAdmin, isUserAlbumUploader } from "@/app/lib/user_utils"
import { milliToString, monthToName, ratingToTailwindBgColor } from "@/app/lib/utils"
import { Conditional } from "@/app/ui/dashboard/conditional"
import PageTitle from "@/app/ui/dashboard/page_title"
import AlbumDisplay from "@/app/ui/dashboard/aotd/album_display"
import ReviewDisplay from "@/app/ui/dashboard/aotd/review_display"
import { Button, Divider } from "@heroui/react"
import Link from "next/link"
import AlbumDeleteButton from "@/app/ui/dashboard/aotd/album_delete_button"

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
  // Parse track data list from album data
  const trackList = ((albumObj['track_list']) ? albumObj['track_list']['tracks'] : { "tracks": [] })
  // Retrieve aotd_dates list from backend
  const aotd_dates = await getAotdDates(albumid)
  // Store average ratings in object
  let ratingsObj = {}
  for (const date of aotd_dates) {
    ratingsObj[date] = (await getAlbumAvgRating(albumid, false, date)).toFixed(2)
  }
  // Determine if user is admin
  let isAdmin = await isUserAdmin()
  // Determine if user is the uploader of the album
  let isUploader = await isUserAlbumUploader(albumid)
  

  // Box of historical review dates - Generate series of review displays based on dates
  const pastReviewsBox = () => {
    return aotd_dates.reverse().map((date, index) => {
      const dateArr = date.split("-")
      return (
          <div 
            key={index} 
            className="flex flex-col h-fit backdrop-blur-2xl px-2 py-2 my-2 rounded-2xl bg-zinc-800/30 border border-neutral-800"
          >
            <div className="flex w-full">
              <p className={`w-fit h-fit my-auto ${ratingToTailwindBgColor(ratingsObj[date])} px-2 py-1 rounded-full text-black`}>
                <b>{ratingsObj[date]}</b>
              </p>
              <p className="w-fit ml-auto text-xl rounded-tr-2xl rounded-bl-2xl bg-zinc-800/30 border border-neutral-800 px-2 -mr-2 py-2 -mt-2">
                {monthToName(dateArr[1])} {dateArr[2]}, {dateArr[0]}
              </p>
            </div>
            <ReviewDisplay
              album_id={albumData("album_id")}
              date={date}
            />
            <Divider className="mb-2" />
            <Button
              as={Link}
              href={`/dashboard/aotd/calendar/${dateArr[0]}/${dateArr[1]}/${dateArr[2]}`}
              className={`bg-gradient-to-br from-green-700/80 to-green-800/80 text-black w-1/2 mx-auto`}
              variant="solid"
            >
              <b>View Day Page</b>
            </Button>
          </div>
      )
    })
  }

  // Pull data from album object, return empty string if not available
  function albumData(key) {
    if(key in albumObj) {
      return albumObj[key]
    } else { 
      return ''
    }
  }

  
  // Tracklist Box
  const trackListBox = () => {
    // {
    //   id: '5feac6c9-8dd1-444b-a271-addc095b8ff9',
    //   title: "We Can't Stop (acoustic version)",
    //   length: 172000,
    //   number: '3',
    //   position: 3,
    //   recording: {
    //     id: '9bb72e29-eccb-4665-9021-8f62cfc98610',
    //     title: "We Can't Stop (acoustic version)",
    //     video: false,
    //     length: 172000,
    //     'artist-credit': [Array],
    //     disambiguation: '',
    //     'first-release-date': '2013-07-20'
    //   },
    //   'artist-credit':  [
    //      { name: 'Tyler Ward', artist: [Object], joinphrase: ', ' },
    //      { name: 'Kina Grannis', artist: [Object], joinphrase: ' & ' },
    //      { name: 'Lindsey Stirling', artist: [Object], joinphrase: '' }
    //    ]
    // }
    const trackObj = (trackData, index = 0) => {
      const lengthString = milliToString(trackData['length'])
      const artistCredit = (trackData['artist-credit']) ? trackData['artist-credit'] : []

      return (
        <div key={index}>
          <div className="flex gap-1">
            <div className="w-[25px]">
              <p className="text-xl mx-auto w-fit">{`${trackData['position']}. `}</p>
            </div>
            <div className="w-full">
              <p className="text-xl line-clamp-1">{trackData['title']}</p>
              <p className="italic text-base">
                {artistCredit.map((artistObj) => {
                  return artistObj['name']
                }).join(", ")}
              </p>
              <p className="text-sm">{lengthString}</p>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="relative w-fit lg:max-w-[1080px] flex flex-col gap-2 backdrop-blur-2xl px-2 py-2 my-2 rounded-2xl bg-zinc-800/30 border border-neutral-800">
        <p className="text-xl lg:text-2xl mx-auto">Tracklist:</p>
        {trackList.map((track, index) => {
          return (
            trackObj(track, index)
          )
        })}
      </div>
    )
  }


  return (
    <div className="flex flex-col items-center p-3 pb-36 pt-10">
      <PageTitle text={`${albumData("title")}`} />
      <Button 
        as={Link}
        href={"/dashboard/aotd"}
        radius="lg"
        className="w-fit mx-auto hover:underline" 
        variant="bordered"
      >
        Return to Main Page
      </Button> 
      <div className="flex flex-col sm:flex-row w-full md:w-9/10 justify-center gap-2">
        {/* Album Display and Previous Review Display */}
        <div className="flex flex-col justify-start gap-2">
          <div className="flex mx-auto gap-2 h-fit">
            <div className="relative w-fit h-fit lg:max-w-[1080px] flex flex-col gap-2 lg:flex-row backdrop-blur-2xl px-2 py-2 my-2 rounded-2xl bg-zinc-800/30 border border-neutral-800">
              <AlbumDisplay 
                title={albumData("title")}
                disambiguation={albumData("disambiguation")}
                album_img_src={albumData("album_img_src")}
                album_mbid={albumData("album_id")}
                album_src={albumData("album_src")}
                artist={albumData("artist")}
                submitter={albumData("submitter")}
                submitter_comment={albumData("submitter_comment")}
                submission_date={albumData("submission_date")}
                release_date={albumData('release_date')}
                release_date_precision={albumData("release_date_precision")}
                trackCount={albumData("track_list")['tracks']?.length}
                trackList={albumData("track_list")['tracks']}
                showAlbumRating={false}
              />
              <Conditional showWhen={isAdmin || isUploader}>
                <div className="absolute -top-1 right-1 ">
                  <AlbumDeleteButton albumid={albumid} albumTitle={albumData("title")} aotd_dates={aotd_dates}/>
                </div>
              </Conditional>
            </div>
          </div>
          <Conditional showWhen={aotd_dates.length > 0}>
            <div className='w-full'>
              <p className='text-2xl w-fit mx-auto font-extralight'>
                Previous Album of the Day Appearances
              </p>
              <div className="flex justify-around">
                {pastReviewsBox()}
              </div>
            </div>
          </Conditional>
        </div>
        {/* Tracklist Display */}
        {trackListBox()}
      </div>
    </div>    
  )
}