import { ReactNode } from "react";
import UserCard from "../../general/userUiItems/user_card";

// Display Counts of user quotes
// Expected Props:
//  - quotesJson: Object -> Quote Data
//  - updateTimestamp: String -> String timestamp of last updated time
export default async function QuoteCounts(props) {
  const quoteSummary = props['summaryData'];
  const updateTimestamp = props['updateTimestamp'];

  // Return counts for all users quotes in formatted list
  const quoteCountRender: ReactNode = quoteSummary.sort((a, b) => a['count'] < b['count'] ? 1 : -1).map((userSum) => {
    // Conditionally render in case there exists a user with no quotes, in which case they should not be shown in the count
    if(userSum['count'] != 0) {
      return (
        <div key={userSum['count']} className="flex justify-between w-full min-w-64">
          <div>
            <UserCard 
              userDiscordID={userSum['discord_id']} 
              fallbackName={userSum['nickname']} 
            />
          </div>
          <p className="my-auto">{userSum['count']}</p>
        </div>
      )
    }
  });

  return (
      <div className={`w-auto h-fit p-5 pt-2 flex flex-col justify-center rounded-xl border-b bg-gradient-to-b backdrop-blur-2xl border-neutral-800 bg-zinc-800/30 from-inherit border bg-gray-200 lg:bg-zinc-800/30 ${props["className"]}`}>
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