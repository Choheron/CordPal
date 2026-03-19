"use client"

import { deleteTag, getTagsForAlbum, removeVoteFromTag, voteOnTag } from "@/app/lib/aotd_utils"
import { AlbumTag } from "@/app/lib/types"
import { useEffect, useState } from "react"

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter
} from "@heroui/modal";
import { Button, Chip } from "@heroui/react";
import { RiPriceTagFill } from "react-icons/ri";

type Props = {
  mbid: string
  initialTags: AlbumTag[]
  isEnrolled: boolean
  isAdmin: boolean
  currentUserId?: string | null   // compare against tag.submitted_by_id for delete button visibility
  readOnly?: boolean              // true → approved badges only, no controls (calendar page)
  pollIntervalMs?: number         // if set, poll getTagsForAlbum on this interval (AOTD page only)
}

export default function AlbumTagsDisplay(props: Props) {
  const [tags, setTags] = useState<AlbumTag[]>(props.initialTags)
  const [showSubmitModal, setShowSubmitModal] = useState(false)

  // Child function for a single tag display
  function AlbumTagChip(tag: AlbumTag) {
    return (
      <Chip>{tag.tag_text}</Chip>
    )
  }

  // Voting Handlers
  async function handleVote(tagId: number, voteType: 1 | -1) {
  const result = await voteOnTag(tagId, voteType)
  if (result.success) {
    setTags(prev => prev.map(t => t.id === tagId ? result.tag : t))
    }
  }

  async function handleRemoveVote(tagId: number) {
    const result = await removeVoteFromTag(tagId)
    if (result.success) {
      setTags(prev => prev.map(t => t.id === tagId ? result.tag : t))
    }
  }

  async function handleDelete(tagId: number) {
    const result = await deleteTag(tagId)
    if (result.success) {
      setTags(prev => prev.filter(t => t.id !== tagId))
    }
  }

  function handleTagAdded(newTag: AlbumTag) {
    setTags(prev => [...prev, newTag])
    setShowSubmitModal(false)
  }

  // Polling Interval
  useEffect(() => {
    if (!props.pollIntervalMs) return
    const id = setInterval(async () => {
      if (showSubmitModal) return
      const fresh = await getTagsForAlbum(props.mbid)
      if (fresh) setTags(fresh)
    }, props.pollIntervalMs)
    return () => clearInterval(id)
  }, [props.mbid, props.pollIntervalMs, showSubmitModal])

  return (
    <div className="relaitve">
      {/* Display approved tags */}
      <div className="flex">
        {tags.map((tag, index) => {
          return (AlbumTagChip(tag))
        })}
      </div>
      {/* Tagging Modal */}
      <Button 
        onPress={() => setShowSubmitModal(true)}
        className="text-2xl p-2 w-fit h-fit min-w-0 min-h-0 m-1 bg-gray-700 hover:bg-gray-500 overflow-visible"
        radius="full"
      >
        <RiPriceTagFill className="text-xl"/>
      </Button>
      <Modal
        isOpen={showSubmitModal}
        onOpenChange={setShowSubmitModal}
        size="full"
        classNames={{
          wrapper: "sm:items-center",
          base: "sm:max-w-5xl sm:h-auto sm:rounded-large sm:my-1 sm:mx-6"
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Modal Title</ModalHeader>
              <ModalBody>
                <p>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam pulvinar risus non
                  risus hendrerit venenatis. Pellentesque sit amet hendrerit risus, sed porttitor
                  quam.
                </p>
                <p>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam pulvinar risus non
                  risus hendrerit venenatis. Pellentesque sit amet hendrerit risus, sed porttitor
                  quam.
                </p>
                <p>
                  Magna exercitation reprehenderit magna aute tempor cupidatat consequat elit dolor
                  adipisicing. Mollit dolor eiusmod sunt ex incididunt cillum quis. Velit duis sit
                  officia eiusmod Lorem aliqua enim laboris do dolor eiusmod. Et mollit incididunt
                  nisi consectetur esse laborum eiusmod pariatur proident Lorem eiusmod et. Culpa
                  deserunt nostrud ad veniam.
                </p>
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
    </div>
  )
}