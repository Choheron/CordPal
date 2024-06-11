import { getFilesInDir } from "@/app/lib/utils";
import { ReactNode } from "react";

export default function Page() {

  function loadImages(imageDir: string): ReactNode {
    const fileList = getFilesInDir(imageDir);
    return (
      fileList.map((path: string) => (
        <div className="flex flex-col w-4/5 items-center relative p-6">
          <img 
            src={"/photoshops/" + path}
            alt={path}
            width="auto"
            height="auto"
          />
          { /* Below is old Image code that uses the Image from NextJs... proved annoying */ }
          {/* <Image 
            src={"/photoshops/" + path}
            width={0}
            height={0}
            sizes="100vw"
            alt="The one true god"
            style={{ width: '75%', height: 'auto' }}
          /> */}
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
