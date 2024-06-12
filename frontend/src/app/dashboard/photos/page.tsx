import { getFilesInDir } from "@/app/lib/utils";
import { ReactNode } from "react";
import Image from "next/image";

export default function Page() {

  function loadImages(imageDir: string): ReactNode {
    const fileList = getFilesInDir(imageDir);
    return (
      fileList.map((path: string) => (
        <div key={path} className="flex flex-col w-4/5 items-center relative p-6">
          <Image 
            src={"/photoshops/" + path}
            width={0}
            height={0}
            sizes="100vw"
            alt="The one true god"
            style={{ width: 'auto', height: 'auto' }}
          />
          <p>{path}</p>
        </div>
      ))
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-24 pt-10">
      <h1 className="text-4xl underline antialiased">Photoshops</h1>
      {loadImages("./public/photoshops")}
    </main>
  );
}
