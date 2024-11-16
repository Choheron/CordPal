"use client";

import React from "react";
import { useRouter } from 'next/navigation';

import {Accordion, AccordionItem} from "@nextui-org/react";
import {Select, SelectItem} from "@nextui-org/react";
import clsx from "clsx";
import { Conditional } from "../conditional";
import { updateToDoItem } from "@/app/lib/todo_uils";

// Creates a single todo item row. Expects the following props:
// Expected Props:
//  - todo_object: Object -> Todo Item Data
//  - index: int -> Index for map function
//  - isUserAdmin: boolean -> Is the current user an admin user
export default function TodoItem(props) {
  const todo_object = props['todo_object'];
  const index = props['index'];
  const [status, setStatus] = React.useState<string>(todo_object['todo_status'])
  const router = useRouter();

  const handleSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatus(e.target.value);
  };

  React.useEffect(() => {
    const updateTodo = async () => {
      await updateToDoItem(todo_object)
    }
    todo_object['todo_status'] = String(status)
    updateTodo()
    // Reload page
    router.refresh()
  }, [status])

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
      <Conditional showWhen={(!(todo_object['todo_status'] == "Done")) || (props.isUserAdmin)}>
        <td className="border-gray-500 border-l py-1 pl-2">
          <Conditional showWhen={props.isUserAdmin}>
            <Select 
              label="Status" 
              size="sm"
              className="max-w-xs" 
              defaultSelectedKeys={[status]}
              variant="flat"
              onChange={handleSelectionChange}
            >
              <SelectItem key={"Backlog"}>
                Backlog
              </SelectItem>
              <SelectItem key={"Work In Progress"}>
                Work In Progress
              </SelectItem>
              <SelectItem key={"Done"}>
                Done
              </SelectItem>
            </Select>
          </Conditional>
          <Conditional showWhen={!props.isUserAdmin}>
            {todo_object['todo_status']}
          </Conditional>
        </td>
      </Conditional>
      <td className="border-gray-500 border-l py-1 pl-2">{todo_object['todo_category']}</td>
    </tr> 
  );
}