'use client'

import { useEffect } from "react";
import { heartbeat } from "../lib/user_utils";

// Makes a POST request to the backend heartbeat endpoint every 30 seconds to maintain online status
export default function Heartbeat(props) {
  // UseEffect to implement heartbeat functionality
  useEffect(() => {
    const beatHeart = async() => {
      await heartbeat()
    }
    beatHeart();

    const intervalId = setInterval(() => {
      beatHeart();
    }, (30 * 1000));

    return () => clearInterval(intervalId); // Clean up the interval on component unmount
  }, [])

  // Return nothing as this is just a heartbeat function
  return (
    <></>
  );
}