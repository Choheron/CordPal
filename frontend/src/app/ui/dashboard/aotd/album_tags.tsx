"use client"

import { createGlobalTag, deleteGlobalTag, deleteTag, getGlobalTags, getTagsForAlbum, getTagSuggestions, removeVoteFromTag, submitTag, voteOnTag } from "@/app/lib/aotd_utils"
import { AlbumTag, GlobalTag, TagSuggestion } from "@/app/lib/types"
import { useEffect, useState } from "react"

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter
} from "@heroui/modal";
import { Button, Input, Tooltip } from "@heroui/react";
import { RiAddLine, RiArrowDownFill, RiArrowDownLine, RiArrowUpFill, RiArrowUpLine, RiCloseLine, RiPriceTagFill } from "react-icons/ri";
import EmojiMartButton from "@/app/ui/general/input/emoji_mart_popover";

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

  // Submit form state
  const [tagText, setTagText] = useState("")
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Suggestions state
  const [suggestions, setSuggestions] = useState<TagSuggestion[]>([])

  // Global tag management state (admin only)
  const [globalTags, setGlobalTags] = useState<GlobalTag[]>([])
  const [newGlobalTagText, setNewGlobalTagText] = useState("")
  const [newGlobalTagEmoji, setNewGlobalTagEmoji] = useState<string | null>(null)
  const [createGlobalTagError, setCreateGlobalTagError] = useState<string | null>(null)
  const [createGlobalTagFeedback, setCreateGlobalTagFeedback] = useState<string | null>(null)
  const [isCreatingGlobalTag, setIsCreatingGlobalTag] = useState(false)

  function renderEmoji(emoji: string, size: "sm" | "lg" = "sm") {
    const px = size === "lg" ? "w-6 h-6" : "w-4 h-4"
    if (emoji.startsWith("http")) {
      return <img src={emoji} className={`${px} object-contain inline-block`} alt="emoji" />
    }
    return <span className={size === "lg" ? "text-xl leading-none" : "text-base leading-none"}>{emoji}</span>
  }

  // Child function for a single tag display
  function AlbumTagChip(tag: AlbumTag) {
    const canDelete = !props.readOnly && (
      props.isAdmin ||
      (props.currentUserId != null && tag.submitted_by_id === props.currentUserId && !tag.is_approved)
    )
    return (
      <Tooltip content={`Submitted by: ${tag.submitted_by}`}>
        <div
          key={tag.id}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm border ${tag.is_approved ? "bg-blue-500/10 border-blue-500/40 text-blue-100" : "bg-white/5 border-white/15 text-white/60"}`}
        >
          {tag.emoji && renderEmoji(tag.emoji)}
          <span>{tag.tag_text}</span>
          <span className={`text-xs font-medium ${tag.is_approved ? "text-blue-300" : "text-white/40"}`}>
            {tag.net_score > 0 ? `+${tag.net_score}` : tag.net_score}
          </span>
          {!props.readOnly && props.isEnrolled && (
            <div className="flex text-sm gap-0.5 ml-0.5">
              <button
                className={`p-1 rounded cursor-pointer border transition-colors ${tag.user_vote === 1 ? "border-orange-500 bg-orange-500/20 text-orange-400" : "border-white/15 hover:border-white/40 hover:bg-white/10 text-white/50"}`}
                onClick={() => tag.user_vote === 1 ? handleRemoveVote(tag.id) : handleVote(tag.id, 1)}
                aria-label="Upvote"
              >
                {tag.user_vote === 1 ? <RiArrowUpFill /> : <RiArrowUpLine />}
              </button>
              <button
                className={`p-1 rounded cursor-pointer border transition-colors ${tag.user_vote === -1 ? "border-orange-500 bg-orange-500/20 text-orange-400" : "border-white/15 hover:border-white/40 hover:bg-white/10 text-white/50"}`}
                onClick={() => tag.user_vote === -1 ? handleRemoveVote(tag.id) : handleVote(tag.id, -1)}
                aria-label="Downvote"
              >
                {tag.user_vote === -1 ? <RiArrowDownFill /> : <RiArrowDownLine />}
              </button>
            </div>
          )}
          {canDelete && (
            <button
              className="p-0.5 rounded cursor-pointer border border-white/10 hover:border-red-400/50 hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors ml-0.5"
              onClick={() => handleDelete(tag.id)}
              aria-label="Delete tag"
            >
              <RiCloseLine className="text-xs" />
            </button>
          )}
        </div>
      </Tooltip>
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

  function handleModalClose(open: boolean) {
    setShowSubmitModal(open)
    if (!open) {
      setTagText("")
      setSelectedEmoji(null)
      setSubmitError(null)
      setNewGlobalTagText("")
      setNewGlobalTagEmoji(null)
      setCreateGlobalTagError(null)
      setCreateGlobalTagFeedback(null)
    }
  }

  async function handleSubmit() {
    if (!tagText.trim()) {
      setSubmitError("Tag text is required.")
      return
    }
    setIsSubmitting(true)
    setSubmitError(null)
    const result = await submitTag(props.mbid, tagText.trim(), undefined, selectedEmoji)
    setIsSubmitting(false)
    if (result.success) {
      handleTagAdded(result.tag)
      setTagText("")
      setSelectedEmoji(null)
    } else {
      setSubmitError(result.error ?? "Failed to submit tag.")
    }
  }

  async function handleQuickAdd(text: string, emoji: string | null) {
    const result = await submitTag(props.mbid, text, undefined, emoji)
    if (result.success) {
      handleTagAdded(result.tag)
    } else {
      setSubmitError(result.error ?? "Failed to submit tag.")
    }
  }

  async function handleCreateGlobalTag() {
    if (!newGlobalTagText.trim()) {
      setCreateGlobalTagError("Tag text is required.")
      return
    }
    setIsCreatingGlobalTag(true)
    setCreateGlobalTagError(null)
    setCreateGlobalTagFeedback(null)
    const result = await createGlobalTag(newGlobalTagText.trim(), newGlobalTagEmoji)
    setIsCreatingGlobalTag(false)
    if (result.success) {
      if (result.created) {
        setGlobalTags(prev => [...prev, { id: result.tag.id, text: result.tag.text, emoji: result.tag.emoji ?? null, created_at: new Date().toISOString() }].sort((a, b) => a.text.localeCompare(b.text)))
        setNewGlobalTagText("")
        setNewGlobalTagEmoji(null)
        getTagSuggestions().then(setSuggestions)
      } else {
        setCreateGlobalTagFeedback(`"${result.tag.text}" already exists as a global tag.`)
        setNewGlobalTagText("")
        setNewGlobalTagEmoji(null)
      }
    } else {
      setCreateGlobalTagError(result.error ?? "Failed to create global tag.")
    }
  }

  async function handleDeleteGlobalTag(tagId: number) {
    const result = await deleteGlobalTag(tagId)
    if (result.success) {
      setGlobalTags(prev => prev.filter(t => t.id !== tagId))
      getTagSuggestions().then(setSuggestions)
    }
  }

  // Load suggestions (and global tags for admins) when modal opens
  useEffect(() => {
    if (!showSubmitModal) return
    getTagSuggestions().then(setSuggestions)
    if (props.isAdmin) {
      getGlobalTags().then(setGlobalTags)
    }
  }, [showSubmitModal])

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
    <div className="relative">
      {/* Display approved tags */}
      <div className="flex flex-wrap gap-2 m-2">
        {tags.sort((a, b) => b.net_score - a.net_score).filter((a) => (!props.readOnly || a.is_approved)).map((tag) => AlbumTagChip(tag))}
      </div>
      {/* Tagging Button */}
      {!props.readOnly && props.isEnrolled && (
        <Tooltip content="Add New Tag" placement="left">
          <Button
            onPress={() => setShowSubmitModal(true)}
            className="absolute -top-2 -right-2 p-2 w-fit h-fit min-w-0 min-h-0 bg-gradient-to-br from-green-700/80 to-green-800/80 text-white overflow-visible hover:scale-105"
            radius="full"
          >
            <span className="relative">
              <RiPriceTagFill className="text-base"/>
              <RiAddLine className="absolute -top-2 -left-2 text-xs font-bold drop-shadow bg-gradient-to-br from-green-700/80 to-green-800/80 rounded-full"/>
            </span>
          </Button>
        </Tooltip>
      )}
      {/* Tagging Modal */}
      <Modal
        isOpen={showSubmitModal}
        onOpenChange={handleModalClose}
        classNames={{
          wrapper: "items-end sm:items-center",
          base: "w-full h-dvh m-0 rounded-none sm:max-w-5xl sm:h-auto sm:max-h-[80vh] sm:rounded-large sm:my-10 sm:mx-6"
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Add a Tag</ModalHeader>
              <ModalBody className="gap-4">
                <p className="text-sm text-gray-400 mb-2">Commonly used tags {`(set by admins or tagged on 3 or more albums)`}</p>
                {/* Quick-add suggestions */}
                {suggestions.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Quick add a suggestion</p>
                    <div className="flex flex-wrap gap-2">
                      {suggestions.map((s) => {
                        const alreadyAdded = tags.some(t => t.tag_text.toLowerCase() === s.text.toLowerCase())
                        return (
                          <button
                            key={s.text}
                            disabled={alreadyAdded}
                            onClick={() => handleQuickAdd(s.text, s.emoji)}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm border transition-colors ${alreadyAdded ? "border-white/10 text-white/25 cursor-not-allowed" : "border-white/20 hover:border-blue-400 hover:bg-blue-500/10 hover:text-blue-200 cursor-pointer"}`}
                          >
                            {s.emoji && renderEmoji(s.emoji)}
                            {s.text}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
                {/* Custom tag input */}
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-gray-400">Or write a custom tag</p>
                  <Input
                    label="Tag"
                    placeholder="e.g. Shoegaze, Energetic, Must Listen..."
                    value={tagText}
                    onValueChange={setTagText}
                    maxLength={50}
                    startContent={selectedEmoji ? renderEmoji(selectedEmoji, "lg") : undefined}
                    description={`${tagText.length}/50`}
                    isInvalid={!!submitError}
                    errorMessage={submitError ?? undefined}
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">Emoji:</span>
                    {selectedEmoji ? (
                      <button
                        onClick={() => setSelectedEmoji(null)}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-full text-sm border border-white/20 hover:border-red-400/50 hover:bg-red-500/10 transition-colors"
                      >
                        {renderEmoji(selectedEmoji, "lg")}
                        <span className="text-white/40 text-xs">✕</span>
                      </button>
                    ) : (
                      <span className="text-sm text-white/30">None</span>
                    )}
                    <EmojiMartButton
                      selectionCallback={(emoji: { native?: string; src?: string }) => setSelectedEmoji(emoji.native ?? emoji.src ?? null)}
                    />
                  </div>
                </div>
                {/* Admin section */}
                {props.isAdmin && (
                  <>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex-1 h-px bg-white/10" />
                      <span className="text-xs font-semibold text-amber-400/80 uppercase tracking-wider">Admin</span>
                      <div className="flex-1 h-px bg-white/10" />
                    </div>
                    {/* Create Global Tag */}
                    <div className="flex flex-col gap-2">
                      <p className="text-sm text-amber-400/70">Create a global tag (shows as suggestion on all albums)</p>
                      <div className="flex gap-2 items-start">
                        <Input
                          label="Global Tag"
                          placeholder="e.g. Post-Rock, Melancholic..."
                          value={newGlobalTagText}
                          onValueChange={(v) => { setNewGlobalTagText(v); setCreateGlobalTagError(null); setCreateGlobalTagFeedback(null) }}
                          maxLength={50}
                          isInvalid={!!createGlobalTagError}
                          errorMessage={createGlobalTagError ?? undefined}
                          startContent={newGlobalTagEmoji ? renderEmoji(newGlobalTagEmoji, "lg") : undefined}
                          className="flex-1"
                        />
                        <Button
                          color="warning"
                          variant="flat"
                          onPress={handleCreateGlobalTag}
                          isLoading={isCreatingGlobalTag}
                          isDisabled={!newGlobalTagText.trim()}
                          className="mt-1 shrink-0"
                        >
                          Create
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-amber-400/60">Emoji:</span>
                        {newGlobalTagEmoji ? (
                          <button
                            onClick={() => setNewGlobalTagEmoji(null)}
                            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-sm border border-amber-400/20 hover:border-red-400/50 hover:bg-red-500/10 transition-colors"
                          >
                            {renderEmoji(newGlobalTagEmoji, "lg")}
                            <span className="text-white/40 text-xs">✕</span>
                          </button>
                        ) : (
                          <span className="text-sm text-white/30">None</span>
                        )}
                        <EmojiMartButton
                          selectionCallback={(emoji: { native?: string; src?: string }) => setNewGlobalTagEmoji(emoji.native ?? emoji.src ?? null)}
                        />
                      </div>
                      {createGlobalTagFeedback && (
                        <p className="text-xs text-amber-400/80">{createGlobalTagFeedback}</p>
                      )}
                    </div>
                    {/* Manage Global Tags */}
                    <div className="flex flex-col gap-2">
                      <p className="text-sm text-amber-400/70">Existing global tags</p>
                      {globalTags.length === 0
                        ? <p className="text-xs text-white/30 italic">No global tags yet.</p>
                        : (
                          <div className="flex flex-col gap-1 max-h-40 overflow-y-auto pr-1">
                            {globalTags.map((gt) => (
                              <div key={gt.id} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm">
                                <span className="flex items-center gap-2 text-white/80">
                                  {gt.emoji && renderEmoji(gt.emoji)}
                                  {gt.text}
                                </span>
                                <button
                                  className="p-1 rounded border border-white/10 hover:border-red-400/50 hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors"
                                  onClick={() => handleDeleteGlobalTag(gt.id)}
                                  aria-label={`Delete global tag "${gt.text}"`}
                                >
                                  <RiCloseLine className="text-sm" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )
                      }
                    </div>
                  </>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button color="primary" onPress={handleSubmit} isLoading={isSubmitting} isDisabled={!tagText.trim()}>
                  Submit
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  )
}
