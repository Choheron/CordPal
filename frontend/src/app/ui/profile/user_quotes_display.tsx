import ClientTimestamp from "../general/client_timestamp"
import { boolToEmoji, formatDateString, onlineStatusToTailwindBgColor } from "@/app/lib/utils"
import CurrentTime from "../general/current_time"
import { getUserQuotes } from "@/app/lib/discord_bot_utils"
import QuoteItem from "../dashboard/quotes/quoteItem"

// Display user quote data in a box
// EXPECTED PROPS:
// - userData: Object [REQUIRED] - User Data object to be passed in, expects data outlined in backend
// - userId: String [REQUIRED] - User's discord ID
export default async function UserQuotesDisplay(props) {
  const userId = props.userId
  const quotesList = await getUserQuotes(userId)

  // Map quote objects through top level info
  const quoteListRender = quotesList.map((quote) => {
    return <QuoteItem key={quote['timestamp']} quoteObject={quote} />
  });

  return(
    <div className="w-full h-fit max-h-full overflow-y-auto flex flex-col gap-2 backdrop-blur-2xl px-2 py-2 my-2 rounded-2xl bg-zinc-800/30 border border-neutral-800 font-extralight">
      <div className="flex gap-1 w-fit mr-auto text-xl border border-neutral-800 -m-[9px] p-2 rounded-tl-2xl rounded-br-2xl mb-1">
        <p className="underline">
          Quotes:
        </p>
        <p>
          {quotesList.length}
        </p>
      </div>
      {quoteListRender}
    </div>
  )
}