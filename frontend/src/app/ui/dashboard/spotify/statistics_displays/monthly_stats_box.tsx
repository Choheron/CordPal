import { padNumber, ratingToTailwindBgColor } from "@/app/lib/utils";
import MinimalAlbumDisplay from "../minimal_album_display";
import { Badge } from "@nextui-org/react";



// Display monthy statistics for the AOtD
export default function MonthlyStatsBox(props) {
  // Prop validation
  const albumData = (props.albumData) ? props.albumData : null;
  const year = (props.year) ? props.year : null;
  const month = (props.month) ? props.month : null;
  // Data Parsing from props
  const highest_album = (albumData) ? albumData[albumData['highest_aotd_date']] : "Not Found";
  const lowest_album = (albumData) ? albumData[albumData['lowest_aotd_date']] : "Not Found";


  // Display lowest and highest album of the month, with their ratings
  const lowestHighestAlbum = () => {
    const highestAlbumDateArr = albumData['highest_aotd_date'].split("-")
    const lowestAlbumDateArr = albumData['lowest_aotd_date'].split("-")

    return (
      <div className="w-full lg:w-[400px] flex flex-col backdrop-blur-2xl pl-2 pr-4 py-2 my-2 rounded-2xl bg-zinc-800/30 border border-neutral-800">
        {/* Highest Album */}
        <p className="font-extralight w-full text-center text-xl underline">
          Highest:
        </p>
        <Badge
          content={highest_album['rating'].toFixed(2)} 
          size="lg" 
          placement="top-right" 
          shape="rectangle"
          showOutline={false}
          variant="shadow"
          className={`-mt-1  ${ratingToTailwindBgColor(highest_album["rating"].toFixed(2))} lg:text-xl text-black`}
        >
          <div className="relative w-full h-full p-1">
            <MinimalAlbumDisplay
              showAlbumRating={true}
              ratingOverride={highest_album["rating"]}
              title={highest_album["title"]}
              album_spotify_id={highest_album["album_id"]}
              album_img_src={highest_album["album_img_src"]}
              album_src={highest_album["spotify_url"]}
              artist={highest_album["artist"]}
              submitter={highest_album["submitter_id"]}
              submitter_comment={highest_album["submitter_comment"]}
              submission_date={highest_album["submission_date"]}
              historical_date={highest_album['date']}
              sizingOverride="w-full h-full"
              buttonUrlOverride={`/dashboard/spotify/calendar/${year}/${month}/${highestAlbumDateArr[2]}`}
              titleTextOverride="text-center text-xl 2xl:text-2xl text-wrap line-clamp-2"
              artistTextOverride="text-center text-sm 2xl:text-xl italic text-wrap"
              starTextOverride="text-base 2xl:text-3xl"
            />
            <div className="absolute left-1 bg-zinc-800/90 border border-neutral-800 top-0 p-2 rounded-tl-2xl rounded-br-2xl">
              <p>{highestAlbumDateArr[2]}</p>
            </div>
          </div>
        </Badge>
        {/* Lowest Album */}
        <p className="font-extralight w-full text-center text-xl underline">
          Lowest:
        </p>
        <Badge
          content={lowest_album['rating'].toFixed(2)} 
          size="lg" 
          placement="top-right" 
          shape="rectangle"
          showOutline={false}
          variant="shadow"
          className={`-mt-1 ${ratingToTailwindBgColor(lowest_album["rating"].toFixed(2))} lg:text-xl text-black`}
        >
          <div className="relative w-full h-full p-1">
            <MinimalAlbumDisplay
              showAlbumRating={true}
              ratingOverride={lowest_album["rating"]}
              title={lowest_album["title"]}
              album_spotify_id={lowest_album["album_id"]}
              album_img_src={lowest_album["album_img_src"]}
              album_src={lowest_album["spotify_url"]}
              artist={lowest_album["artist"]}
              submitter={lowest_album["submitter_id"]}
              submitter_comment={lowest_album["submitter_comment"]}
              submission_date={lowest_album["submission_date"]}
              historical_date={lowest_album['date']}
              sizingOverride="w-full h-full"
              buttonUrlOverride={`/dashboard/spotify/calendar/${year}/${month}/${lowestAlbumDateArr[2]}`}
              titleTextOverride="text-center text-xl 2xl:text-2xl text-wrap line-clamp-2"
              artistTextOverride="text-center text-sm 2xl:text-xl italic text-wrap"
              starTextOverride="text-base 2xl:text-3xl"
            />
            <div className="absolute left-1 bg-zinc-800/90 border border-neutral-800 top-0 p-2 rounded-tl-2xl rounded-br-2xl">
              <p>{lowestAlbumDateArr[2]}</p>
            </div>
          </div>
        </Badge>
      </div>
    )
  }


  return (
    <div className="w-full flex">
      {/* Lowest and Highest Album of the Month */}
      {lowestHighestAlbum()}
    </div>
  )
}