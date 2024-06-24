import { Albert_Sans } from "next/font/google"

const albertSans = Albert_Sans({
  weight: '300',
  style: ['italic'],
  subsets: ['latin'],
})

export default async function QuoteItem(props) {

  return (
    <div className="rounded-xl bg-neutral-900/75 z-10 w-4/5 max-w-5xl flex justify-around">
      <div className="p-2">
        <p className={`${albertSans.className} text-2xl`} >
          "{props.quoteObject['text']}"
        </p>
      </div>
      
    </div>
  );
}