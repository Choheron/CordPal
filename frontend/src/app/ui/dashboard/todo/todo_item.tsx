"use client";

import React from "react";
import {Accordion, AccordionItem} from "@nextui-org/react";
import clsx from "clsx";
import { Conditional } from "../conditional";

// Creates a single todo item row. Expects the following props:
// Expected Props:
//  - todo_object: Object -> Todo Item Data
//  - index: int -> Index for map function
export default function TodoItem(props) {
  const todo_object = props['todo_object'];
  const index = props['index'];

  return (
    <tr key={todo_object['todo_status'] + index} className={clsx(
      "text-center",
      {
        "bg-green-900": todo_object['todo_status'] === "Done",
        "bg-yellow-700": todo_object['todo_status'] === "Work In Progress",
      },
      )}>
      <td className="py-0 px-3">
        <Accordion isCompact>
          <AccordionItem key="1" aria-label={todo_object['todo_title']} title={todo_object['todo_title']} subtitle={(todo_object['todo_description'].substring(0, 15).trim() + "...")}>
            {todo_object['todo_description']}
          </AccordionItem>
        </Accordion>
      </td>
      <Conditional showWhen={!(todo_object['todo_status'] == "Done")}>
        <td className="border-gray-500 border-l py-1 pl-2">{todo_object['todo_status']}</td>
      </Conditional>
      <td className="border-gray-500 border-l py-1 pl-2">{todo_object['todo_category']}</td>
    </tr> 
  );
}