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
  const quotesJson = await getAllBotQuotes();
  // Store last updated time then remove it
  const quotesUpdateTimestamp = quotesJson['last_updated'];
  delete quotesJson['last_updated'];

  // Flatten quotes to list of quote objects 
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
  let quotesArr: object[] = [];
  for(const [userId, userQuoteObj] of Object.entries(quotesJson)) {
    for(let i = 0; i < quotesJson[userId]['quoteList'].length; i++) {
      let quoteInfoObject = {
        'userID': userId,
        'userNickname': quotesJson[userId]['nickname'],
        'quote_timestamp': quotesJson[userId]['quoteList'][i]['timestamp'],
        'quote_timestamp_parsed': Date.parse(quotesJson[userId]['quoteList'][i]['timestamp']),
        'quote_text': quotesJson[userId]['quoteList'][i]['text'],
        'quote_addedBy': quotesJson[userId]['quoteList'][i]['addedBy'],
      }
      quotesArr.push(quoteInfoObject)
    }
  }
  

  // Handle multiple sorting types 
  // Multiple sorting types due to different in quote formats
  function sortHandlerTopLevel(method) {
    // Sorts based on top level quote values (CALLED BY: "quoteListRenderTopLevel")
    if(method == "count") {
      return function(a, b) {
        return quotesJson[a]['quoteList'].length < quotesJson[b]['quoteList'].length ? 1 : -1;
      }
    }
    if(method == "name") {
      return function(a, b) {
        return quotesJson[a]['nickname'].localeCompare(quotesJson[b]['nickname'], 'en');
      }
    }
  }
  function sortHandlerQuoteLevel(method) {
    // Sorts based on quotes themselves (CALLED BY: "quoteListRenderQuoteLevel")
    if(method == "timestamp_ascending") {
      return function(a, b) {
        return a['quote_timestamp_parsed'] > b['quote_timestamp_parsed']? 1 : -1;
      }
    }
    if(method == "timestamp_descending") {
      return function(a, b) {
        return a['quote_timestamp_parsed'] < b['quote_timestamp_parsed']? 1 : -1;
      }
    }
  }

  // Map quote objects through top level info
  const quoteListRenderTopLevel: ReactNode = Object.keys(quotesJson).sort(sortHandlerTopLevel(sortMethod)).map((key) => {
    return quotesJson[key]['quoteList'].map((quoteObj) => {
      return <QuoteItem key={quoteObj['timestamp']} cursive={cursive} quoteObject={quoteObj} speaker={key} speaker_nickname={capitalizeFirstLetter(quotesJson[key]['nickname'])} />
    })
  });

  // Map quote objects based on quote specific values
  const quoteListRenderQuoteLevel: ReactNode = quotesArr.sort(sortHandlerQuoteLevel(sortMethod)).map((quoteListItem) => {
    // Convert quote back to expected format
    let quoteObj = {"timestamp": quoteListItem['quote_timestamp'], "text": quoteListItem['quote_text'], "addedBy": quoteListItem['quote_addedBy']};
    // Return the object
    return <QuoteItem key={quoteListItem['quote_timestamp']} cursive={cursive} quoteObject={quoteObj} speaker={quoteListItem['userID']} speaker_nickname={capitalizeFirstLetter(quoteListItem['userNickname'])} />
  });

  return (
    <main className="flex flex-col items-center p-24 pt-10">
      <PageTitle text="Quotes" />
      <div className="flex flex-row justify-center w-1/2">
        <QuoteCounts className="w-1/2 mr-5" quotesJson={quotesJson} updateTimestamp={quotesUpdateTimestamp} />
        <QuoteSortBlock className="w-1/4 ml-5" sortMethod={sortMethod} cursive={cursive} />
      </div>
      <div className="flex flex-col justify-around mt-10 mb-10">
        {(sortMethod == "count" || sortMethod == "name") ? (quoteListRenderTopLevel) : (quoteListRenderQuoteLevel) }
      </div>
    </main>
  );
}
