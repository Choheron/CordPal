import { getFilesInDir } from "@/app/lib/utils";
import { ReactNode } from "react";
import Image from "next/image";

export default function todo() {
  const todoList = [
    {'work_item': "Quote of the Day", 'category': "Functionality", 'status': 'BACKLOG'},
    {'work_item': "Multiple discord support", 'category': "Functionality", 'status': 'BACKLOG'},
    {'work_item': "Route user directly to content if they have the session cookie", 'category': "UI/UX", 'status': 'DONE'},
    {'work_item': "Allow users to submit images", 'category': "Functionality", 'status': 'BACKLOG'},
    {'work_item': "Logout Button", 'category': "Functionality", 'status': 'IN PROGRESS'},
    {'work_item': "Implement Versioning for BE and FE", 'category': "CI/CD", 'status': 'BACKLOG'},
    {'work_item': "Create demo user for external access",'category': "Functionality", 'status': 'BACKLOG'},
    {'work_item': "Add an 'about' page to the default screen",'category': "Functionality", 'status': 'BACKLOG'},
    {'work_item': "Add a 'stats' page to default and user dashboards",'category': "Functionality", 'status': 'BACKLOG'},
    {'work_item': "Underline current page in nav links",'category': "UI/UX", 'status': 'DONE'},
    {'work_item': "Show quote counts in quotes page",'category': "UI/UX", 'status': 'BACKLOG'},
  ]

  const genTodoList: ReactNode = todoList.sort((a, b) => (a['status'] < b['status'])||(a['category'] < b['category']) ? 1 : -1).map((work_obj) => {
    return (
      <tr key={work_obj['status']} className="text-center">
        <td className="py-1 px-3">{work_obj['work_item']}</td>
        <td className="border-gray-500 border-l py-1 pl-2">{work_obj['status']}</td>
        <td className="border-gray-500 border-l py-1 pl-2">{work_obj['category']}</td>
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
              <th className="text-xl border-gray-500 border-l py-1 px-3">
                Category
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
