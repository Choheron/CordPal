import { isUserAdmin } from "@/app/lib/user_utils";
import { getAdminEmojiList, getCustomEmojiList } from "@/app/lib/emoji_utils";
import EmojiCard from "./EmojiCard";
import EmojiSubmitModal from "./EmojiSubmitModal";


// Homepage section block displaying all custom emojis.
// Card styling matches the existing homepage cards (Album of the Day, Recent User Actions).
// Admins see full metadata and management controls on each card;
// members see a clean public grid.
export default async function EmojiSection() {
  const isAdmin = await isUserAdmin();
  // Admins get full metadata including inactive emojis; members get the active public list
  const emojis = isAdmin
    ? await getAdminEmojiList()
    : await getCustomEmojiList();

  return (
    <div className="relative flex flex-col h-fit w-full px-2 py-2 lg:p-4 items-start border-neutral-800 bg-zinc-800/30 from-inherit rounded-xl border">
      {/* Section header — matches the "Today's Album of the Day" title style */}
      <p className="absolute top-0 left-0 p-1 text-2xl font-extralight bg-gray-900 rounded-tl-xl rounded-br-xl">
        Custom Emojis
      </p>
      <div className="h-8">
        {/* Spacer for title */}
      </div>
      {/* Submit button — available to all members */}
      <div className="mx-auto">
        <EmojiSubmitModal />
      </div>
      {/* Emoji grid */}
      <div className="flex flex-wrap gap-3 mt-2 w-full justify-center">
        {(!emojis || emojis.length === 0) && (
          <p className="text-sm text-gray-500 italic">
            No custom emojis yet. Be the first to submit one!
          </p>
        )}
        {emojis && emojis.map((emoji: any) => (
          <EmojiCard key={emoji.emoji_id} emoji={emoji} isAdmin={isAdmin} />
        ))}
      </div>
    </div>
  );
}
