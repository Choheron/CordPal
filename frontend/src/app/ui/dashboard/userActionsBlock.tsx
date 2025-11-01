import { getRecentUserActions } from "@/app/lib/user_utils"
import UserAvatar from "../general/userUiItems/user_avatar"
import UserCard from "../general/userUiItems/user_card"
import ClientTimestamp from "../general/client_timestamp"

// Display the last 10 user actions made on the site
export default async function UserActionsBlock(props) {
  // Get user actions from backend
  const userActions = await getRecentUserActions()

  // Generate an action card for a single user action
  const generateActionCard = (action) => {
    return (
      <div className="flex items-center w-full bg-zinc-800/30 rounded-xl p-1 text-center">
        <div className="w-1/5 pt-1 -mb-1">
          <UserCard 
            userDiscordID={action['user']['discord_id']}
            avatarClassNameOverride={"flex-shrink-0 size-[20px] sm:size-[40px]"}
            fallbackName={"User Not Found"}
          />
        </div>
        <div className="w-1/5">
          <p>{action['action_type']}</p>
        </div>
        <div className="w-1/5">
          <p>{action['entity_type']}</p>
        </div>
        <div className="w-fit">
          <ClientTimestamp
            timestamp={action['timestamp']}
            full={true}
          />
        </div>
      </div>
    )
  }


  // FINAL Return Statement
  return (
    <div className="flex flex-col w-full gap-1 overflow-y-auto max-h-[400px] rounded-xl">
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