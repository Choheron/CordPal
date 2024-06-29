import { getFilesInDir } from "@/app/lib/utils";
import { ReactNode } from "react";
import Image from "next/image";

export default function todo() {
  const todoList = [
    {'work_item': "Quote of the Day", 'status': 'BACKLOG'},
    {'work_item': "Multiple discord support", 'status': 'BACKLOG'},
    {'work_item': "Route user directly to content if they have the session cookie", 'status': 'DONE'},
    {'work_item': "Allow users to submit images", 'status': 'BACKLOG'},
    {'work_item': "Logout Button", 'status': 'BACKLOG'},
    {'work_item': "Implement Versioning for BE and FE", 'status': 'BACKLOG'},
  ]

  const genTodoList: ReactNode = todoList.sort((a, b) => a['status'] < b['status'] ? 1 : -1).map((work_obj) => {
    return (
      <tr key={work_obj['status']}>
        <td className="text-center py-1 px-3">{work_obj['work_item']}</td>
        <td className="text-left border-gray-500 border-l py-1 pl-2">{work_obj['status']}</td>
      </tr> 
    );
  });

  return (
    <main className="flex min-h-screen flex-col items-center p-24 pt-10">
      <h1 className="text-4xl underline antialiased">
        ToDo List:
      </h1>
      <div className="w-fit p-5 pl-10 rounded-xl">
        <table className="table-auto w-full rounded-xl bg-gray-700">
          <thead>
            <tr className="border-gray-500 border-b">
              <th className="text-xl py-1 px-3">
                Work Item
              </th>
              <th className="text-xl border-gray-500 border-l py-1 px-3">
                Completion Status
              </th>
            </tr>
          </thead>
          <tbody>
            {genTodoList}
          </tbody>
        </table>
      </div>
    </main>
  );
}
