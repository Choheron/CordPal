import { cookies } from "next/headers";
import { Conditional } from "../ui/dashboard/conditional";
import { isMember } from "../lib/discord_utils";

export default async function Page() {
  
  // Below Code allows for serverside computing of cookie stuff!
  const getCookie = async (name: string) => {
    return cookies().get(name)?.value ?? '';
  }
  const sessionCookie = await getCookie('sessionid');
  // Call to Discord API
  const userDataResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/discordapi/userData`, {
    method: "GET",
    credentials: "include",
    cache: 'force-cache',
    headers: {
      Cookie: `sessionid=${sessionCookie};`
    }
  });
  const userData = await userDataResponse.json();
  
  return (
    <main className="flex min-h-screen flex-col items-center p-24 pt-10">
      <h1 className="text-4xl underline antialiased">Homepage</h1>
      <p>Here is your discord user data:</p>
      <p className="b pt-10 border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
        ID: {userData['id']}<br/>
        Username: {userData['username']}<br/>
        Avatar Hash: {userData['avatar']}<br/>
        Discriminator: {userData['discriminator']}<br/>
        Public Flags: {userData['public_flags']}<br/>
        Flags: {userData['flags']}<br/>
        Accent Color: {userData['accent_color']}<br/>
        Global Name: {userData['global_name']}<br/>
        Banner Color: {userData['banner_color']}<br/>
        MFA Enabled: {userData['mfa_enabled']}<br/>
        Locale: {userData['locale']}<br/>
        Premium Type: {userData['premium_type']}<br/>
        <br/>
        EMAIL: {userData['email']}<br/>
      </p>
      <Conditional showWhen={!(await isMember())}>
        <br/>
        <p className="b pt-10 bg-gradient-to-b from-red-200 pb-6 pt-8 backdrop-blur-2xl dark:border-red-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          <div className="flex w-full justify-center">
            <svg className="h-56 w-56 text-red-600"  fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016zM12 9v2m0 4h.01"/>
            </svg>
          </div>
          You, {userData['global_name']}, are not a member of the server this website is for! What you are doing here???
        </p>
      </Conditional>
    </main>
  );
}