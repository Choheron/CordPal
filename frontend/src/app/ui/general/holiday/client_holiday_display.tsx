"use client"

import { usePathname } from "next/navigation";
import { isDecember } from "../../../lib/utils";
import ClientSnowfall from "./snowfall";

import Image from "next/image";

export default function ClientHolidayDisplay(props) {
  const pathname = usePathname();

  return (
    <>
      {/* Only display if it is December (Holiday Display) */}
      {((isDecember()) && (pathname.indexOf("playback") == -1)) ? 
        (
          <>
            <Image 
              src={`/svgs/holiday_decor/snowbanks.svg`} 
              alt="Background Snow, Happy Holidays!" 
              width={960}
              height={540}
              style={{ width: '100vw', height: 'auto' }}
              className="fixed bottom-0 2xl:-bottom-40 opacity-75"
            />
            <div className="flex">
              <Image
                src="/images/holiday_decor/string-lights-png-hd-9.png"
                width={0}
                height={0}
                sizes="49vw"
                alt="Image of some Christmas Lights, Merry Christmas!"
                className="fixed mt-20 z-0 lg:mt-0 lg:static"
                style={{ width: '100%', height: 'auto' }}
              />
              <Image
                src="/images/holiday_decor/string-lights-png-hd-9.png"
                width={0}
                height={0}
                sizes="49vw"
                alt="Image of some Christmas Lights, Merry Christmas!"
                className="fixed mt-20 z-0 lg:mt-0 lg:static scale-x-[-1]"
                style={{ width: '100%', height: 'auto' }}
              />
            </div>
            {/* Only display if it is December (Holiday Display) */}
            {(isDecember()) ? (<ClientSnowfall />) : (<></>)}
          </>
        ) : (<></>)}
      </>
  )
}