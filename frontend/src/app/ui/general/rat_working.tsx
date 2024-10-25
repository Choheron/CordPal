import Image from "next/image";

// Display a WIP message with the rat
export default function RatWIP(props) {
  

  return (
    <div className="flex flex-col">
      <p>Much like this rat, this page is a work in progress.</p>
      <Image
        className="mx-auto"
        alt="Work In Progress Rat"
        src="/images/RatWorkout.png"
        height={100}
        width={100}
      />
    </div>
  );
}