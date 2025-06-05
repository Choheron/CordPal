'use server'

import { Conditional } from "../conditional"
import {Popover, PopoverTrigger, PopoverContent} from "@heroui/popover";
import UserCard from '../../general/userUiItems/user_card';
import StarRating from '../../general/star_rating';
import { getAlbumAvgRating } from '@/app/lib/aotd_utils';
import Image from "next/image";
import { Badge, Button, Tooltip } from "@heroui/react";
import Link from 'next/link'
import { ratingToTailwindBgColor } from "@/app/lib/utils";
import ClientTimestamp from "../../general/client_timestamp";

// GUI Display for an Album
// Expected Props:
//  - title: String - Title of the Album
//  - disambiguation: String - Disambiguation of the album
//  - album_img_src: string - Url to access the album image [EXTERNAL]
//  - album_src: string - Url for user to access the album [EXTERNAL]
//  - artist: Object - Object of Artist Data (Expected fields in object below)
//      > name: String - Name of Artist
//      > href: String - Url to access artist on spotify [EXTERNAL URL]
//  - submitter: String - (Optional) The discord id of the user that submitted this album, not applicable in all use cases
//  - submitter_comment: String - (Optional) An optional comment that the album submitter may have left with this album
//  - submission_date: String - (Optional) A String representation of the submission date of the Album
//  - release_date: String - (Optional) A String representation of the release date of the Album
//  - release_date_precision: String - (Optional) Preciseness of release date string. Must be "year", "month" or "day". Defaults to "day"
//  - album_mbid: String - (Optional) Album Spotify ID for retrieval of average from database
//  - historical_date: String - (Optional) Date in which this album was Album Of the Day (THIS IS FOR HISTORICAL DISPLAYS)
//  - showAlbumRating: Boolean - (Optional) [DEFAULT TRUE] Show the average user rating for the album
//  - showCalLink: Boolean - (Optional) [DEFAULT FALSE] Show a button for the user to go to the calendar date displayed
//  - trackCount: Boolean - (Optional) Number of songs in the album, if provided, will show.
//  - member_status: Boolean - (Optional) Is the user a member of the desired server?
//  - vertical: Boolean - (Optional) Is this to be a vertical display instead of side by side?
//  - trackList: List of Objects - (Optional) The tracks contained in the album
export default async function AlbumDisplay(props) {
  // Configuration Props
  const showAlbumRating = (props.showAlbumRating == false) ? props.showAlbumRating : true;
  const trackCount = (props.trackCount) ? props.trackCount : null;
  // Album props checks
  const title = (props.title) ? props.title : "No Album Title Found";
  const disambiguation = (props.disambiguation) ? props.disambiguation : "Standard Edition"
  const album_url = (props.album_src) ? props.album_src : "https://www.google.com/search?q=sad+face";
  const album_page_url = (props.album_mbid) ? `/dashboard/aotd/album/${props.album_mbid}` : album_url;
  const album_img_src = (props.album_img_src) ? props.album_img_src : "/images/DALL-E_Album_Not_Found.webp";
  // Artist props checks
  const artist_name = (props.artist && props.artist['name']) ? props.artist['name'] : "Artist Name not Found";
  const artist_url = (props.artist && props.artist['href']) ? props.artist['href'] : "https://www.google.com/search?q=sad+face";
  // User rating props checks
  const submitter = (props.submitter) ? props.submitter : "Not Provided";
  const submitter_comment = (props.submitter_comment) ? props.submitter_comment : "No Comment Provided";
  const submission_date: string = (props.submission_date) ? props.submission_date : "Not Provided";
  const release_date: string = (props.release_date) ? props.release_date : "Unknown";
  const release_date_precision: string = (props.release_date_precision) ? props.release_date_precision : "day";
  // Historical props checks
  const historical = (props.historical_date) ? true : false;
  const historical_date = (props.historical_date) ? props.historical_date : null;
  const showCalLink = (props.showCalLink) ? props.showCalLink : false;
  // Check that user is authenticated
  const userAuth = (props.member_status) ? props.member_status : true;
  // Rating props check
  const avg_rating = (props.album_mbid && showAlbumRating) ? await getAlbumAvgRating(props.album_mbid, false, historical_date): 0.0;
  // Vertical Override
  const vertical = (props.vertical) ? props.vertical : false;
  // Track List
  const track_list = (props.trackList) ? props.trackList : null;
  

  const dateToCalUrl = (dateStr) => {
    if(dateStr == null) {
      return ""
    }
    const dateArr = dateStr.split("-")

    return `${dateArr[0]}/${dateArr[1]}/${dateArr[2]}`
  }

  const calcAlbumLength = () => {
    if(track_list) {
      const milliseconds = track_list.reduce((sum, curr) => sum + curr['length'], 0)
    
      const seconds = Math.floor((milliseconds / 1000) % 60)
      const minutes = Math.floor((milliseconds / (1000 * 60)) % 60)
      const hours = Math.floor(milliseconds / (1000 * 60 * 60))

      const m = minutes.toString().padStart(2, '0')
      const s = seconds.toString().padStart(2, '0')

      return hours > 0 ? `${hours}h ${m}m ${s}s` : `${m}m ${s}s`
    }
  }

  return (
    <div className="w-full lg:min-w-[650px] max-w-full mx-auto lg:mx-1 my-auto block overflow-hidden text-ellipsis font-extralight">
      <div className={`w-full my-auto flex ${(vertical) ? "flex-col" : "flex-row" } `}>
        <Link 
          href={album_page_url}
          className="relative shrink-0 h-[125px] w-[125px] md:h-[300px] md:w-[300px]"
        >
          <Image
            src={`/dashboard/aotd/api/album-cover/${props.album_mbid}`}
            title={`Album Cover for ${title} by ${artist_name}`}
            alt={`Album Cover for ${title} by ${artist_name}`}
            className='rounded-2xl mx-auto object-cover'
            fill={true}
          />
        </Link>
        <div className="w-full max-w-full flex flex-col lg:gap-2 pl-2 lg:pl-4 pt-1 lg:pt-2 my-auto">
          <a title={title} href={album_url} target="_noreferrer" className="text-xl lg:text-3xl hover:underline w-fit line-clamp-1">
            <b>{title}</b>
          </a>
          <p className="-mt-2 italic">{disambiguation}</p>
          <a title={artist_name} href={artist_url} target="_noreferrer" className="text-sm lg:text-xl hover:underline -mt-2 w-fit">
            {artist_name}
          </a>
          <Conditional showWhen={release_date != "Unknown"}>
            <div className="text-xs lg:text-sm lg:-mt-2">
              <ClientTimestamp 
                className="" 
                timestamp={release_date} 
                full={false} 
                maintainUTC={true}
                datePrecision={release_date_precision}
              />
            </div>
          </Conditional>
          <Conditional showWhen={trackCount}>
            <p className="text-sm -my-1">{trackCount} songs</p>
          </Conditional>
          <Conditional showWhen={track_list}>
            <p className="text-sm -my-1">{calcAlbumLength()}</p>
          </Conditional>
          <Conditional showWhen={userAuth && props.submitter}>
            <div className="">
              <p className="text-xs sm:text-base">Submitter: </p>
              <div className="ml-2 -mb-1">
                <Badge 
                  content=" " 
                  size="sm" 
                  placement="top-left"
                  isInvisible={submitter_comment == "No Comment Provided"}
                  shape="circle"
                  className="bg-blue-300 -ml-2"
                >
                    <Tooltip 
                      content={
                        <p className="w-[300px]">
                          {submitter_comment}
                        </p>
                      }
                      showArrow
                      isDisabled={submitter_comment == "No Comment Provided"}
                      classNames={{
                        content: ["w-fit"],
                      }}
                    >
                      <div>
                        <UserCard 
                          userDiscordID={submitter} 
                          avatarClassNameOverride={"flex-shrink-0 size-[20px] sm:size-[40px]"}
                          fallbackName={"User Not Found"}
                          isProfileLink
                        />
                      </div>
                    </Tooltip>
                </Badge>
              </div>
            </div>
            <div className="flex text-xs lg:text-sm sm:-mt-2">
              <p>Submitted:</p>
              <ClientTimestamp className="italic pl-1" timestamp={submission_date} full={false}/>
            </div>
          </Conditional>
          <Conditional showWhen={(avg_rating != 0) && ((avg_rating != null) && showAlbumRating)}>
            <div className="text-xs lg:text-base">
              <div className="flex mb-1">
                <p>Average {(userAuth) ? "User":"Member"} Rating: </p>
                <p className={`ml-2 px-2 rounded-xl text-black ${ratingToTailwindBgColor(avg_rating)}`}>
                  <b>{avg_rating.toFixed(2)}</b>
                </p>
              </div>
              <div className="ml-2 w-fit">
                <StarRating 
                  className="text-yellow-400 text-xl"
                  rating={avg_rating} 
                  textSize="text-2xl lg:text-4xl"
                />
              </div>
            </div>
          </Conditional>
          <Conditional showWhen={historical && showCalLink}>
            <Button 
              as={Link}
              className="bg-gradient-to-br from-green-700/80 to-green-800/80"
              href={`/dashboard/aotd/calendar/${dateToCalUrl(historical_date)}`}
              variant="solid"
            >
              Go to {dateToCalUrl(historical_date)}
            </Button>
          </Conditional>
        </div>
      </div>
    </div>
  )
}