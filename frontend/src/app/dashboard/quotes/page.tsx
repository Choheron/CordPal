import { cookies } from "next/headers";
import QuoteItem from "@/app/ui/dashboard/quotes/quoteItem";

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
    cache: 'force-cache',
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    }
  });
  const quotesJson = JSON.parse(await quoteListResponse.text());

  return (
    <main className="flex min-h-screen flex-col items-center p-24 pt-10">
      <h1 className="text-4xl underline antialiased">Quotes:</h1>
      <div className="flex flex-col justify-around mt-10 mb-10">
        <QuoteItem quoteObject={quotesJson['143849159747698689']['quoteList'][3]} speaker={quotesJson['143849159747698689']['nickname']} />
        <QuoteItem quoteObject={quotesJson['143849159747698689']['quoteList'][1]} speaker={quotesJson['143849159747698689']['nickname']} />
        <QuoteItem quoteObject={quotesJson['145291709289332737']['quoteList'][2]} speaker={quotesJson['143849159747698689']['nickname']} />
      </div>
    </main>
  );
}
