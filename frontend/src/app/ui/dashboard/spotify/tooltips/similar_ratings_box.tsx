'use client'

import ClientTimestamp from "@/app/ui/general/client_timestamp";
import { Avatar, Button, Divider, Tooltip } from "@heroui/react";
import Link from "next/link";

// GUI Display for albums that the user has rated similarly
// Expected Props:
//   - rating: Number - List of recent submissions
export default function SimilarRatingsBox(props) {
  // Prop checks
  const rating = (props.rating) ? props.rating : 0;
  const albums = (props.albums) ? props.albums : [];
  const retrieval_timestamp = (props.timestamp) ? props.timestamp : null;

  const albumDisplay = (albumObj) => {
    // If no albums
    if(albums.length == 0) {
      return (
        <p className="font-extralight">
          You havent rated any albums a {rating}!
        </p>
      )
    }
    // If there are albums for this rating
    return albumObj.map((album, index) => {
      return (
        
        <div key={index} className={`py-2`}>
          <Tooltip content={album['title']} >
            <Button 
              as={Link}
              href={"/dashboard/aotd/album/" + album['spotify_id']}
              radius="sm"
              className={`h-fit w-fit text-white px-0 hover:scale-110 pointer-events-auto`}
              variant="light"
            >
              <Avatar 
                src={album['album_img_src']} 
                name={album['title']}
                className="w-20 h-20 text-large -mx-1"
                radius="sm"
              />
            </Button>
          </Tooltip>
        </div>
      )
    })
  }

  return (
    <div className="w-[300px] mx-0 my-0 flex flex-col font-extralight">
      <p className='text-lg mx-auto pt-1'>Other Albums you gave a {rating}:</p>
      <Divider />
      <div className="flex w-full justify-around">
        {albumDisplay(albums)}
      </div>
      <Divider />
      <div className="flex gap-2 mx-auto">
        <p>Last Updated: </p>
        <ClientTimestamp timestamp={retrieval_timestamp} full/>
      </div>
    </div>
  )
}