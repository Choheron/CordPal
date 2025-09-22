'use client'

import {
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
  useDisclosure
} from "@heroui/modal";
import { Button, Spinner, Checkbox, Tooltip, addToast, Input } from "@heroui/react";
import React from "react";
import { RiErrorWarningFill, RiFindReplaceFill } from "react-icons/ri";
import { useRouter } from 'next/navigation'
import { replaceAlbumInBackend } from "@/app/lib/aotd_utils";
import { Conditional } from "../../conditional";


// Modal to display a confirmation window for deletion
// NOTE: Could probably just make this into a general confirmation window
// Expected Props:
//   - albumObj: Object - The Object representing the album from the backend
//   - isButtonDisabled: Boolean - Is the button disabled?
//   - isCurrentlyAOTD: Boolean - Is the album currently the AOTD?
//   - serverCallback: Function - Optional function to run on the server-side after running album replacement
export default function ReplaceAlbumModal(props) {
  // Props
  const albumObj = props.albumObj
  const isButtonDisabled: boolean = props.isButtonDisabled
  const isCurrentlyAOTD: boolean = (props.isCurrentlyAOTD != null) ? props.isCurrentlyAOTD : false
  // Data pulled from props
  const albumPK = albumObj['album_pk']
  const albumTitle = albumObj['title']
  // Functionality states
  const [confirmed, setConfirmed] = React.useState(false)
  const [processing, setProcessing] = React.useState(false)
  const [errorText, setErrorText] = React.useState("")
  const [mbidText, setMbidText] = React.useState("")
  // Modal Controller Vars
  const {isOpen, onOpen, onOpenChange, onClose} = useDisclosure();
  // Router
  const router = useRouter()

  const handleReplace = async () => {
    setProcessing(true)
    console.log(`Replace submitted by user for album ${albumPK} with title ${albumTitle}...`)
    const responseObj = await replaceAlbumInBackend(albumPK, mbidText, isCurrentlyAOTD)
    if(responseObj.status != 200) {
      setErrorText(`An error occured when attempting to delete the album, please contact system Admins! Error Code: ${responseObj.status} - CRID: ${responseObj.crid}`)
      setConfirmed(false)
      return
    } else {
      // Redirect user to correct page after successful update
      if(isCurrentlyAOTD) {
        if(props.serverCallback != null) {
          props.serverCallback()
        }
        router.push(`/dashboard/aotd`)
      } else {
        router.push(`/dashboard/aotd/album/${responseObj.new_mbid}`)
      }
      addToast({
        title: "Data Replacmenet Complete!",
        description: `Successfully completed replace action for ${albumTitle}. New MBID: ${responseObj.new_mbid}`,
        color: "success",
      })
      handleCancel()
    } 
  }

  const handleCancel = () => {
    setErrorText("")
    setMbidText("")
    setConfirmed(false)
    setProcessing(false)
    onClose()
  }

  return (
    <>
      <Tooltip 
        content={"Replace Album Data"}
      >
        <span>
          <Button 
            className="p-1 mx-auto my-2 bg-gradient-to-br from-blue-700/80 to-blue-800/80 hover:underline text-black"
            size="sm"
            onPress={onOpen}
            radius="lg"
            variant="solid"
            isDisabled={isButtonDisabled}
          >
            <RiFindReplaceFill className="text-2xl" />
          </Button>
        </span>
      </Tooltip>
      <Modal 
        size="md"
        scrollBehavior={"inside"}
        isOpen={isOpen} 
        onOpenChange={onOpenChange} 
        backdrop="blur"
        onClose={handleCancel}
      >
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex flex-col flex-wrap w-full gap-1 content-center text-center">
                <p>{`Replace Album Data for "${albumTitle}" with new MBID Data?`}</p>
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
                <p className="w-full">
                  Input a new MBID to use for data replacement. The data for this album on the backend will be replaced with new data queried for the passed in MBID. This is to be used when
                  and album has been incorrectly submitted or has the wrong data. 
                </p>
                <p>
                  NOTE: Please do not use this functionality to replace with enitrely different albums as that will break backend
                  function.
                </p>
                <Input 
                  className="max-w-full" 
                  label="New MBID"  
                  onValueChange={setMbidText}
                />
                <Checkbox 
                  isSelected={confirmed} 
                  onValueChange={setConfirmed}
                  className="w-full ml-1"
                >
                  I&apos;m ready to replace!
                </Checkbox>
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
                    onPress={handleReplace}
                  >
                    <Conditional showWhen={!processing}>
                      REPLACE ALBUM DATA
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