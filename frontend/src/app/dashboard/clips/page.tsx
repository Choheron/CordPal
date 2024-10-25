import { getFilesInDir } from "@/app/lib/utils";
import { ReactNode } from "react";

import PageTitle from "@/app/ui/dashboard/page_title";
import RatWIP from "@/app/ui/general/rat_working";

export default function clips() {
  function loadVideos(imageDir: string): ReactNode {
    const fileList = getFilesInDir(imageDir);
    // Cut list into 3 different columns (into a terribly named var)
    var fileListList: any[] = [[],[],[]]
    var step = fileList.length/3;
    for (let i = 0; i < fileList.length; i++) {
      if(i < step) {
        fileListList[0].push(fileList[i])
      }else if(i < step*2) {
        fileListList[1].push(fileList[i])
      } else {
        fileListList[2].push(fileList[i])
      }
    }    

    return (
      <div className="flex gap-6 w-3/4">
        { fileListList.map((list: string[], listIndex: number) => (
          <div key={listIndex} className="w-full flex flex-col gap-6 items-center pt-3">
            { list.map((path: string, index: number) => (
              // <PhotoModal
              //   key={index}
              //   imageSrc={"/photoshops/" + path}
              //   nameString={path}
              // />
              <p>{path}</p>
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-24 pt-10">
      <PageTitle text="Clips" />
      <RatWIP/>
    </main>
  );
}
