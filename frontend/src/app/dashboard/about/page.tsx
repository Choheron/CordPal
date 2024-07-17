import AboutBlock from "@/app/ui/about/about_block";

export default function about() {

  return (
    <div className="flex w-full justify-center">
      <AboutBlock loggedIn={true} />
    </div>
  );
}