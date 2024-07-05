import { Albert_Sans } from "next/font/google"

const albertSans = Albert_Sans({
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  style: ['normal'],
  subsets: ['latin'],
})

export default async function QuoteItem(props) {

  // Apply Regex on markdown style quotes
  function applyQuoteRegex(str) {
    const boldRegex: RegExp = /\*\*([^\*]+)\*\*/
    const italicRegex: RegExp = /\*(.+)\*/;

    const inputBold = str.replace(boldRegex, '<b>$1</b>');
    const inputItalics = inputBold.replace(italicRegex, '<i>$1</i>');
    console.log("After Replace: " + inputItalics);
    return inputItalics;
  }

  return (
    <div className="w-full flex justify-around max-w-5xl rounded-x bg-gradient-to-r from-neutral-900/0 via-neutral-900/75 to-neutral-900/0 mt-2 mb-2">
      <div className="flex flex-col z-10 justify-around w-fit">
        <div className="flex justify-start pl-0">
          <p>{props.speaker}:</p>
        </div>
        <div className={`${albertSans.className} antialiased text-3xl p-1 pb-0 text-center`} >
          <p dangerouslySetInnerHTML={{__html: applyQuoteRegex("&quot;" + props.quoteObject['text'] + "&quot;")}}/>
        </div>
        <div className="flex justify-end pl-10 pr-10">
          <p>Submitted by: <i>{props.quoteObject['addedBy'].split('/')[0]} on {props.quoteObject['timestamp']}</i></p>
        </div>
      </div>
    </div>
  );
}