import { getRecentUserActions, getUserData } from "@/app/lib/user_utils"
import UserCard from "../general/userUiItems/user_card"
import ClientTimestamp from "../general/client_timestamp"
import { RiAddLine, RiEditLine, RiDeleteBin2Line } from "react-icons/ri"
import { Conditional } from "./conditional"

// Scrollable feed of the last 20 user actions taken on the site
// Expected Props: none
export default async function UserActionsBlock(props) {
  const userActions = await getRecentUserActions()

  // Resolve previous owner nicknames for album rescue actions before rendering
  await Promise.all(
    userActions['actions']
      .filter(a => a.entity_type === 'ALBUM_OWNER' && a.details?.previous_owner_id)
      .map(async (a) => {
        const data = await getUserData(a.details.previous_owner_id)
        a.details.previous_owner_nick = data?.nickname ?? a.details.previous_owner_id
      })
  )

  // Return color/icon styles based on action type, with ALBUM_OWNER overriding to amber
  const getActionStyles = (action: string) => {
    switch(action) {
      case "CREATE":
        return {
          border: "border-l-emerald-500",
          glow: "[box-shadow:inset_5px_0_10px_-3px_rgba(16,185,129,0.2)]",
          iconBg: "bg-emerald-500/15 text-emerald-400",
          icon: <RiAddLine />
        };
      case "UPDATE":
        return {
          border: "border-l-sky-500",
          glow: "[box-shadow:inset_5px_0_10px_-3px_rgba(14,165,233,0.2)]",
          iconBg: "bg-sky-500/15 text-sky-400",
          icon: <RiEditLine />
        };
      case "DELETE":
        return {
          border: "border-l-rose-500",
          glow: "[box-shadow:inset_5px_0_10px_-3px_rgba(244,63,94,0.2)]",
          iconBg: "bg-rose-500/15 text-rose-400",
          icon: <RiDeleteBin2Line />
        };
      default:
        return {
          border: "border-l-zinc-500",
          glow: "",
          iconBg: "bg-zinc-500/15 text-zinc-400",
          icon: null
        };
    }
  }

  // Return a human-readable detail string for an action, or null if none applies
  const getActionDetail = (action) => {
    const { entity_type, action_type, details } = action
    if (entity_type === "CUSTOM_EMOJI" && action_type === "CREATE" && details) {
      return details.display_name || details.name || null
    }
    if (entity_type === "ALBUM_OWNER" && details?.previous_owner_nick) {
      return `Rescued from ${details.previous_owner_nick}`
    }
    if (entity_type === "ALBUM" && details) {
      if (action_type === "DELETE") {
        const parts = [details.deleted_album, details.reason].filter(Boolean)
        return parts.length ? parts.join(" - ") : null
      }
      if (action_type === "CREATE") {
        const parts = [details.title, details.artist].filter(Boolean)
        return parts.length ? parts.join(" - ") : null
      }
    }
    return null
  }

  // Render a single action row with icon, user card, entity label, detail, and timestamp
  const generateActionCard = (action) => {
    const styles = getActionStyles(action['action_type'])
    const detail = getActionDetail(action)
    const isAdminAlbumDelete = (() => {
      if (action['entity_type'] !== "ALBUM" || action['action_type'] !== "DELETE" || !action['details']) return false
      const raw = action['details']['album_raw_data']
      const deleter = action['user']['discord_id']
      return deleter !== raw['submitter_id'] && deleter !== raw['owner_id']
    })()
    return (
      <div className={`relative flex items-center w-full border-l-[3px] ${styles.border} ${styles.glow} bg-zinc-800/40 hover:bg-zinc-700/40 transition-colors rounded-r-lg pl-2.5 pr-4 py-2 gap-3 cursor-default overflow-hidden`}>
        <Conditional showWhen={isAdminAlbumDelete}>
          <p className="z-10 absolute top-3 -left-10 text-[10px] bg-red-600 font-bold -rotate-45 px-10">
            ADMIN
          </p>
        </Conditional>
        <div className={`flex-shrink-0 w-[22px] h-[22px] rounded-full flex items-center justify-center text-sm ${styles.iconBg}`}>
          {styles.icon}
        </div>
        <div className="w-[30%] min-w-0">
          <UserCard
            userDiscordID={action['user']['discord_id']}
            avatarClassNameOverride={"flex-shrink-0 size-[28px] sm:size-[34px]"}
            fallbackName={"User Not Found"}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-mono text-xs text-zinc-400 truncate">{action['entity_type'] === "ALBUM_OWNER" ? "ALBUM_RESCUE" : action['entity_type']}</p>
          {action['entity_type'] === "REVIEW"
            ? <a href={`/dashboard/aotd/review/${action['entity_id']}`} className="font-mono text-xs text-sky-700 hover:underline truncate block">See Review</a>
            : detail && <p className="font-mono text-xs text-zinc-600 truncate" title={detail}>{detail}</p>
          }
        </div>
        <div className="flex-shrink-0">
          <ClientTimestamp
            timestamp={action['timestamp']}
            full={true}
            className="font-mono text-xs text-zinc-500 tabular-nums"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col w-full gap-1.5 overflow-y-auto max-h-[350px]">
      {userActions['actions'].map((action, index) => (
        <div key={index}>
          {generateActionCard(action)}
        </div>
      ))}
    </div>
  )
}
