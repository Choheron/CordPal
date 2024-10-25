import PageTitle from "@/app/ui/dashboard/page_title";
import RatWIP from "@/app/ui/general/rat_working";

export default function clips() {
  return (
    <main className="flex min-h-screen flex-col items-center p-24 pt-10">
      <PageTitle text="Clips" />
      <RatWIP/>
    </main>
  );
}
