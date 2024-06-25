import { Albert_Sans } from "next/font/google"

const albertSans = Albert_Sans({
  weight: '300',
  style: ['italic'],
  subsets: ['latin'],
})

export default async function QuoteItem(props) {

  return (
    <div className="w-full flex justify-around max-w-5xl rounded-x bg-gradient-to-r from-neutral-900/0 via-neutral-900/75 to-neutral-900/0 mt-2 mb-2">
      <div className="flex flex-col z-10 justify-around w-fit">
        <div className="flex justify-start pl-0">
          <p>{props.speaker}:</p>
        </div>
        <p className={`${albertSans.className} antialiased text-3xl p-1 pb-0 text-center`} >
          "{props.quoteObject['text']}"
        </p>
        <div className="flex justify-end pl-10 pr-10">
          <p>Submitted by: <i>{props.quoteObject['addedBy'].split('/')[0]} on {props.quoteObject['timestamp']}</i></p>
        </div>
      </div>
    </div>
  );
}