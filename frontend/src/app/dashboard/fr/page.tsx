import CreateFuncRequestModal from "@/app/ui/dashboard/fr/modals/create_functionality_request_modal";
import PageTitle from "@/app/ui/dashboard/page_title";

export default async function page() {
  

  return (
    <main className="flex flex-col items-center lg:px-24 pt-10">
      <PageTitle text="Functionality Requests" />
      <div className="flex">
        <CreateFuncRequestModal />
        <div className="border p-2 border-neutral-800 bg-zinc-800/30 rounded-xl font-extralight text-center">
          <p>
            Have an idea for something that would make the site better? Please feel free to submit a functionality request! Before submitting a request, please be sure another user hasnt already submitted 
            something similar. Duplicate requests will be deleted or rejected by admins.
          </p>
        </div>
      </div>
    </main>
  );
}
