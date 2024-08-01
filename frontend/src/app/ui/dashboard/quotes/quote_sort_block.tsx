"use client";

import {Select, SelectItem} from "@nextui-org/select";
import { useRouter } from "next/navigation";

// 
// Expected Props:
//  - sortMethod: string - Method by which to sort the quotes listed
//
// TODO: Add filtering options
export default function QuoteSortBlock(props) {
  // Get Router
  const router = useRouter();
  // Default Sorting Options
  const sortOptions = [
    {key: "count", label: "Count", description: "Sort by number of quotes (High to Low)"},
    {key: "name", label: "Name", description: "Sort by speaker's name (Alphabetical)"},
    {key: "timestamp_ascending", label: "Timestamp (Ascending)", description: "Sort by Time (Oldest First)"}, 
    {key: "timestamp_descending", label: "Timestamp (Descending)", description: "Sort by Time (Newest First)"}
  ];

  const changeSortMethod = (event) => {
    router.push("?sortMethod=" + event.currentKey);
  };

  return (
    <div className="flex justify-around mt-3 w-1/2">
      <Select
        label="Sort By:"
        labelPlacement="outside"
        defaultSelectedKeys={[props['sortMethod']]}
        className="dark max-w-xs"
        onSelectionChange={changeSortMethod}
      >
        {sortOptions.map((sortOpt) => (
          <SelectItem key={sortOpt.key} textValue={sortOpt.label} >
            <div className="flex flex-col">
              <span className="text-small">{sortOpt.label}</span>
              <span className="text-tiny text-default-400">{sortOpt.description}</span>
            </div>
          </SelectItem>
        ))}
      </Select>
    </div>
  );
}