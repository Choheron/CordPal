import { getRecentUserActions } from "@/app/lib/user_utils"
import UserCard from "../general/userUiItems/user_card"
import ClientTimestamp from "../general/client_timestamp"

// Display the last 10 user actions made on the site
export default async function UserActionsBlock(props) {
  // Get user actions from backend
  const userActions = await getRecentUserActions()

  // Return accent styles corresponding to the action type
  const getActionStyles = (action: string) => {
    switch(action) {
      case "CREATE":
        return { border: "border-l-emerald-500", badge: "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30" };
      case "UPDATE":
        return { border: "border-l-sky-500", badge: "bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/30" };
      case "DELETE":
        return { border: "border-l-rose-500", badge: "bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/30" };
      default:
        return { border: "border-l-zinc-500", badge: "bg-zinc-500/15 text-zinc-400 ring-1 ring-zinc-500/30" };
    }
  }

  // Generate an action card for a single user action
  const generateActionCard = (action) => {
    const styles = getActionStyles(action['action_type'])
    return (
      <div className={`flex items-center w-full border-l-[3px] ${styles.border} bg-zinc-800/40 rounded-r-lg pl-3 pr-4 py-2 gap-3`}>
        <div className="w-[32%] min-w-0">
          <UserCard
            userDiscordID={action['user']['discord_id']}
            avatarClassNameOverride={"flex-shrink-0 size-[28px] sm:size-[34px]"}
            fallbackName={"User Not Found"}
          />
        </div>
        <div className="w-[18%] flex-shrink-0">
          <span className={`inline-flex items-center text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded ${styles.badge}`}>
            {action['action_type']}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-zinc-400 truncate">{action['entity_type']}</p>
        </div>
        <div className="flex-shrink-0">
          <ClientTimestamp
            timestamp={action['timestamp']}
            full={true}
            className="text-xs text-zinc-500 tabular-nums"
          />
        </div>
      </div>
    )
  }


  // FINAL Return Statement
  return (
    <div className="flex flex-col w-full gap-1.5 overflow-y-auto max-h-[400px]">
      { userActions['actions'].map((action, index) => {
        return (
          <div key={index}>
            { generateActionCard(action) }
          </div>
        )
      })}
    </div>
  )
}