import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/app/globals.css";
import {Providers} from "./providers";

import Heartbeat from "./ui/heartbeat";
import Footer from "./ui/footer";
import ClientHolidayDisplay from "./ui/general/holiday/client_holiday_display";
import { isValentinesDay } from "./lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cord-Pal",
  description: "Discord Compainion Site allowing users to submit albums, track quotes, upload inside joke images, etc.",
  icons: {
    icon: '/svgs/logos/CordPal_Logo_V1.svg',
  }
};

// Get todays date (in central time)

// Make Gradient Pink if Valentines day, purple if not
const gradientCSS = (
  (isValentinesDay()) ?
  ("radial-gradient(125% 125% at 53% 100%, #000000 72%, #db005f 100%)") :
  ("radial-gradient(125% 125% at 53% 100%, #000000 72%, #350136 100%)")
)

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
          className="absolute inset-0 z-0 max-h-[100vh]"
          style={{
            background: gradientCSS,
          }}
        />
        {/* Placeholder Component to implement heartbeat */}
        <Heartbeat />
        {/* Conditional Holiday Display (Holiday Display shows only in december and not on playback pages) */}
        <ClientHolidayDisplay />
        <Providers>
          <div className="flex flex-col min-h-screen bg-inherit relative">
            <div className="flex-grow">{children}</div>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
