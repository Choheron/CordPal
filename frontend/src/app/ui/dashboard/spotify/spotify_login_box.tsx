'use server'

import Image from "next/image"

export default async function SpotifyLoginBox(props) {

  const spot_scope = 'playlist-read-private playlist-read-collaborative playlist-modify-private playlist-modify-public user-follow-read user-follow-modify user-read-playback-position user-top-read user-read-recently-played user-library-modify user-library-read user-read-email user-read-private'
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: String(process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID),
    scope: spot_scope,
    redirect_uri: String(process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI),
  });
  const spotifyLoginUrl = "https://accounts.spotify.com/authorize?" + params.toString();

  return (
    <div className="flex flex-col w-11/12 sm:w-2/5 rounded-xl ml-5 py-2 px-2 backdrop-blur-2xl bg-zinc-800/30 border border-neutral-800">
      <p className="mx-auto text-center">In order to view your spotify data and participate in album of the day:</p>
      <div className="flex flex-col md:flex-row justify-center mx-auto">
        <p className="my-auto text-center">Login with &nbsp;</p>
        <a href={spotifyLoginUrl} className="w-full md:w-1/5">
          <Image
            src="/images/branding/Spotify_Full_Logo_RGB_Green.png"
            alt="Spotify Logo"
            width={3432}
            height={940}
            style={{ width: '100%', height: '100%' }}
          />
        </a>
      </div>
    </div>
  )
}