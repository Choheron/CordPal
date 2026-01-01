"use server"

import { getAlbum } from "@/app/lib/aotd_utils"
import MinimalAlbumDisplay from "../dashboard/aotd/minimal_album_display"
import StarRating from "../general/star_rating"
import BasicTable from "./tables/basic_table"
import UserCard from "../general/userUiItems/user_card"
import BasicPieChart from "./graphs/basic_pie_chart"

export default async function GlobalAotdPlayback(props) {
  const aotdStats = props['aotdPlaybackData']
  const highest_rated_album = await getAlbum(aotdStats['highest_rated_album']['album__mbid'])
  const lowest_rated_album = await getAlbum(aotdStats['lowest_rated_album']['album__mbid'])
  const highest_stddev_album = await getAlbum(aotdStats['highest_stddev_album']['album__mbid'])
  const lowest_stddev_album = await getAlbum(aotdStats['lowest_stddev_album']['album__mbid'])

  const backgroundGradientTQ = "bg-gradient-to-bl from-slate-900 to-slate-950"

  const selectionsColumn = () => {
    const rows = aotdStats['total_selections_leaderboard'].map((data, index) => {
      return {
        key: index,
        position: index + 1,
        userdiscordid: (
          <UserCard userDiscordID={data['album__submitted_by__discord_id']} isProfileLink={true}/>
        ),
        userid: data['album__submitted_by__discord_id'],
        percentage: `${((parseFloat(data['selection_count'])/parseFloat(aotdStats['total_selections'])) * 100).toFixed(2)}%`,
        count: data['selection_count']
      }
    })
    const columns = [
      {
        key: "position",
        label: "#"
      },
      {
        key: "userdiscordid",
        label: "USER",
      },
      {
        key: "percentage",
        label: "PERCENTAGE",
      },
      {
        key: "count",
        label: "COUNT",
      },
    ];

    return (
      <>
        <BasicPieChart chartData={rows} title_text="Album Selections" tooltip_text="Breakdown of Selected album numbers, by submitter."/>
        <p className="mx-auto text-lg">Selection Leaderboard:</p>
        <BasicTable columns={columns} rows={rows} table_label="Selections Leaderboard Table" />
      </>
    )
  }

  const submissionsColumn = () => {
    const rows = aotdStats['total_submissions_leaderboard'].map((data, index) => {
      return {
        key: index,
        position: index + 1,
        userdiscordid: (
          <UserCard userDiscordID={data['submitted_by__discord_id']} isProfileLink={true}/>
        ),
        userid: data['submitted_by__discord_id'],
        percentage: `${((parseFloat(data['submission_count'])/parseFloat(aotdStats['total_submissions'])) * 100).toFixed(2)}%`,
        count: data['submission_count']
      }
    })
    const columns = [
      {
        key: "position",
        label: "#"
      },
      {
        key: "userdiscordid",
        label: "USER",
      },
      {
        key: "percentage",
        label: "PERCENTAGE",
      },
      {
        key: "count",
        label: "COUNT",
      },
    ];

    return (
      <>
        <BasicPieChart chartData={rows} title_text="Album Submissions" tooltip_text="Breakdown of Submitted album numbers, by submitter."/>
        <p className="mx-auto text-lg">Submission Leaderboard:</p>
        <BasicTable columns={columns} rows={rows} table_label="Submissions Leaderboard Table" />
      </>
    )
  }


  return (
    <div className="w-fit mx-auto p-2 flex flex-col sm:flex-row">
      {/* Highest and Lowest Rated Albums */}
      <div className={`flex flex-col items-center h-fit rounded-2xl p-2 m-2 ${backgroundGradientTQ} border-2 border-neutral-800 w-fit md:w-[400px] max-h-[100%] my-auto`}>
        {/* Highest Album */}
        <div className="flex text-2xl mx-auto w-fit gap-2 pb-2">
          <p className="text-2xl">&#127942;</p>
          <p>Most Loved</p>
          <p className="text-2xl">&#127942;</p>
        </div>
        <MinimalAlbumDisplay 
          title={highest_rated_album["title"]}
          disambiguation={highest_rated_album["disambiguation"]}
          album_img_src={highest_rated_album["album_img_src"]}
          album_id={highest_rated_album["album_id"]}
          album_src={`/dashboard/aotd/album/${highest_rated_album["album_id"]}`}
          album_mbid={highest_rated_album["album_id"]}
          artist={highest_rated_album["artist"]}
          submitter={highest_rated_album["submitter"]}
          showAlbumRating={1}
          showSubmitInfo={true}
          historical_date={aotdStats['highest_rated_album']['date']}
        />
        <StarRating rating={aotdStats['highest_rated_album']['rating']} textSize="text-3xl" />
        <p className="text-xl mx-auto w-fit">{aotdStats['highest_rated_album']['review_count']} Reviews</p>
        {/* Lowest Album */}
        <div className="flex text-2xl mx-auto w-fit gap-2 pb-2">
          <p className="text-2xl">🗑️</p>
          <p>Most Hated</p>
          <p className="text-2xl">🗑️</p>
        </div>
        <MinimalAlbumDisplay 
          title={lowest_rated_album["title"]}
          disambiguation={lowest_rated_album["disambiguation"]}
          album_img_src={lowest_rated_album["album_img_src"]}
          album_id={lowest_rated_album["album_id"]}
          album_src={`/dashboard/aotd/album/${lowest_rated_album["album_id"]}`}
          album_mbid={lowest_rated_album["album_id"]}
          artist={lowest_rated_album["artist"]}
          submitter={lowest_rated_album["submitter"]}
          showAlbumRating={1}
          showSubmitInfo={true}
          historical_date={aotdStats['lowest_rated_album']['date']}
        />
        <StarRating rating={aotdStats['lowest_rated_album']['rating']} textSize="text-3xl" />
        <p className="text-xl mx-auto w-fit">{aotdStats['lowest_rated_album']['review_count']} Reviews</p>
      </div>
      {/* Leaderboards */}
      <div className="flex flex-col sm:flex-row max-h-[100vh] rounded-2xl p-2 gap-3 items-center">
        {/* Selection Leaderboards */}
        <div className="flex flex-col max-h-[100%]">
          {selectionsColumn()}
        </div>
        {/* Submissions Leaderboards */}
        <div className="flex flex-col max-h-[100%]">
          {submissionsColumn()}
        </div>
      </div>
      {/* Most and Least Controversial Albums */}
        <div className={`flex flex-col items-center h-fit rounded-2xl p-2 m-2 ${backgroundGradientTQ} border-2 border-neutral-800 w-fit md:w-[400px] my-auto`}>
          {/* Most Controversial Album */}
          <div className="flex text-2xl mx-auto w-fit gap-2 pb-2">
            <p className="text-2xl">✊</p>
            <p>Most Controversial</p>
            <p className="text-2xl">✊</p>
          </div>
          <MinimalAlbumDisplay 
            title={highest_stddev_album["title"]}
            disambiguation={highest_stddev_album["disambiguation"]}
            album_img_src={highest_stddev_album["album_img_src"]}
            album_id={highest_stddev_album["album_id"]}
            album_src={`/dashboard/aotd/album/${highest_stddev_album["album_id"]}`}
            album_mbid={highest_stddev_album["album_id"]}
            artist={highest_stddev_album["artist"]}
            submitter={highest_stddev_album["submitter"]}
            showAlbumRating={1}
            showSubmitInfo={true}
            historical_date={aotdStats['highest_stddev_album']['date']}
          />
          <StarRating rating={aotdStats['highest_stddev_album']['rating']} textSize="text-3xl" />
          <p className="text-xl mx-auto w-fit">{aotdStats['highest_stddev_album']['review_count']} Reviews</p>
          {/* Least Controversial Album */}
          <div className="flex text-2xl mx-auto w-fit gap-2 pb-2">
            <p className="text-2xl">✌</p>
            <p>Least Controversial</p>
            <p className="text-2xl">✌</p>
          </div>
          <MinimalAlbumDisplay 
            title={lowest_stddev_album["title"]}
            disambiguation={lowest_stddev_album["disambiguation"]}
            album_img_src={lowest_stddev_album["album_img_src"]}
            album_id={lowest_stddev_album["album_id"]}
            album_src={`/dashboard/aotd/album/${lowest_stddev_album["album_id"]}`}
            album_mbid={lowest_stddev_album["album_id"]}
            artist={lowest_stddev_album["artist"]}
            submitter={lowest_stddev_album["submitter"]}
            showAlbumRating={1}
            showSubmitInfo={true}
            historical_date={aotdStats['lowest_stddev_album']['date']}
          />
          <StarRating rating={aotdStats['lowest_stddev_album']['rating']} textSize="text-3xl" />
          <p className="text-xl mx-auto w-fit">{aotdStats['lowest_stddev_album']['review_count']} Reviews</p>
        </div>
    </div>
  )
}