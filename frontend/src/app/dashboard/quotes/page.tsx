import QuoteItem from "@/app/ui/dashboard/quotes/quoteItem";
import { ReactNode } from "react";
import { redirect } from 'next/navigation'
import { getAllBotQuotes } from "@/app/lib/discord_bot_utils";
import PageTitle from "@/app/ui/dashboard/page_title";
import QuoteCounts from "@/app/ui/dashboard/quotes/quote_counts";
import QuoteSortBlock from "@/app/ui/dashboard/quotes/quote_sort_block";
import { capitalizeFirstLetter } from "@/app/lib/utils";

// TODO: Implement toggle for cursive text in quotes
export default async function quotes({searchParams}) {
  // Get url params
  const {sortMethod, cursive} = searchParams;
  // Redirect if any of the search params are undefined
  if(sortMethod == 'undefined' || cursive == 'undefined') {
    redirect("/dashboard/quotes?sortMethod=count&cursive=false");
  }
  // Retrieve quote data
  const quoteResponse = await getAllBotQuotes()
  const quotesList = quoteResponse["quotes"];
  const quotesSummary = quoteResponse["summary"];
  const quotesMetadata = quoteResponse["meta"];
  // Store last updated time then remove it
  const quotesUpdateTimestamp = quotesMetadata['timestamp'];

  // Map quote objects through top level info
  const quoteListRender: ReactNode = quotesList.map((quote) => {
    return <QuoteItem key={quote['timestamp']} cursive={cursive} quoteObject={quote} />
  });

  return (
    <main className="flex flex-col items-center p-24 pt-10">
      <PageTitle text="Quotes" />
      <div className="flex flex-col 2xl:flex-row justify-center 2xl:w-3/4">
        <div className="flex flex-col">
          <QuoteCounts className="w-1/2 2xl:mr-5" summaryData={quotesSummary} updateTimestamp={quotesUpdateTimestamp}/>
        </div>
        <div className="flex flex-col justify-around mb-10">
          {quoteListRender}
        </div>
      </div>
    </main>
  );
}
