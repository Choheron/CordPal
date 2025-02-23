import { RiArrowUpFill } from "react-icons/ri"

// Display a dynamic percentage
// Expected Props:
//  - title: String - Title of chart
//  - percentage: Float - Percentage to display
//  - underColor: Tailwind String - Color to use for the first half of the bar
//  - underLabel: String - Label for data under the percentage
//  - overColor:  Tailwind String - Color to use for the first half of the bar
//  - overLabel: String - Label for data over the percentage
export default function CustomPercentageDisplay(props) {

  return (
    <div className="w-full mb-7">
      <p>{props.title}</p>
      <div className={`relative w-full`}>
        {/* Bar Container */}
        <div className={`w-full ${props.overColor} h-6 rounded-2xl overflow-hidden`}>
          {/* Progress Fill */}
          <div
            className={`h-full ${props.underColor} transition-all duration-300`}
            style={{ width: `${props.percentage}%` }}
          >
            <p className="w-full text-center overflow-hidden text-black font-normal">{props.underLabel}</p>
          </div>
        </div>
        {/* Percentage Pointer */}
        <div
          className={`absolute top-6`}
          style={{ left: `${props.percentage}%` }}
        >
          <div className="w-fit -ml-[50%] text-sm" >
            <RiArrowUpFill className="mx-auto"/>
            <p>
              <b>{props.percentage}%</b>
            </p>
          </div>
        </div>
        {/* Over Number Display */}
        <div
          className={`absolute top-0 right-0 overflow-hidden`}
          style={{ width: `${100 - props.percentage}%` }}
        >
          <p className="w-full text-center text-black font-normal"><b>{props.overLabel}</b></p>
        </div>
      </div>
    </div>
  )
}