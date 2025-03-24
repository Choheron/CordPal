'use client'

import {
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
  useDisclosure
} from "@heroui/modal";
import { Button } from "@heroui/react";
import {Input} from "@heroui/react";
import {Textarea} from "@heroui/input";
import React from "react";
import { useRouter } from 'next/navigation';
import UserDropdown from "../../general/userUiItems/user_dropdown";
import { uploadImageToBackend } from "@/app/lib/photos_utils";


// Modal to allow a user to upload an image
export default function UploadPhotoModal(props) {
  const [titleValue, setTitleValue] = React.useState("");
  const [descriptionValue, setDescriptionValue] = React.useState("");
  const [taggedUsers, setTaggedUsers] = React.useState<[string]>([""])
  const [creator, setCreator] = React.useState("")
  const fileRef = React.useRef<HTMLInputElement>(null) // Reference image input field
  const [fileChosen, setFileChosen] = React.useState(false);
  const [fileName, setFileName] = React.useState("")
  const [fileType, setFileType] = React.useState("")

  const {isOpen, onOpen, onOpenChange, onClose} = useDisclosure();
  const router = useRouter();

  // Send request to upload the submitted image
  const uploadPress = () => {
    // Boolean for deciding upload
    let upload = true
    // Build FormData
    const uploadFormData = new FormData();
    // Populate form data
    uploadFormData.append("title", titleValue)
    uploadFormData.append("description", descriptionValue)
    uploadFormData.append("tagged_users", Object.values(taggedUsers).join(','))
    uploadFormData.append("creator", Object.values(creator)[0])
    // Check and add image data to form
    if(fileRef.current != null) {
      // Add image data to form
      uploadFormData.set("attached_image", fileRef.current.files![0])
      uploadFormData.set('filename', fileName)
      uploadFormData.set('filetype', fileType)
    } else {
      console.log("USER TRIED TO UPLOAD NOTHING... HOW?")
      upload = false
    }
    // Check if upload is to happen
    if(upload) {
      // Send form data to backend
      uploadImageToBackend(uploadFormData)
    }
    // Call cancel functionality to clear systems
    cancelPress()
  }

  // Reset values on cancel button press
  const cancelPress = () => {
    // Clear all form data 
    setTitleValue("")
    setDescriptionValue("")
    setTaggedUsers([""])
    setCreator("")
    setFileChosen(false)
    setFileName("")
    setFileType("")

    onClose()
    // Reload page
    router.refresh()
  }

  // Check if file is null, if not, enable submit button
  const checkFileData = () => {
    // Check and add image data to form
    if(fileRef.current != null) {
      setFileChosen(true)
      setFileName(fileRef.current.files![0].name)
      setFileType(fileRef.current.files![0].type)
    } else {
      setFileChosen(false)
      setFileName("")
      setFileType("")
    }
  }

  return (
    <>
      <Button 
        className="p-3 -mt-2 mb-2 text-sm text-inheret min-w-0 min-h-0 h-fit bg-gradient-to-br from-green-700 to-green-800 hover:underline"
        size="sm"
        onPress={onOpen}
        radius="lg"
        variant="solid"
      >
        Upload Image
      </Button>
      <Modal size="xl" isOpen={isOpen} onOpenChange={onOpenChange} isDismissable={false} onClose={cancelPress}>
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex flex-col flex-wrap w-full gap-1 content-center">
                Upload a New Image
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
                <UserDropdown 
                  label="Tagged Users"
                  placeholder="Select users who are in the image."
                  isMultipleChoice={true} 
                  setSelectionCallback={setTaggedUsers} 
                />
                <UserDropdown 
                  label="Creator"
                  isRequired
                  placeholder="Who created this image?"
                  isMultipleChoice={false} 
                  setSelectionCallback={setCreator} 
                />
                <input type="file" id="imagefile" name="file" accept="image/*" onChange={checkFileData} ref={fileRef} required />
              </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={cancelPress}>
                  Cancel
                </Button>
                <Button 
                  color="primary" 
                  isDisabled={!((titleValue !== "") && fileChosen && (creator !== ""))}
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