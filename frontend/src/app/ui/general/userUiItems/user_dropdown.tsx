'use client'

import { useEffect, useState } from "react";

import {Select, SelectItem, SelectedItems} from "@nextui-org/select";

import { getUserList } from "@/app/lib/user_utils";
import {User} from "@nextui-org/user";

// Dropdown menu displaying users for selection.
// Expected Props:
// - isMultipleChoice: Boolean determining if this is a multiple choice dropdown
// - label: label for select
// - placeholder: placeholder for select
// - setSelectionCallback: Function to callback for setting the selected data
// - useNicknameKeys: Boolean - Use user nickname as key instead of discord id
// - selectedKeys: Set - List of keys to be selected on default
// - idListOverride: List - OPTIONAL: List of Discord USER IDs to override from backend request 
// - description: String - Description to show below dropdown
export default function UserDropdown(props) {
  interface IUser {
    discord_id: string;
    nickname: string;
    avatar_url: string;
  }

  const [users, setUsers] = useState<IUser[]>([]); // State to store fetched users
  const [loading, setLoading] = useState(true); // State to handle loading

  useEffect(() => {
    // Fetch users when the component mounts
    async function fetchUsers() {
      const fetchedUsers: any = (props.idListOverride) ? props.idListOverride : await getUserList();
      setUsers(fetchedUsers);
      setLoading(false); // Set loading to false after fetching users
    }
    fetchUsers();
  }, []); // Empty dependency array to run this effect only on mount

  return (
    <Select
      label={props.label}
      placeholder={props.placeholder}
      isLoading={loading}
      selectionMode={props.isMultipleChoice ? 'multiple' : 'single'}
      selectedKeys={(props.selectedKeys) ? props.selectedKeys : null}
      classNames={{
        base: "w-fill",
      }}
      items={users}
      onSelectionChange={props.setSelectionCallback}
      description={(props.description) ? props.description : null}
    >
      {(user) => (
        <SelectItem key={(props.useNicknameKeys) ? (user as IUser).nickname : (user as IUser).discord_id} textValue={(user as IUser).nickname}>
          <User
            className="w-full"
            name={(user as IUser)['nickname']}
            avatarProps={{
              src: `${(user as IUser)['avatar_url']}`
            }}
          />
        </SelectItem>
      )}
    </Select>
  )
}