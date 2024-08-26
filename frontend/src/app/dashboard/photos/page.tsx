import { getFilesInDir } from "@/app/lib/utils";
import { ReactNode } from "react";
// Note: By using NextUI's image, I have moved the image rendering to the client, this could be an issue in larger systems
import { Image } from "@nextui-org/image";
import NextImage from "next/image";
import PageTitle from "@/app/ui/dashboard/page_title";

export default function photos() {

  function loadImages(imageDir: string): ReactNode {
    const fileList = getFilesInDir(imageDir);
    return (
      fileList.map((path: string) => (
        <div key={path} className="flex flex-col w-4/5 items-center relative p-6 pt-3 md:w-full">
          <Image 
            as={NextImage}
            src={"/photoshops/" + path}
            width={0}
            height={0}
            // layout="responsive"
            sizes="100vw"
            alt={path}
            style={{ width: 'auto', height: 'auto' }}
            className="rounded-lg"
          />
        </div>
      ))
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-24 pt-10">
      <PageTitle text="Photoshops" />
      {loadImages("./public/photoshops")}
    </main>
  );
}
