import QuoteItem from "@/app/ui/dashboard/quotes/quoteItem";
import { ReactNode } from "react";
import { getAllBotQuotes } from "@/app/lib/discord_bot_utils";

export default async function quotes() {
  // Retrieve quote data
  const quotesJson = await getAllBotQuotes();
  // Store last updated time then remove it
  const quotesUpdateTimestamp = quotesJson['last_updated'];
  console.log(quotesUpdateTimestamp);
  delete quotesJson['last_updated'];
  
  // Return counts for all users quotes in formatted list
  const quoteCountRender: ReactNode = Object.keys(quotesJson).sort((a, b) => quotesJson[a]['quoteList'].length < quotesJson[b]['quoteList'].length ? 1 : -1).map((key) => {
    return (
      <div key={key} className="flex justify-between w-full min-w-64">
        <p>{quotesJson[key]['nickname'].charAt(0).toUpperCase() + quotesJson[key]['nickname'].slice(1)}</p>
        <p>{quotesJson[key]['quoteList'].length}</p>
      </div>
    )
  });

  // Map Quote Json Data to List of Objects
  // Nested Map Statements
  // Data structure:
  //   "userID": {
  //     "quoteList": [
  //       {
  //         "timestamp": "timestamp",
  //         "text": "quoteText",
  //         "addedBy": "nickname/userID"
  //       }
  //     ],
  //     "nickname": "nickname"
  //   }
  const quoteListRender: ReactNode = Object.keys(quotesJson).sort((a, b) => quotesJson[a]['quoteList'].length < quotesJson[b]['quoteList'].length ? 1 : -1).map((key) => {
    return quotesJson[key]['quoteList'].map((quoteObj) => {
      return <QuoteItem key={quoteObj['timestamp']} quoteObject={quoteObj} speaker={(quotesJson[key]['nickname'].charAt(0).toUpperCase() + quotesJson[key]['nickname'].slice(1))} />
    })
  });

  return (
    <main className="flex min-h-screen flex-col items-center p-24 pt-10">
      <h1 className="text-4xl underline antialiased">Quotes:</h1>
      <div className="static w-auto mt-5 p-5 pt-2 flex flex-col justify-center rounded-xl border-b bg-gradient-to-b from-zinc-200 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit border bg-gray-200  lg:dark:bg-zinc-800/30">
        <p className="w-full text-center">Quote Counts:</p>
        {quoteCountRender}
        <hr/>
        <div className="flex justify-between w-full min-w-72">
          <p>Last Updated:</p>
          <p>{quotesUpdateTimestamp}</p>
        </div>
      </div>
      <div className="flex flex-col justify-around mt-10 mb-10">
        {quoteListRender}
      </div>
    </main>
  );
}
