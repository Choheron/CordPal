"use client";

import {Select, SelectItem} from "@nextui-org/select";
import {Checkbox} from "@nextui-org/checkbox";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

// 
// Expected Props:
//  - sortMethod: string - Method by which to sort the quotes listed
//
// TODO: Add filtering options
export default function QuoteSortBlock(props) {
  // Get Router
  const router = useRouter();
  // Set some states for quote sorting
  const [sortMethod, setSortMethod] = useState(props['sortMethod']);
  const [cursive, setCursive] = useState((props['cursive'] == 'true'));
  // Default Sorting Options
  const sortOptions = [
    {key: "count", label: "Count", description: "Sort by number of quotes (High to Low)"},
    {key: "name", label: "Name", description: "Sort by speaker's name (Alphabetical)"},
    {key: "timestamp_ascending", label: "Timestamp (Ascending)", description: "Sort by Time (Oldest First)"}, 
    {key: "timestamp_descending", label: "Timestamp (Descending)", description: "Sort by Time (Newest First)"}
  ];

  const changeSortMethod = (event) => {
    setSortMethod(event.currentKey);
  };

  const changeCursiveStatus = (event) => {
    setCursive(!cursive);
  }

  // Push new filtering params to react router
  useEffect(() => {
    router.push("?sortMethod=" + sortMethod + "&cursive=" + cursive);
  }, [sortMethod, cursive]);

  return (
    <div className={`flex flex-col justify-around ${props["className"]}`}>
      <Select
        label="Sort By:"
        labelPlacement="outside"
        defaultSelectedKeys={[props['sortMethod']]}
        className="dark min-w-m max-w-m"
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
      <Checkbox isSelected={cursive} onValueChange={changeCursiveStatus} >
        Cursive
      </Checkbox>
    </div>
  );
}