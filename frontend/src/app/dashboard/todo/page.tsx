import { ReactNode } from "react";
import clsx from "clsx";
import PageTitle from "@/app/ui/dashboard/page_title";
import { getAllTodoItems } from "@/app/lib/todo_uils";

export default async function todo() {
  const todoList = await getAllTodoItems();
  // Todo Item Example
  // {
  //   id: 37,
  //   todo_title: 'Add Toggle for Quote Text Font',
  //   todo_description: 'No Description Provided',
  //   todo_status: 'Done',
  //   todo_category: 'User Interface/User Experience'
  // },

  const genTodoList: ReactNode = todoList.filter((todoItem) => todoItem['todo_status'] != "Done").sort((a, b) => a['todo_status'] < b['todo_status'] ? 1 : -1).map((work_obj, index) => {
    return (
      <tr key={work_obj['todo_status'] + index} className={clsx(
        "text-center",
        {
          "bg-green-900": work_obj['todo_status'] === "Done",
          "bg-yellow-700": work_obj['todo_status'] === "Work In Progress",
        },
        )}>
        <td className="py-1 px-3">{work_obj['todo_title']}</td>
        <td className="border-gray-500 border-l py-1 pl-2">{work_obj['todo_status']}</td>
        <td className="border-gray-500 border-l py-1 pl-2">{work_obj['todo_category']}</td>
      </tr> 
    );
  });

  const genDoneList: ReactNode = todoList.filter((todoItem) => todoItem['todo_status'] == "Done").sort((a, b) => a['todo_category'] < b['todo_category'] ? 1 : -1).map((work_obj, index) => {
    return (
      <tr key={index} className="text-center bg-green-900">
        <td className="py-1 px-3">{work_obj['todo_title']}</td>
        <td className="border-gray-500 border-l py-1 pl-2">{work_obj['todo_category']}</td>
      </tr> 
    );
  });

  return (
    <main className="flex flex-col items-center px-24 pt-10">
      <PageTitle text="Todo" />
      <div className="w-fit p-5 pt-0 pl-10">
        <table className="table-auto w-full rounded-xl bg-gray-700">
          <thead>
            <tr className="border-gray-500 border-b">
              <th className="text-xl py-1 px-3">
                Work Item
              </th>
              <th className="text-xl border-gray-500 border-l py-1 px-3">
                Completion Status
              </th>
              <th className="text-xl border-gray-500 border-l py-1 px-3">
                Category
              </th>
            </tr>
          </thead>
          <tbody>
            {genTodoList}
          </tbody>
        </table>
        <br/>
        <table className="table-auto w-full rounded-xl bg-gray-700">
          <thead>
            <tr className="border-gray-500 border-b">
              <th className="text-xl py-1 px-3">
                Completed Items
              </th>
              <th className="text-xl border-gray-500 border-l py-1 px-3">
                Category
              </th>
            </tr>
          </thead>
          <tbody>
            {genDoneList}
          </tbody>
        </table>
      </div>
    </main>
  );
}
