
import {Popover, PopoverTrigger, PopoverContent} from "@heroui/popover";

// Popover to display information over text
// Expected Props:
// - triggerText: String - Text to display for the trigger
// - triggerClassName: String - Optional additional tailwind for customization
// - triggerTextColor: String - Color to display trigger text
// - popoverTitle: String - Title to include in popover
// - popoverText: String - Text to include in the popover 
// - popoverPlacement: String - Placement control of popover
// - showArrow: Boolean - Show Popover with Arrow or Not
export default function InfoPopover(props) {
  
  return (
    <Popover placement={props.popoverPlacement} showArrow={props.showArrow}>
      <PopoverTrigger>
        <p className={`${props.triggerClassName} text-xs underline text-${props.triggerTextColor}`}>{props.triggerText}</p>
      </PopoverTrigger>
      <PopoverContent>
        <div className="px-1 py-2 max-w-[350px]">
          <div className="text-small font-bold">{props.popoverTitle}</div>
          <div className="text-tiny">{props.popoverText}</div>
        </div>
      </PopoverContent>
    </Popover>
  )
}