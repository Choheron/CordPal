import { padNumber } from "./utils"


export function monthToWeekArray(year, month_number, dayCount) {
  // Populate an array containing strings of dates (YYYY-MM-DD) that corresponds to where to place the days in the UI
  const firstDay = new Date(Number(year), Number(month_number) - 1, 1)
  const lastMonth = new Date(new Date(firstDay).setMonth(firstDay.getMonth() - 1));
  // Array will contain subarrays containing data from sat to sun (one week)
  let dates: any = [[],[],[],[],[],[]]
  let weekIndex = 0
  let dayIndex = 1
  for(dayIndex; dayIndex <= dayCount; dayIndex++) {
    const date = new Date(Number(year), Number(month_number) - 1, dayIndex)
    const dayOfWeek = date.getDay()
    // Special if block for if day is first day
    if(dayIndex == 1) {
      let x = 0
      while(x < dayOfWeek) {
        // THIS IS UGLY WHAT AM I DOING LOL
        dates[weekIndex].push(`${lastMonth.getFullYear()}-${padNumber(lastMonth.getMonth() + 1)}-${padNumber((new Date(new Date().setDate(firstDay.getDate() - (dayOfWeek - (x)))).getDate()))}`)
        x++;
      }
    }
    // Add date to array
    dates[weekIndex].push(`${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}`)
    // Increment week index if day is a sunday
    if(date.getDay() == 6) {
      weekIndex++;
    }
  }
  // Return dates array
  return dates
}