'use client'

import {Accordion, AccordionItem} from "@heroui/accordion";
import Image from 'next/image'

export default function AboutAccordion(props) {

  return (
    <Accordion 
      isCompact 
      variant="splitted"
    >
      <AccordionItem key="1" aria-label="Photoshops" title="Photoshops">
        This is a page that allows users to upload images from their devices that they can then provide titles, descriptions, tagged users, and creator/artist. This is mainly used for photoshops of user&apos;s friends and other inside jokes. 
      </AccordionItem>
      <AccordionItem key="2" aria-label="Quotes" title="Quotes">
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
      <AccordionItem key="3" aria-label="ToDo List" title="Album Of the Day">
        <p>
          This has become the bulk of CordPal, it allows users to register for Album Of the Day {`(AOtD)`} and submit albums using the MusicBrainz database. These albums are then selected randomly, one a day, and set as the Album of the Day. Users can then
          review the album and data is collected on averages, overall score, etc. This lets users experience an album in a shared space.
        </p>
      </AccordionItem>
    </Accordion>
  )
}