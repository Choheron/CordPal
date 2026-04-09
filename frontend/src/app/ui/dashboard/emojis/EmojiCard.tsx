'use client'

import { Button } from "@heroui/react";
import { Switch } from "@heroui/switch";
import { addToast } from "@heroui/react";

import React from "react";
import { useRouter } from 'next/navigation';
import { deleteEmoji, updateEmojiMeta } from "@/app/lib/emoji_utils";


// Displays a single custom emoji.
// Non-admins see image, name, and use count.
// Admins additionally see submission metadata and management controls.
export default function EmojiCard({ emoji, isAdmin }: { emoji: any; isAdmin: boolean }) {
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [isUpdating, setIsUpdating]       = React.useState(false);
  const router = useRouter();

  // Resolve the image URL — admin list provides serve_url directly;
  // the public list provides it nested in skins[0].src (emoji-mart format)
  const imageUrl = emoji.serve_url ?? emoji.skins?.[0]?.src;
  const displayName = emoji.display_name || emoji.name;

  // Toggle is_active and reload the section
  const handleToggleActive = async (value: boolean) => {
    setIsUpdating(true);
    await updateEmojiMeta(emoji.emoji_id, { is_active: value });
    router.refresh();
    setIsUpdating(false);
  };

  // Toggle hide_submitted_at and reload the section
  const handleToggleHideDate = async (value: boolean) => {
    setIsUpdating(true);
    await updateEmojiMeta(emoji.emoji_id, { hide_submitted_at: value });
    router.refresh();
    setIsUpdating(false);
  };

  // Two-step delete — first press arms confirmation, second press executes
  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    const res = await deleteEmoji(emoji.emoji_id);
    if (res && res.status === 200) {
      addToast({ title: `Deleted "${emoji.name}"`, color: "success" });
    } else {
      addToast({
        title: "Delete failed",
        description: `Please contact server administrators with CRID: ${res ? res.crid : "N/A"}.`,
        color: "danger",
      });
    }
    router.refresh();
  };

  return (
    <div
      className={`flex flex-col items-center gap-1 p-2 rounded-lg border bg-zinc-900/50 ${
        isAdmin && emoji.is_active === false
          ? 'border-zinc-600 opacity-50'
          : 'border-neutral-700'
      } ${'min-w-[140px] max-w-[160px]'}`}
    >
      {/* Emoji image */}
      <img
        src={imageUrl}
        alt={displayName}
        className="w-10 h-10 object-contain"
      />
      {/* Display name */}
      <p className="text-xs text-center text-gray-300 font-mono leading-tight break-all">
        {displayName}
      </p>
      {/* Submission Data */}
      <p className="font-mono text-ellipsis" title={emoji.submitted_by}>
        By: {emoji.submitted_by}
      </p>
      <p className="font-mono text-[10px] truncate">{(emoji.submitted_at != "ERR DATE") ? emoji.submitted_at.split(",")[0] : 'LEGACY'}</p>
      {/* Use count chip — present on admin list; may be absent on public list */}
      {emoji.use_count !== undefined && (
        <span className="text-xs bg-zinc-700 rounded-full px-2 text-gray-400">
          {emoji.use_count} uses
        </span>
      )}

      {/* Admin-only metadata and controls */}
      {isAdmin && (
        <div className="flex flex-col gap-1 mt-1 w-fit text-xs text-gray-500 border-t border-neutral-700 pt-1">
          <Switch
            size="sm"
            isSelected={emoji.is_active}
            onValueChange={handleToggleActive}
            isDisabled={isUpdating}
          >
            Active
          </Switch>
          <Switch
            size="sm"
            isSelected={emoji.hide_submitted_at}
            onValueChange={handleToggleHideDate}
            isDisabled={isUpdating}
          >
            Hide Date
          </Switch>
          {/* Two-step delete confirmation */}
          {confirmDelete ? (
            <div className="flex gap-1 mt-1">
              <Button
                size="sm"
                color="danger"
                onPress={handleDelete}
                className="text-xs h-6 min-h-0 flex-1"
              >
                Confirm
              </Button>
              <Button
                size="sm"
                variant="flat"
                onPress={() => setConfirmDelete(false)}
                className="text-xs h-6 min-h-0 flex-1"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              color="danger"
              variant="light"
              onPress={handleDelete}
              className="text-xs h-6 min-h-0 mt-1 w-full"
            >
              Delete
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
