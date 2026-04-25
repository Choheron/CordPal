'use client'

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure
} from "@heroui/modal";
import { Button, Spinner, Textarea, Tooltip, addToast } from "@heroui/react";

import React from "react";
import { RiEditLine, RiErrorWarningFill } from "react-icons/ri";
import { useRouter } from 'next/navigation';
import { updateAlbumSubmission } from "@/app/lib/aotd_utils";
import { Conditional } from "../../conditional";


// Modal that lets the album submitter (or an admin) edit the submission comment.
// Creates an AlbumCommentHistory snapshot and a UserAction entry on save.
// Expected Props:
//   - albumMbid: string    - MusicBrainz ID of the album
//   - currentComment: string - The current submission comment shown pre-filled
//   - albumTitle: string   - Used in the modal header
//   - isButtonDisabled: boolean
export default function EditSubmissionModal(props) {
  const albumMbid: string = props.albumMbid
  const albumTitle: string = props.albumTitle
  const isButtonDisabled: boolean = props.isButtonDisabled ?? false

  const [commentText, setCommentText] = React.useState<string>(props.currentComment ?? '')
  const [processing, setProcessing] = React.useState(false)
  const [errorText, setErrorText] = React.useState('')

  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure()
  const router = useRouter()

  const handleSave = async () => {
    if (!commentText.trim()) {
      setErrorText('Album comment cannot be empty.')
      return
    }
    setProcessing(true)
    console.log(`EditSubmissionModal: Saving new comment for album ${albumMbid}...`)
    const res = await updateAlbumSubmission(albumMbid, commentText)
    if (res.status !== 200) {
      setErrorText(`Failed to update album comment. Error ${res.status} — CRID: ${res.crid}`)
      setProcessing(false)
      return
    }
    addToast({
      title: 'Submission Updated',
      description: `The album comment for "${albumTitle}" has been updated.`,
      color: 'success',
    })
    handleCancel()
    router.refresh()
  }

  const handleCancel = () => {
    setErrorText('')
    setCommentText(props.currentComment ?? '')
    setProcessing(false)
    onClose()
  }

  return (
    <>
      <Tooltip content="Edit Album Comment">
        <span>
          <Button
            className="p-1 mx-auto my-2 bg-gradient-to-br from-amber-600/80 to-amber-700/80 hover:underline text-black"
            size="sm"
            onPress={onOpen}
            radius="lg"
            variant="solid"
            isDisabled={isButtonDisabled}
          >
            <RiEditLine className="text-2xl" />
          </Button>
        </span>
      </Tooltip>
      <Modal
        size="lg"
        scrollBehavior="inside"
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        backdrop="blur"
        onClose={handleCancel}
      >
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex flex-col flex-wrap w-full gap-1 content-center text-center">
                <p>{`Edit album comment for "${albumTitle}"`}</p>
              </ModalHeader>
              <ModalBody>
                <Conditional showWhen={errorText !== ''}>
                  <div className="bg-red-500/10 p-2 rounded-xl w-full border-2 border-red-950">
                    <RiErrorWarningFill className="text-2xl mx-auto text-yellow-500" />
                    <p className="text-center">{errorText}</p>
                    <RiErrorWarningFill className="text-2xl mx-auto text-yellow-500" />
                  </div>
                </Conditional>
                <p className="text-sm text-gray-400">
                  Editing this message will be tracked in the submission history.
                </p>
                <Textarea
                  label="Album Comment"
                  value={commentText}
                  onValueChange={setCommentText}
                  minRows={4}
                  maxRows={12}
                  className="w-full"
                />
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
                    className="mr-2 mt-auto bg-amber-600"
                    isDisabled={processing || !commentText.trim()}
                    onPress={handleSave}
                  >
                    <Conditional showWhen={!processing}>
                      SAVE CHANGES
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
