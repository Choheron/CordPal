'use client'

import {Accordion, AccordionItem} from "@nextui-org/accordion";
import Image from 'next/image'

export default function AboutAccordion(props) {

  return (
    <Accordion 
      isCompact 
      variant="splitted"
    >
      <AccordionItem key="1" aria-label="Clips" title="Clips">
        This feature is currently a Work In Progress. However, the end goal is to allow users of the site to upload video clips and tag users who are included in them. This has the main function of being for video game clips.
      </AccordionItem>
      <AccordionItem key="2" aria-label="Photoshops" title="Photoshops">
        This is a page that allows users to upload images from their devices that they can then provide titles, descriptions, tagged users, and creator/artist. This is mainly used for photoshops of user&apos;s friends and other inside jokes. 
      </AccordionItem>
      <AccordionItem key="3" aria-label="Quotes" title="Quotes">
        This page and functionality is the one that started it all! This website has integrations with a discord bot I maintain for the users in our discord server. That bot allows you to record quotes that a member of the server has said and
        using commands you can get a random quote, or go to this site to view the quotes.
        <br/><br/>
        <p className="mx-auto w-fit italic">Below is an example of a single quote and what the quotes page looks like:</p>
        <Image
          width={0}
          height={0}
          alt="Image showing quote page example"
          src="/images/about_block/QuoteExample.png"
          style={{width: "auto", height: "auto"}}
          sizes="(max-width: 768px) 100vw, 33vw"
          className="mx-auto rounded-xl"
        />
      </AccordionItem>
      <AccordionItem key="4" aria-label="ToDo List" title="Music/Spotify">
        This page allows users to login with spotify using the Oauth2 flow. After logging in users are able to view their top songs in three timeframes (<i>4 weeks, 6 months, 1 year</i>). Perhaps the most developed and fun part of the music
        page is the Album Of the Day. Which utilizes User interaction to randomly select an album on a daily cronjob schedule, from a list of albums submitted by users through an in-site spotify search integration, to become the Album Of the Day. Once users authenticate
        with spotify, they are able to leave a review of the album and see other users&apos; reviews. The site keeps track of all reviews and all average scores to provide many statistics and show leaderboards of albums, users, and review data. 
      </AccordionItem>
      <AccordionItem key="4" aria-label="ToDo List" title="Todo List">
        This page is simple and just allows users to view the progress of the site and what work is currently being prioritized. Admin users can control the status of todo items and add new ones via a modal. 
      </AccordionItem>
    </Accordion>
  )
}