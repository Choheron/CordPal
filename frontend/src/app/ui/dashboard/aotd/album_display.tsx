import { Conditional } from "../conditional"
import UserCard from '../../general/userUiItems/user_card';
import StarRating from '../../general/star_rating';
import { getAlbumAvgRating } from '@/app/lib/aotd_utils';
import Image from "next/image";
import Link from 'next/link'
import { milliToString, ratingToTailwindBgColor } from "@/app/lib/utils";
import ClientTimestamp from "../../general/client_timestamp";

import { Badge } from "@heroui/badge";
import { Button } from "@heroui/button";
import { Tooltip } from "@heroui/tooltip";

type AlbumDisplayProps = {
  title: string;                                            // Title of the album
  disambiguation?: string;                                  // Disambiguation of the album (e.g. "Standard Edition")
  album_img_src: string;                                    // URL to access the album image [EXTERNAL]
  album_src: string;                                        // URL for user to access the album [EXTERNAL]
  artist: {
    name: string;                                           // Name of the artist
    href: string;                                           // URL to access the artist on external [EXTERNAL]
  };
  submitter?: string;                                       // Discord ID of the user that submitted this album
  owner?: string;                                           // Discord ID of current owner of album, OPTIONAL as this will only be passed if the owner is not the submitter
  submitter_comment?: string;                               // Optional comment left by the album submitter
  submission_date?: string;                                 // String representation of the submission date
  transfer_date?: string;                                   // String representation of the transfer date, OPTIONAL as this will only be passed if the owner is not the submitter
  release_date?: string;                                    // String representation of the release date
  release_date_precision?: 'year' | 'month' | 'day';        // Preciseness of release date string, defaults to "day"
  album_mbid?: string;                                      // Album MusicBrainz ID
  album_id?: string;                                        // Album MusicBrainz ID
  historical_date?: string;                                 // Date this album was Album of the Day (for historical displays)
  showAlbumRating?: boolean;                                // Show the average user rating for the album, defaults to true
  showCalLink?: boolean;                                    // Show a button to navigate to the calendar date displayed, defaults to false
  trackCount?: number;                                      // Number of songs in the album, shown if provided
  member_status?: boolean;                                  // Whether the user is a member of the desired server
  vertical?: boolean;                                       // Display vertically instead of side by side
  trackList?: { length: number; [key: string]: unknown }[]; // The tracks contained in the album
  hideScore?: boolean;                                      // Hide the score of the album
}

// GUI Display for an Album
export default async function AlbumDisplay(props: AlbumDisplayProps) {
  // Configuration Props
  const showAlbumRating = (props.showAlbumRating == false) ? props.showAlbumRating : true;
  const trackCount = (props.trackCount) ? props.trackCount : null;
  // Album props checks
  const title = (props.title) ? props.title : "No Album Title Found";
  const disambiguation = (props.disambiguation) ? props.disambiguation : "Standard Edition"
  const album_url = (props.album_src) ? props.album_src : "https://www.google.com/search?q=sad+face";
  const album_page_url = (props.album_mbid) ? `/dashboard/aotd/album/${props.album_mbid}` : album_url;
  const album_img_src = (props.album_img_src) ? props.album_img_src : "/images/DALL-E_Album_Not_Found.webp";
  const album_cover_url = (props.album_mbid) ? `/dashboard/aotd/api/album-cover/${props.album_mbid}` : album_img_src;
  // Artist props
  const artist_name = (props.artist && props.artist['name']) ? props.artist['name'] : "Artist Name not Found";
  const artist_url = (props.artist && props.artist['href']) ? props.artist['href'] : "https://www.google.com/search?q=sad+face";
  // Add UI for display of owner if the owner is not the submitter
  const owner = (props.owner != '') ? props.owner : null;
  const transfer_date: string = (props.transfer_date) ? props.transfer_date : "01/01/0001, 01:01:01";
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
  const avg_rating = (props.album_mbid && showAlbumRating) ? await getAlbumAvgRating(props.album_mbid, false, historical_date): 11;
  // Vertical Override
  const vertical = (props.vertical) ? props.vertical : false;
  // Track List
  const track_list = (props.trackList) ? props.trackList : null;
  // Hide album score
  const hideScore = (props.hideScore) ? props.hideScore : false;
  

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
      return milliToString(milliseconds)
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
            src={album_cover_url}
            title={`Album Cover for ${title} by ${artist_name}`}
            alt={`Album Cover for ${title} by ${artist_name}`}
            className='rounded-2xl mx-auto object-cover'
            fill={true}
            unoptimized={true}
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
          <Conditional showWhen={trackCount != null}>
            <p className="text-sm -my-1">{trackCount} songs</p>
          </Conditional>
          <Conditional showWhen={track_list?.length != 0}>
            <p className="text-sm -my-1">{calcAlbumLength()}</p>
          </Conditional>
          <div className="flex flex-col gap-1 mt-0.5">
            <Conditional showWhen={userAuth && (owner != null)}>
              <div className="flex items-center justify-start gap-2">
                <p className="text-xs text-yellow-400/80 w-14 text-right shrink-0">Owner</p>
                <UserCard
                  userDiscordID={owner}
                  avatarClassNameOverride={"flex-shrink-0 size-[20px] sm:size-[32px]"}
                  fallbackName={"User Not Found"}
                  isProfileLink
                />
                <ClientTimestamp className="text-xs italic text-neutral-500" timestamp={transfer_date} full={false}/>
              </div>
            </Conditional>
            <Conditional showWhen={userAuth && (props.submitter != null)}>
              <div className="flex items-center gap-2">
                <p className={`text-xs w-14 text-right shrink-0 ${owner != null ? "text-neutral-500" : "text-neutral-400"}`}>
                  {owner != null ? "Original" : "Submitted"}
                </p>
                <UserCard
                  userDiscordID={submitter}
                  avatarClassNameOverride={"flex-shrink-0 size-[20px] sm:size-[32px]"}
                  fallbackName={"User Not Found"}
                  isProfileLink
                />
                <ClientTimestamp className="text-xs italic text-neutral-500" timestamp={submission_date} full={false}/>
              </div>
            </Conditional>
          </div>
          <Conditional showWhen={(avg_rating != 11) && ((avg_rating != null) && showAlbumRating) && !hideScore}>
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
                  textSize="text-lg md:text-2xl lg:text-4xl"
                />
              </div>
            </div>
          </Conditional>
          <Conditional showWhen={historical && showCalLink}>
            <Link
              href={`/dashboard/aotd/calendar/${dateToCalUrl(historical_date)}`}
            >
              <Button 
                className="bg-gradient-to-br from-green-700/80 to-green-800/80"
                variant="solid"
              >
                Go to {dateToCalUrl(historical_date)}
              </Button>
            </Link>
          </Conditional>
        </div>
      </div>
      <Conditional showWhen={submitter_comment != "No Comment Provided"}>
        <div className="w-full max-w-full pt-2">
          <p className="text-sm italic text-gray-300 pl-2">Submitter included the following comment:</p>
          <div className="rounded-2xl p-2 text-sm bg-black/20 border border-neutral-800 max-h-32 sm:max-h-20 overflow-y-auto">
            {submitter_comment}
          </div>
        </div>
      </Conditional>
    </div>
  )
}