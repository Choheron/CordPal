import { Albert_Sans, Great_Vibes } from "next/font/google"
import { dancing } from "../../fonts";

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
  const userID = (props.quoteObject.speaker) ? props.quoteObject.speaker.discord_id : props.quoteObject.speaker_discord_id
  const nickname = (props.quoteObject.speaker) ? props.quoteObject.speaker.nickname : props.quoteObject.speaker_discord_id

  // Apply Regex on markdown style quotes
  function applyQuoteRegex(str) {
    const boldRegex: RegExp = /\*\*([^\*]+)\*\*/
    const italicRegex: RegExp = /\*(.+)\*/;

    const inputBold = str.replace(boldRegex, '<b>$1</b>');
    const inputItalics = inputBold.replace(italicRegex, '<i>$1</i>');
    return inputItalics;
  }

  return (
    <div className="w-full flex justify-around max-w-5xl rounded-x bg-gradient-to-r from-neutral-900/0 via-neutral-900/75 to-neutral-900/0 px-2 py-2 my-2 rounded-2xl border border-neutral-900 mb-2">
      <div className="flex flex-col z-10 justify-around w-full">
        <div className="flex w-fit">
          <UserCard 
            userDiscordID={userID} 
            fallbackName={nickname}
            avatarClassNameOverride={"flex-shrink-0 size-[20px] xl:size-[40px]"}
          />
        </div>
        <div className={`${textStyle} antialiased text-lg xl:text-3xl p-1 pb-0 text-center`} >
          <p dangerouslySetInnerHTML={{__html: applyQuoteRegex("&quot;" + props.quoteObject['text'] + "&quot;")}}/>
        </div>
        <div className={`${textStyle} text-right px-10 text-xs xl:text-base`}>
          <p>On: <i>{props.quoteObject['timestamp'].split(',')[0]}</i></p>
        </div>
      </div>
    </div>
  );
}