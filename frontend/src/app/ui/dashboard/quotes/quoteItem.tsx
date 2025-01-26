import { Albert_Sans, Great_Vibes } from "next/font/google"
import { dancing } from "../../fonts";
import { capitalizeFirstLetter } from "@/app/lib/utils";

import UserCard from "../../general/userUiItems/user_card";

const albertSans = Albert_Sans({
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  style: ['normal'],
  subsets: ['latin'],
})

const vibes = Great_Vibes ({
  subsets: ['latin'],
  weight: ["400"],
})

export default async function QuoteItem(props) {
  const textStyle = (props['cursive'] == 'true') ? `${dancing.className}` : `${albertSans.className}`;

  // Apply Regex on markdown style quotes
  function applyQuoteRegex(str) {
    const boldRegex: RegExp = /\*\*([^\*]+)\*\*/
    const italicRegex: RegExp = /\*(.+)\*/;

    const inputBold = str.replace(boldRegex, '<b>$1</b>');
    const inputItalics = inputBold.replace(italicRegex, '<i>$1</i>');
    return inputItalics;
  }

  return (
    <div className="w-full flex justify-around max-w-5xl rounded-x bg-gradient-to-r from-neutral-900/0 via-neutral-900/75 to-neutral-900/0 px-2 py-2 my-2 rounded-2xl border border-neutral-900 mt-2 mb-2">
      <div className="flex flex-col z-10 justify-around w-fit">
        <div className={`${textStyle} flex justify-start pl-0`}>
          <p>{props.speaker}:</p>
        </div>
        <div className={`${textStyle} antialiased text-3xl p-1 pb-0 text-center`} >
          <p dangerouslySetInnerHTML={{__html: applyQuoteRegex("&quot;" + props.quoteObject['text'] + "&quot;")}}/>
        </div>
        <div className={`${textStyle} text-right justify-end px-10`}>
          <p>Submitted by:</p>
          <UserCard 
            userDiscordID={props.quoteObject['addedBy'].split('/')[1]} 
            fallbackName={capitalizeFirstLetter(props.quoteObject['addedBy'].split('/')[0])}
          />
          <p>On: <i>{props.quoteObject['timestamp'].split(',')[0]}</i></p>
        </div>
      </div>
    </div>
  );
}