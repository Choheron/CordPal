"use server"

import "@/app/globals.css";
import { isMember } from "@/app/lib/discord_utils";
import { redirect } from "next/navigation";



export default async function Layout({ children }: { children: React.ReactNode }) {
  // Is user correctly authed
  const memberStatus = (await isMember());
  if(memberStatus == false) {
    redirect('/dashboard')
  }

  return (
    <div>
      {children}
    </div>
  );
}
