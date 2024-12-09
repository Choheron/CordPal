import { josefin } from "../fonts"

// Expected props:
//  - text: String - Title to be displayed
export default function PageTitle(props) {
  
  return (
    <h1 className={`${josefin.className} text-4xl text-center underline antialiased pb-5`}>{props['text']}</h1>
  );
}