import PageTitle from "@/app/ui/dashboard/page_title"

// Page to display historial data for an specific date
export default async function Page({
  params,
}: {
  params: Promise<{ date: string }>
}) {
  const date = (await params).date
  let dateArr = (date as string).split("-")
  
  return (
    <div className="flex flex-col items-center p-3 pb-36 pt-10">
      <PageTitle text={`Historical Album Of the Day Data - ${date}`} />
      <div className="flex gap-1 font-extralight">
        <p>
          This page has been relocated to: 
        </p>
        <a
          className="text-blue-600 hover:underline"
          href={`../calendar/${dateArr[0]}/${dateArr[1]}/${dateArr[2]}`}
        >
          dashboard/spotify/calendar/{dateArr[0]}/{dateArr[1]}/{dateArr[2]}
        </a>
      </div>
    </div>    
  )
}