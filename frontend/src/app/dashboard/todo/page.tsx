import { ReactNode } from "react";
import PageTitle from "@/app/ui/dashboard/page_title";
import { getAllTodoItems, getTodoOptions } from "@/app/lib/todo_uils";
import TodoItem from "@/app/ui/dashboard/todo/todo_item";
import AddTodoModal from "@/app/ui/dashboard/todo/add_todo_modal";
import { Conditional } from "@/app/ui/dashboard/conditional";
import { isUserAdmin } from "@/app/lib/user_utils";

export default async function todo() {
  const todoList = await getAllTodoItems();
  const adminStatus = await isUserAdmin();
  const todoCreateOptions = await getTodoOptions();
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
      <TodoItem key={work_obj['todo_status'] + index} todo_object={work_obj} index={index} />
    );
  });

  const genDoneList: ReactNode = todoList.filter((todoItem) => todoItem['todo_status'] == "Done").sort((a, b) => a['todo_category'] < b['todo_category'] ? 1 : -1).map((work_obj, index) => {
    return (
      <TodoItem key={work_obj['todo_status'] + index} todo_object={work_obj} index={index} />
    );
  });

  return (
    <main className="flex flex-col items-center lg:px-24 pt-10">
      <PageTitle text="Todo" />
      <Conditional showWhen={adminStatus}>
        <AddTodoModal todoOptions={todoCreateOptions}/>
      </Conditional>
      <div className="w-11/12 lg:w-3/4 lg:p-5 pt-0 lg:pl-10">
        <table className="table-fixed w-full rounded-xl bg-gray-700">
          <thead>
            <tr className="border-gray-500 border-b">
              <th className="text-xl py-1 px-3">
                Work Item
              </th>
              <th className={`w-1/5 text-xl border-gray-500 border-l py-1 px-3`}>
                Completion Status
              </th>
              <th className="w-2/12 text-xl border-gray-500 border-l py-1 px-3">
                Category
              </th>
            </tr>
          </thead>
          <tbody>
            {genTodoList}
          </tbody>
        </table>
        <br/>
        <table className="table-fixed w-full rounded-xl bg-gray-700">
          <thead>
            <tr className="border-gray-500 border-b">
              <th className="text-xl py-1 px-3">
                Completed Items
              </th>
              <th className="w-2/12 text-xl border-gray-500 border-l py-1 px-3">
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
