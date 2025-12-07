"use client"

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
  Alert,
  Accordion,
  AccordionItem,
  Input,
} from "@heroui/react";

import StatusBreakdownTable from "./tables/status_breakdown_table";
import TipTap from "@/app/ui/general/input/Tiptap";
import { useState } from "react";

// A modal to allow users to submit a functionality request.
export default function CreateFuncRequestModal(props) {
  // Data states
  const [summary, setSummary] = useState("")
  const [description, setDescription] = useState(`
    <p>This is a template for an example request, do whatever you'd like in the request. Gifs will function similar to the AOtD Review. Youtube links will embed. Emojis are allowed and encouraged!</p>
    <h2>Overview</h2>
    <p><b>I would like to be able to do X when X</b> is happening! (blah blah)</p>
    <h2>Functionality</h2>
    <h3>The Gift of Flight</h3>
    <p>I would like to be able to do X when X is happening! (blah blah)</p>
  `)
  // Control modal open state
  const {isOpen, onOpen, onOpenChange} = useDisclosure();

  // Warning text
  const preWarnText = `
    Before submitting a functionality request, please be sure you have reviewed existing requests and are not making a duplicate. Duplicates will be deleted/locked by admins. If you find that you have 
    accidentally submitted a duplicate, you are welcome to delete it by going to the request's page and deleting it.
  `

  return (
    <>
      <Button 
        onPress={onOpen}
        radius="full"
        className="min-w-fit mx-2 my-auto bg-gradient-to-br from-green-700/80 to-green-800/80"
      >
        Submit a Functionality Request
      </Button>
      <Modal 
        isOpen={isOpen} 
        onOpenChange={onOpenChange}
        size="full"
        classNames={{
          body: "py-5",
          base: "bg-stone-950 font-extralight",
          header: "border-b-[1px] bg-black/30 border-stone-950",
          footer: "border-t-[1px] border-[#292f46]",
          closeButton: "hover:bg-white/5 active:bg-white/10",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader 
                className="flex flex-col gap-1"
              >
                Submit a Functionality Request
              </ModalHeader>
              <ModalBody>
                <Alert
                  color="warning" 
                  title={preWarnText}
                  classNames={{
                    base: "max-h-fit",
                  }}
                />
                <div className="border p-2 border-neutral-800 bg-black/30 rounded-xl text-center">
                  <Accordion
                    isCompact={true}
                    defaultExpandedKeys={["1"]}
                  >
                    <AccordionItem 
                      key="1" 
                      aria-label="Rules Accordian" 
                      title="Submitting a Functionality Request"
                      subtitle="Functionality Request Submission Process Outline"
                      className="font-normal"
                    >
                      <div className="flex flex-col md:flex-row">
                        <div className="w-full lg:w-1/2 text-left text-sm border-stone-800 lg:border-r lg:pr-2 lg:mr-2">
                          <ul className="list-disc pl-5">
                            <li>When you submit a Functionality Request, an admin will review it and when it has been deemed fully fleshed out, it will be moved to <i>Accepted</i>.</li>
                            <li>Requests are visible to everyone, but cant be commented on by others until it has been given the <i>Accepted</i> state.</li>
                            <li>Requests can be voted on, so users can demonstrate a level of priority based on votes.</li>
                            <li>Comments can be deleted by both admins and the original submitter of the request.</li>
                            <li>Please do not spam requests.</li>
                            <li>After submitting a request, you can delete it until it is in the <i>Under Review</i> state, in which case it can only be deleted by admins.</li>
                          </ul>
                        </div>
                        <div className="w-full lg:w-1/2">
                          <StatusBreakdownTable />
                        </div>
                      </div>
                    </AccordionItem>
                  </Accordion>
                </div>
                <div className="flex flex-col h-full">
                  {/* Summary Input Box */}
                  <Input 
                    isRequired
                    variant="bordered"
                    label="Summary"
                    placeholder="Enter a summary of the desired functionality"
                    size="lg"
                    labelPlacement="outside"
                    description="A summary or title of the desired functionality, please be consise but descriptive. (Max Length: 255)"
                    isClearable={true}
                    maxLength={255}
                    value={summary}
                    onValueChange={setSummary}
                    classNames={{
                      mainWrapper: "text-white font-normal",
                      description: "text-white font-extralight",
                    }}
                  />
                  {/* Description Input Box */}
                  <div className="h-full font-normal pb-10">
                    <TipTap 
                      content={description}
                      updateCallback={setDescription}
                      textAreaClassName="h-full max-h-full"
                    />
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
                <Button color="primary" onPress={onClose}>
                  Action
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  )
}