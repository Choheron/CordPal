'use client'

import { useEffect } from "react";
import { heartbeat } from "../lib/user_utils";
import { redirect } from "next/navigation";

// Makes a POST request to the backend heartbeat endpoint every 30 seconds to maintain online status
export default function Heartbeat(props) {
  // UseEffect to implement heartbeat functionality
  useEffect(() => {
    let isMounted = true
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone; // calculated once

    const beatHeart = async() => {
      if (document.visibilityState !== 'visible') return; // skip when tab hidden
      try {
        if(isMounted) {
          const time = new Date()
          const result: any = await heartbeat(tz);
          if(result['status'] == 302) {
            redirect("/")
          }
        }
      } catch(error) {
        console.error("Heartbeat failed:", error);
      }
    }
    beatHeart();

    const intervalId = setInterval(() => {
      beatHeart();
    }, (2 * 60 * 1000));
    document.addEventListener('visibilitychange', beatHeart); // Report back online immediately on tab focus

    return () => {
      isMounted = false; // Prevents updates after unmounting
      document.removeEventListener('visibilitychange', beatHeart);
      clearInterval(intervalId); // Clean up the interval on component unmount
    }
  }, [])

  // Return nothing as this is just a heartbeat function
  return null;
}