import { Divider, Image } from "@heroui/react"

export default function Footer(props) {
  const currYear = new Date().getFullYear()

  return (
    <div className="flex flex-col sm:flex-row gap-1 sm:gap-0 justify-center w-fit sm:w-full 2xl:w-3/4 mx-auto py-3 bg-gradient-to-r from-black/30 via-slate-800/25 to-black/30">
      <div className="flex flex-col w-fit text-slate-500 text-center mx-auto sm:mx-0">
        <p className="text-sm sm:text-base mx-auto">
          &copy; Copyright 2024-{currYear} -  Cord-Pal - All Rights Reserved
        </p>
        <div className="flex w-fit mx-auto text-xs sm:text-sm gap-1 justify-center">
          <p>
            Business Inquiries, reach out to
          </p>
          <a
            href="https://thomascampbell.dev"
            className="text-slate-400 italic hover:underline"
          >
            Thomas Campbell
          </a>
        </div>
      </div>
      <Divider orientation="vertical" className="hidden sm:block mx-3 text-gray-400 h-12" />
      <div className="flex flex-col w-fit text-slate-500 text-center mx-auto sm:mx-0">
        <div className="flex gap-1 text-sm sm:text-base mx-auto">
          <p>
            Powered by
          </p>
          <a 
            href="https://musicbrainz.org/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="my-auto"
          >
            <Image 
              src="/images/branding/MusicBrainz_logo_square.svg" 
              alt="MusicBrainz Logo" 
              height="auto"
              width="30px"
              className="text-center"
            />
          </a>
        </div>
        <p className="text-xs gap-1 ">
          This application utilizes the MusicBranz API but is not officially endorsed by MusicBrainz.
        </p>
      </div>
    </div>
  )
}