import { RiArrowUpFill } from "react-icons/ri"

// Display a dynamic percentage
// Expected Props:
//  - title: String - Title of chart
//  - percentages: List of Objects - Percentages breakdown as an object, following format expected
//  {
//    "label": <label to appear in bar>
//    "percent": <percent>
//    "data": <count or another quantity>,
//    "color": <Color Tailwind Screen>
//  }
//  - rotateLabels: Boolean - Should the data labels be rotated to make it easier to see?
export default function CustomMultipercentageDisplay(props) {
  const rotateLabels = (props.rotateLabels) ? props.rotateLabels : false;

  const mapPercentageBars = () => {
    return props.percentages.map((percent, index) => {
      return (
        <div
          key={index}
          className={`h-full ${percent['color']} transition-all duration-300`}
          style={{ width: `${percent['percent']}%` }}
        >
          <p className="w-full text-center overflow-hidden text-black font-normal">{percent['label']}</p>
        </div>
      )
    })
  }

  const mapPercentagePointers = () => {
    let percentageSum = 0

    return props.percentages.map((percent, index) => {
      let currSum = percentageSum
      percentageSum += percent['percent']

      if(percent['percent'] == 0) {
        return (
          <></>
        )
      }

      return (
        <div
          key={index}
          className={`absolute top-6`}
          style={{ left: `${currSum}%`, width: `${percent['percent']}%` }}
        >
          <div 
            className="relative flex flex-col w-full" 
          >
            <div className="w-full h-4 border-b border-l border-r rounded-b-lg"></div>
            <p 
              className={`mx-auto w-fit text-sm ${rotateLabels ? "absolute rotate-45 top-8" : ""}`}
              style={{ left: (rotateLabels ? `40%` : "") }}  
            >
              <b>{percent['data']}</b>
            </p>
          </div>
        </div>
      )
    })
  }

  return (
    <div className={`relative w-full ${rotateLabels ? "mb-16" : "mb-9"}`}>
      <p>{props.title}</p>
      <div className={`relative w-full`}>
        {/* Bar Container */}
        <div className={`flex w-full ${props.overColor} h-6 rounded-2xl overflow-hidden`}>
          {/* Percentage Fills */}
          {mapPercentageBars()}
        </div>
        {/* Percentage Pointer */}
        {mapPercentagePointers()}
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