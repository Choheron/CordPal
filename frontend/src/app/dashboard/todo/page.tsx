import { getFilesInDir } from "@/app/lib/utils";
import { ReactNode } from "react";
import Image from "next/image";

export default function todo() {
  return (
    <main className="flex min-h-screen flex-col items-center p-24 pt-10">
      <h1 className="text-4xl underline antialiased">ToDo List:</h1>
      <br/>
      <br/>
      <ul>
        <li>Quote of the day</li>
        <li>Multiple discord support</li>
        <li>Allow users to submit images</li>
      </ul>
    </main>
  );
}
