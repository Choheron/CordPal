import { Conditional } from "../conditional"
import {Popover, PopoverTrigger, PopoverContent} from "@heroui/popover";
import UserCard from '../../general/userUiItems/user_card';
import StarRating from '../../general/star_rating';
import { getAlbumAvgRating } from '@/app/lib/aotd_utils';
import { Badge, Button, Tooltip } from "@heroui/react";
import Link from "next/link";
import { ratingToTailwindBgColor } from "@/app/lib/utils";
import Image from "next/image";

// MINIMAL GUI Display for an Album
// Expected Props:
//  - title: String - Title of the Album
//  - album_img_src: string - Url to access the album image [EXTERNAL]
//  - album_src: string - Url for user to access the album [EXTERNAL]
//  - artist: Object - Object of Artist Data (Expected fields in object below)
//      > name: String - Name of Artist
//      > href: String - Url to access artist on spotify [EXTERNAL URL]
//  - submitter: String - (Optional) The discord id of the user that submitted this album, not applicable in all use cases
//  - submitter_comment: String - (Optional) An optional comment that the album submitter may have left with this album
//  - submission_date: String - (Optional) A String representation of the submission date of the Album
//  - album_mbid: String - (Optional) Album Spotify ID for retrieval of average from database
//  - historical_date: String - (Optional) Date in which this album was Album Of the Day (THIS IS FOR HISTORICAL DISPLAYS)
//  - showAlbumRating: Boolean - (Optional) [DEFAULT 0] 0: Show no ratings, 1: Show stars, 2: Show stars and number
//  - showSubmitInfo: Boolean - (Optional) [DEFAULT FALSE] Show the submission info for the album
//  - ratingOverride: int - (Optional) Override the rating to show a custom one
//  - sizingOverride: String - (Optional) Override the image and button sizing tailwind
//  - buttonUrlOverride: String - (Optional) Override the link that is accessed when the user clicks on the album display
//  - titleTextOverride: String - (Optional) Override the tailwind css for the title text
//  - artistTextOverride: String - (Optional) Override the tailwind css for the artist text
//  - starTextOverride: String - (Optional) Override the tailwind css for the star rating text
//  - albumCoverOverride: String (Optional) Override for album display
export default async function MinimalAlbumDisplay(props) {
  // Configuration Props
  const showAlbumRating = (props.showAlbumRating) ? props.showAlbumRating : 0;
  const showSubmitInfo = (props.showSubmitInfo) ? props.showSubmitInfo : false;
  // Album props checks
  const title = (props.title) ? props.title : "No Album Title Found";
  const album_url = (props.album_src) ? props.album_src : "https://www.google.com/search?q=sad+face";
  const album_cover_src = (props.album_img_src) ? props.album_img_src : "/images/DALL-E_Album_Not_Found.webp";
  const album_cover_url = (props.album_mbid) ? `/dashboard/aotd/api/album-cover/${props.album_mbid}` : album_cover_src;
  // Artist props checks
  const artist_name = (props.artist && props.artist['name']) ? props.artist['name'] : "Artist Name not Found";
  const artist_url = (props.artist && props.artist['href']) ? props.artist['href'] : "https://www.google.com/search?q=sad+face";
  // User rating props checks
  const submitter = (props.submitter) ? props.submitter : "Not Provided";
  const submitter_comment = (props.submitter_comment) ? props.submitter_comment : "No Comment Provided";
  const submission_date: string = (props.submission_date) ? props.submission_date : "Not Provided";
  // Rating props check
  const avg_rating = (props.ratingOverride != null) ? (props.ratingOverride) : ((props.album_mbid && (showAlbumRating != 0)) ? (await getAlbumAvgRating(props.album_mbid, false)) : 0.0);
  const rating_override = (props.ratingOverride) ? props.ratingOverride : false;
  // Historical props checks
  const historical = (props.historical_date) ? true : false;
  const historical_date: string = (props.historical_date) ? props.historical_date : "0000-00-00";
  // Sizing overrides 
  const sizingOverride = (props.sizingOverride) ? props.sizingOverride : "h-[125px] w-[125px] lg:h-[300px] lg:w-[300px]"
  const buttonUrlOverride = (props.buttonUrlOverride) ? props.buttonUrlOverride : `/dashboard/aotd/album/${props.album_mbid}`
  const titleTextOverride = (props.titleTextOverride) ? props.titleTextOverride : 'text-center text-xl lg:text-3xl text-wrap'
  const artistTextOverride = (props.artistTextOverride) ? props.artistTextOverride : 'text-center text-sm lg:text-xl italic text-wrap'
  const starTextOverride = (props.starTextOverride) ? props.starTextOverride : 'text-xl 3xl:text-3xl'
  const albumCoverOverride = (props.albumCoverOverride) ? `${sizingOverride} ${props.albumCoverOverride}` : `${sizingOverride} my-auto rounded-2xl`
  // Tooltip disabled overhaul
  const tooltipDisabled = (props.tooltipDisabled) ? props.tooltipDisabled : false;

  const tooltipContent = () => {
    return (
      <div className="max-w-full">
        <p className={titleTextOverride}>
          {title}
        </p>
        <p className={artistTextOverride}>
          {artist_name}
        </p>
        <Conditional showWhen={(submitter && showSubmitInfo)}>
          <div className="-mb-4 w-fit mx-auto">
            <UserCard 
              userDiscordID={submitter} 
              fallbackName={"User Not Found"}
              customDescription={(
                <p>
                  Submitter
                </p>
              )}
            />
          </div>
        </Conditional>
        <Conditional showWhen={((avg_rating != null) && showAlbumRating != 0)}>
          <div className="w-full">
            <Conditional showWhen={showAlbumRating == 2} >
                <p className={`w-fit mx-auto px-2 rounded-xl text-black ${ratingToTailwindBgColor((rating_override) ? rating_override : avg_rating)}`}>
                  <b>{avg_rating.toFixed(2)}</b>
                </p>
            </Conditional>
            <div className="w-fit mx-auto mt-2">
              <StarRating 
                className="text-yellow-400"
                rating={(rating_override) ? rating_override : avg_rating} 
                textSize={starTextOverride}
              />
            </div>
          </div>
        </Conditional>
      </div>
    )
  }


  return (
    <div className={`relative group ${albumCoverOverride}`}>
      <Tooltip 
        content={tooltipContent()}
        showArrow
        className={`max-h-fit`}
        isDisabled={tooltipDisabled}
      >
        <Button
          as={Link}
          prefetch={false}
          href={(historical) ? `/dashboard/aotd/calendar/${historical_date.replaceAll("-", "/")}` : buttonUrlOverride}
          radius="none"
          className={`${albumCoverOverride} px-0 py-0 min-w-0`}
          isDisabled={!props.album_mbid}
        >
          <img 
            src={album_cover_url}
            className={`${sizingOverride}`}
            alt={`Album Cover for ${title} by ${artist_name}`}
          />
        </Button>
      </Tooltip>
      {/* Below was the old implementation, however this fails to conform to the spotify developer rules. */}
      {/* <Button
        as={Link}
        href={(historical) ? `/dashboard/aotd/calendar/${historical_date.replaceAll("-", "/")}` : buttonUrlOverride}
        radius="lg"
        className={`absolute flex flex-col transition opacity-0 group-hover:opacity-100 ease-in-out ${sizingOverride} lg:gap-2 bg-transparent p-0`}
        isDisabled={!props.album_mbid}
      >
        <p className={titleTextOverride}>
          {title}
        </p>
        <p className={artistTextOverride}>
          {artist_name}
        </p>
        <Conditional showWhen={(submitter && showSubmitInfo)}>
          <Tooltip 
            content={submitter_comment} 
            className={`w-fit`}
            isDisabled={submitter_comment == "No Comment Provided"}
          >
            <div className="-mb-4">
              <Badge 
                content=" " 
                size="sm" 
                placement="top-left"
                isInvisible={submitter_comment == "No Comment Provided"}
                shape="circle"
                className="bg-blue-300 -ml-2"
              >
                <div>
                  <UserCard 
                    userDiscordID={submitter} 
                    fallbackName={"User Not Found"}
                    customDescription={(
                      <p>
                        Submitter
                      </p>
                    )}
                  />
                </div>
              </Badge>
            </div>
          </Tooltip>
        </Conditional>
        <Conditional showWhen={((avg_rating != null) && showAlbumRating != 0)}>
          <div className="w-full">
            <Conditional showWhen={showAlbumRating == 2} >
                <p className={`w-fit mx-auto px-2 rounded-xl text-black ${ratingToTailwindBgColor((rating_override) ? rating_override : avg_rating)}`}>
                  <b>{avg_rating.toFixed(2)}</b>
                </p>
            </Conditional>
            <div className="w-fit mx-auto mt-2">
              <StarRating 
                className="text-yellow-400"
                rating={(rating_override) ? rating_override : avg_rating} 
                textSize={starTextOverride}
              />
            </div>
          </div>
        </Conditional>
      </Button> */}
    </div>
  )
}