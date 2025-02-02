"use server"

import {Popover, PopoverTrigger, PopoverContent} from "@nextui-org/popover";

import StarRating from "../../general/star_rating";
import UserCard from "../../general/userUiItems/user_card";

import { getTenorGifData } from "@/app/lib/spotify_utils";
import ClientTimestamp from "../../general/client_timestamp";
import { Conditional } from "../conditional";

// GUI Display for a single review as a popover/avatar combo
// Expected Props:
//  - review_obj: Object - Review Data Object
//  - index: Number - Index in list
export default async function ReviewAvatarCard(props) {
  const review = props.review_obj;
  var reviewMessage = review['comment'];

  // Regex for youtube video embedding
  const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:\?[\w=&%-]*)?(?:&t=(\d+h)?(\d+m)?(\d+s)?)?/g;
  // Regex for tenor gif embedding
  const tenorRegex = /(?:https?:\/\/)?(?:www\.)?tenor\.com\/view\/[a-zA-Z0-9_-]+-(\d+)/g;

  // Parse Review Text
  // Do youtube link replacements
  reviewMessage =  reviewMessage.replace(youtubeRegex, (match, videoId, hours, minutes, seconds) => {
    // Convert timestamp to seconds
    const h = hours ? parseInt(hours) * 3600 : 0;
    const m = minutes ? parseInt(minutes) * 60 : 0;
    const s = seconds ? parseInt(seconds) : 0;
    const startTime = h + m + s;

    const startParam = startTime > 0 ? `?start=${startTime}` : '';
    return `<iframe width="300" height="168.75" src="https://www.youtube.com/embed/${videoId}${startParam}" frameborder="0" allowfullscreen></iframe>`;
  })
  
  // Do Tenor Link Replacements
  // Extract all Tenor GIF IDs
  const tenorMatches = [...reviewMessage.matchAll(tenorRegex)];
  if (tenorMatches.length > 0) {
    // Fetch all Tenor GIF URLs asynchronously
    const gifPromises = tenorMatches.map(async ([match, gifId]) => {
      const gifUrl = await getTenorGifData(gifId);
      return { match, gifUrl };
    });

    const gifResults = await Promise.all(gifPromises);

    // Replace Tenor URLs with their corresponding <img> tags
    gifResults.forEach(({ match, gifUrl }) => {
      reviewMessage = reviewMessage.replace(match, `<img src="${gifUrl}" frameborder="0" width="300" height="auto" class="max-w-300 h-full" />`);
    });
  }
  

  return (
    <div className="mx-auto" key={props.index}>
      <Popover placement="bottom" showArrow={true}>
        <PopoverTrigger>
          <div>
            <UserCard
              userDiscordID={review['user_id']}
              customDescription={
                <StarRating
                  rating={review['score']}
                  className="text-yellow-400 text-lg"
                />
              }
            />
          </div>
        </PopoverTrigger>
        <PopoverContent>
          <UserCard userDiscordID={review['user_id']} />
          <div className="flex">
            <p className="mx-2 my-2 align-middle">Rating:</p>
            <StarRating
              rating={review['score']}
              className="text-yellow-400 text-lg my-auto"
            />
          </div>
          <Conditional showWhen={review['first_listen'] == true}>
            <p className="bg-green-500 rounded-xl px-2 py-1 border border-black text-black font-bold italic text-xs">
              First Time Listen
            </p>
          </Conditional>
          <p className="ml-2 mr-auto">
            <b>Comment:</b>
          </p>
          <div className="mx-2 my-2 max-w-[320px]" dangerouslySetInnerHTML={{__html: reviewMessage}} />
          <div className="flex justify-between w-full px-2 mt-2 align-middle gap-1">
            Submitted: <ClientTimestamp timestamp={review['review_date']} full={true} />
          </div>
          <Conditional showWhen={review['last_upated'] != review['review_date']}>
            <div className="flex justify-between w-full px-2 align-middle">
              Last Updated: <ClientTimestamp timestamp={review['last_upated']} full={true} />
            </div>
          </Conditional>
        </PopoverContent>
      </Popover>
    </div>
  );
}