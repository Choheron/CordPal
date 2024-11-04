import { ReactNode } from "react";
import UserCard from "../../general/userUiItems/user_card";

// Display Counts of user quotes
// Expected Props:
//  - quotesJson: Object -> Quote Data
//  - updateTimestamp: String -> String timestamp of last updated time
export default async function QuoteCounts(props) {
  const quotesJson = props['quotesJson'];
  const updateTimestamp = props['updateTimestamp'];

  // Return counts for all users quotes in formatted list
  const quoteCountRender: ReactNode = Object.keys(quotesJson).sort((a, b) => quotesJson[a]['quoteList'].length < quotesJson[b]['quoteList'].length ? 1 : -1).map((key) => {
    return (
      <div key={key} className="flex justify-between w-full min-w-64">
        <div>
          <UserCard userDiscordID={key}/>
        </div>
        <p className="my-auto">{quotesJson[key]['quoteList'].length}</p>
      </div>
    )
  });

  return (
    <div className={`static w-auto p-5 pt-2 flex flex-col justify-center rounded-xl border-b bg-gradient-to-b backdrop-blur-2xl border-neutral-800 bg-zinc-800/30 from-inherit border bg-gray-200  lg:bg-zinc-800/30 ${props["className"]}`}>
      <p className="w-full text-center">Quote Counts:</p>
      {quoteCountRender}
      <hr/>
      <div className="flex justify-between w-full min-w-72">
        <p>Last Updated:</p>
        <p>{updateTimestamp}</p>
      </div>
    </div>
  );
}