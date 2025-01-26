import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/app/globals.css";
import {Providers} from "./providers";
import Image from "next/image";

import ClientSnowfall from "./ui/general/holiday/snowfall";
import { isDecember } from "./lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Dis-Cord Site",
  description: "Discord Bot Compainion Site allowing users to submit albums, track quotes, upload inside joke images, etc.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className='dark'>
      <body className={`${inter.className} dark`}>
        {/* Only display if it is December (Holiday Display) */}
        {(isDecember()) ? 
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
            </>
          ) : (<></>)}
        <Providers>
          {children}
        </Providers>
        {/* Only display if it is December (Holiday Display) */}
        {(isDecember()) ? 
          (
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
          ) : (<></>)}
        {(isDecember()) ? (<ClientSnowfall />) : (<></>)}
      </body>
    </html>
  );
}
