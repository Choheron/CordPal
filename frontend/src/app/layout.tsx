import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/app/globals.css";
import {Providers} from "./providers";
import Image from "next/image";

import ClientSnowfall from "./ui/general/holiday/snowfall";
import { isDecember } from "./lib/utils";
import Heartbeat from "./ui/heartbeat";
import Footer from "./ui/footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cord-Pal",
  description: "Discord Compainion Site allowing users to submit albums, track quotes, upload inside joke images, etc.",
  icons: {
    icon: '/svgs/logos/CordPal_Logo_V1.svg',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Render App
  return (
    <html lang="en" className='dark'>
      <body className={`${inter.className} dark min-h-screen flex flex-col relative`}>
        {/* From https://patterncraft.fun/ */}
        <div
          className="absolute inset-0 z-0"
          style={{
            background: "radial-gradient(125% 125% at 53% 100%, #000000 72%, #350136 100%)",
          }}
        />
        {/* Placeholder Component to implement heartbeat */}
        <Heartbeat />
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
          <div className="flex flex-col min-h-screen bg-inherit relative">
            <div className="flex-grow">{children}</div>
            <Footer />
          </div>
        </Providers>
        {/* Only display if it is December (Holiday Display) */}
        {(isDecember()) ? (<ClientSnowfall />) : (<></>)}
      </body>
    </html>
  );
}
