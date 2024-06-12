import { Inter } from "next/font/google";
import "@/app/globals.css";
import TopBar from "../ui/dashboard/top_bar";
import { cookies } from "next/headers";

const inter = Inter({ subsets: ["latin"] });

export default async function Layout({ children }: { children: React.ReactNode }) {

  // Below Code allows for serverside computing of cookie stuff!
  const getCookie = async (name: string) => {
    return cookies().get(name)?.value ?? '';
  }
  const sessionCookie = await getCookie('sessionid')
  // Call to Discord API
  const userDataResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/discordapi/userData`, {
    method: "GET",
    credentials: "include",
    cache: 'force-cache',
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    }
  });
  const userData = await userDataResponse.json()

  return (
    <html lang="en">
      <head><link rel="icon" href="/favicon.png" sizes="any" /></head>
      <body className={inter.className}>
        <TopBar userInfo={userData} />
        {children}
      </body>
    </html>
  );
}
