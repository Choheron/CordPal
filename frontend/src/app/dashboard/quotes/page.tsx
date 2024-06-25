import { cookies } from "next/headers";
import QuoteItem from "@/app/ui/dashboard/quotes/quoteItem";
import { ReactNode } from "react";

export default async function quotes() {
  
  // Below Code allows for serverside computing of cookie stuff!
  const getCookie = async (name: string) => {
    return cookies().get(name)?.value ?? '';
  }
  const sessionCookie = await getCookie('sessionid');
  // Query quotes endpoint for bot interaction
  const quoteListResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/botInteraction/getAllQuotes`, {
    method: "GET",
    credentials: "include",
    cache: 'no-cache',
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    }
  });
  const quotesJson = JSON.parse(await quoteListResponse.text());
  // Store last updated time then remove it
  const quotesUpdateTimestamp = quotesJson['last_updated'];
  delete quotesJson['last_updated'];
  // console.log(quotesJson);

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
  const quoteListRender: ReactNode = Object.keys(quotesJson).map((key) => {
    return quotesJson[key]['quoteList'].map((quoteObj) => {
      return <QuoteItem key={quoteObj['timestamp']} quoteObject={quoteObj} speaker={(quotesJson[key]['nickname'].charAt(0).toUpperCase() + quotesJson[key]['nickname'].slice(1))} />
    })
  });

  return (
    <main className="flex min-h-screen flex-col items-center p-24 pt-10">
      <h1 className="text-4xl underline antialiased">Quotes:</h1>
      <div className="flex flex-col justify-around mt-10 mb-10">
        {quoteListRender}
      </div>
    </main>
  );
}
