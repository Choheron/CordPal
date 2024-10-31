'use client'

import {
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
  useDisclosure
} from "@nextui-org/modal";
import { Button } from "@nextui-org/react";
import {Input} from "@nextui-org/react";
import {Textarea} from "@nextui-org/input";
import React from "react";
import { useRouter } from 'next/navigation';
import {Select, SelectItem, Selection } from "@nextui-org/react";
import { createToDoItem } from "@/app/lib/todo_uils";

// Modal to allow a user to create a new todo item
// Expected Props:
//  - todoOptions: Json containing dropdown options
export default function AddTodoModal(props) {
  // Dynamic values
  const [titleValue, setTitleValue] = React.useState("");
  const [descriptionValue, setDescriptionValue] = React.useState("");
  const [statusValue, setStatusValue] = React.useState<Selection>();
  const [categoryValue, setCategoryValue] = React.useState<Selection>();
  // Select options
  const statuses = props.todoOptions['status'];
  const categories = props.todoOptions['category'];

  const {isOpen, onOpen, onOpenChange, onClose} = useDisclosure();
  const router = useRouter();

  // Send request to upload the submitted image
  const uploadPress = () => {
    // Create payload to send data to backend
    let todoData = {}
    todoData['title'] = titleValue
    todoData['description'] = descriptionValue
    todoData['category'] = categoryValue?.['anchorKey']
    todoData['status'] = statusValue?.['anchorKey']
    // Send data for todo creation
    createToDoItem(JSON.stringify(todoData))
    // Call cancel functionality to clear systems
    cancelPress()
  }

  // Reset values on cancel button press
  const cancelPress = () => {
    // Clear all form data 
    setTitleValue("")
    setDescriptionValue("")
    setStatusValue(undefined)
    setCategoryValue(undefined)
    
    onClose()
    // Reload page
    router.refresh()
  }
  
  return (
    <>
      <Button 
        className="p-1 mb-1 rounded-lg text-tiny text-inheret min-w-0 min-h-0 h-fit hover:underline"
        size="sm"
        onPress={onOpen}
        radius="none"
        variant="light"
      >
        Add Todo Item
      </Button>
      <Modal size="xl" isOpen={isOpen} onOpenChange={onOpenChange} isDismissable={false} onClose={cancelPress}>
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex flex-col flex-wrap w-full gap-1 content-center">
                Create a New ToDo Item
              </ModalHeader>
              <ModalBody>
              <div className="flex flex-col gap-2 justify-evenly">
                <Input
                  isRequired
                  className="mt-2"
                  label="Image Title"
                  placeholder="Enter Image Title"
                  value={titleValue}
                  onValueChange={setTitleValue}
                />
                <Textarea
                  label="Description"
                  placeholder="Optional description of the image, provide context, leave blank, etc."
                  value={descriptionValue}
                  onValueChange={setDescriptionValue}
                />
                <Select
                  label={"Completion Status"}
                  isRequired
                  selectionMode='single'
                  classNames={{
                    base: "w-fill",
                  }}
                  selectedKeys={statusValue}
                  onSelectionChange={setStatusValue}
                >
                  {Object.values(statuses).map((status) => (
                    <SelectItem key={status?.['label']}>{status?.['label']}</SelectItem>
                  ))}
                </Select>
                <Select
                  label={"Category"}
                  isRequired
                  selectionMode='single'
                  classNames={{
                    base: "w-fill",
                  }}
                  selectedKeys={categoryValue}
                  onSelectionChange={setCategoryValue}
                >
                  {Object.values(categories).map((category) => (
                    <SelectItem key={category?.['label']}>{category?.['label']}</SelectItem>
                  ))}
                </Select>
              </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={cancelPress}>
                  Cancel
                </Button>
                <Button 
                  color="primary" 
                  isDisabled={!((titleValue !== "") && (statusValue) && (categoryValue))}
                  onPress={uploadPress}
                >
                  Upload
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  )
}