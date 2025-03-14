'use client'

import { useEffect } from "react";
import { heartbeat } from "../lib/user_utils";

// Makes a POST request to the backend heartbeat endpoint every 30 seconds to maintain online status
export default function Heartbeat(props) {
  // UseEffect to implement heartbeat functionality
  useEffect(() => {
    let isMounted = true

    const beatHeart = async() => {
      try {
        if(isMounted) {
          await heartbeat();
        }
      } catch(error) {
        console.error("Heartbeat failed:", error);
      }
    }
    beatHeart();

    const intervalId = setInterval(() => {
      beatHeart();
    }, (30 * 1000));

    return () => {
      isMounted = false; // Prevents updates after unmounting
      clearInterval(intervalId); // Clean up the interval on component unmount
    }
  }, [])

  // Return nothing as this is just a heartbeat function
  return null;
}