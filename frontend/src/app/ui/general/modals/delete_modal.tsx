'use client'

import {
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
  useDisclosure
} from "@heroui/modal";
import { Button, Spinner, Checkbox, Tooltip, Textarea } from "@heroui/react";
import React from "react";
import { RiDeleteBin2Line, RiErrorWarningFill } from "react-icons/ri";
import { Conditional } from "../../dashboard/conditional";
import { useRouter } from 'next/navigation'




// Modal to display a confirmation window for deletion
// NOTE: Could probably just make this into a general confirmation window
// Expected Props:
//   - confirmCallback: Function - Function to call when user clicks confirm
//   - cancelCallback: Function - Function to call when a user clicks cancel
//   - isButtonDisabled: Boolean - Function to set if the button to open the modal is disabled
//   - tooltipContent: String - Text to show on button hover
//   - titleText: String - Text to display in modal title
//   - bodyText: String - Text to display in modal body
//   - redirectText: String - Url to redirect to after successful delete (OPTIONAL)
//   - textboxDescription: String - Description to show over text input box. If a this is provided, the callback will assume to have a text field
//   - textboxPlaceholder: String - Default text in the textbox.
export default function DeleteModal(props) {
  const cancelCallback = props.cancelCallback
  // Props
  const isButtonDisabled = (props.isButtonDisabled) ? props.isButtonDisabled : false;
  const tooltipContent = (props.tooltipContent) ? props.tooltipContent : "";
  const titleText = (props.titleText) ? props.titleText : "Delete?";
  const bodyText = (props.bodyText) ? props.bodyText : "Are you sure you would like to delete?";
  const redirectText = (props.redirectText) ? props.redirectText : null;
  const textboxDescription = (props.textboxDescription) ? props.textboxDescription : null;
  const textboxPlaceholder = (props.textboxPlaceholder) ? props.textboxPlaceholder : null;
  // Functionality states
  const [confirmed, setConfirmed] = React.useState(false)
  const [processing, setProcessing] = React.useState(false)
  const [errorText, setErrorText] = React.useState("")
  const [textboxText, setTextboxText] = React.useState("")
  // Modal Controller Vars
  const {isOpen, onOpen, onOpenChange, onClose} = useDisclosure();
  // Router
  const router = useRouter()

  const handleDelete = async () => {
    setProcessing(true)
    const status = (((textboxDescription != null) && (textboxPlaceholder != null)) ? await props.confirmCallback(textboxText) : await props.confirmCallback())
    if(status != 200) {
      setErrorText(`An error occured when attempting to delete the album, please contact system Admins! Error Code: ${status}`)
      setConfirmed(false)
      return
    }
    if(redirectText) {
      // Redirect user to AOtD Page after successful delete
      router.push(redirectText)
    } else {
      handleCancel()
    }
  }

  const handleCancel = () => {
    setErrorText("")
    setConfirmed(false)
    setProcessing(false)
    onClose()
  }

  return (
    <>
      <Tooltip 
        content={tooltipContent} 
        isDisabled={tooltipContent == ""}
      >
        <span>
          <Button 
            className="p-1 mx-auto my-2 bg-gradient-to-br from-red-700/80 to-red-800/80 hover:underline text-black"
            size="sm"
            onPress={onOpen}
            radius="lg"
            variant="solid"
            isDisabled={isButtonDisabled}
          >
            <RiDeleteBin2Line className="text-2xl" />
          </Button>
        </span>
      </Tooltip>
      <Modal 
        size="sm"
        scrollBehavior={"inside"}
        isOpen={isOpen} 
        onOpenChange={onOpenChange} 
        backdrop="blur"
        onClose={cancelCallback}
      >
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex flex-col flex-wrap w-full gap-1 content-center">
                <p>{titleText}</p>
              </ModalHeader>
              <ModalBody>
                <Conditional showWhen={errorText != ""}>
                  <div className="bg-red-500/10 p-2 rounded-xl w-full border-2 border-red-950">
                    <RiErrorWarningFill className="text-2xl mx-auto text-yellow-500" />
                    <p className="text-center">
                      {errorText}
                    </p>
                    <RiErrorWarningFill className="text-2xl mx-auto text-yellow-500" />
                  </div>
                </Conditional>
                <p className="w-full text-center">
                  {bodyText}
                </p>
                <Checkbox 
                  isSelected={confirmed} 
                  onValueChange={setConfirmed}
                  className="w-full ml-1"
                >
                  I&apos;m Sure!
                </Checkbox>
                <Conditional showWhen={(textboxDescription != null) && (textboxPlaceholder != null)} >
                  <Textarea 
                    className="max-w-xs" 
                    label={textboxDescription} 
                    placeholder={textboxPlaceholder} 
                    onValueChange={setTextboxText}
                  />
                </Conditional>
              </ModalBody>
              <ModalFooter>
                <div className="flex w-full justify-between">
                  <Button
                    color="danger" 
                    variant="bordered" 
                    onPress={handleCancel}
                  >
                    CANCEL
                  </Button>
                  <Button 
                    variant="solid" 
                    className="mr-2 mt-auto bg-red-500" 
                    isDisabled={!confirmed} 
                    onPress={handleDelete}
                  >
                    <Conditional showWhen={!processing}>
                      DELETE ALBUM
                    </Conditional>
                    <Conditional showWhen={processing}>
                      <Spinner />
                    </Conditional>
                  </Button>
                </div>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  )
}