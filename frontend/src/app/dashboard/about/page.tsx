import AboutBlock from "@/app/ui/about/about_block";
import PageTitle from "@/app/ui/dashboard/page_title";

export default function about() {

  return (
    <div className="flex flex-col items-center p-24 pt-10">
      <PageTitle text="About" />
      <AboutBlock loggedIn={true} />
    </div>
  );
}