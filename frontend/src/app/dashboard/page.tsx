import { cookies } from "next/headers";

export default async function Page() {

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
    <main className="flex min-h-screen flex-col items-center p-24 pt-10">
      <h1 className="text-4xl underline antialiased">Homepage</h1>
      <p>Here is your discord user data:</p>
      <p className="b pt-10 border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
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
      </p>
    </main>
  );
}