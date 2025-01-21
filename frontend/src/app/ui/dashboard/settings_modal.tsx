import {
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
  useDisclosure
} from "@nextui-org/modal";
import {User} from "@nextui-org/user";
import { Button } from "@nextui-org/react";
import {Input} from "@nextui-org/react";
import React from "react";
import { useRouter } from 'next/navigation';

import { updateUserData } from "@/app/lib/user_utils";
import ClientTimestamp from "../general/client_timestamp";
import { boolToString } from "@/app/lib/utils";


// Expected props:
//  - userInfo: JSON Containing user information
//  - avatarURL: String URL of Discord User's Avatar
//  - linkedAccounts: List containing connected account data 
export default function SettingsModal(props) {
  // Static values
  const userInfo = props.userInfo // UserInfo Object Keys: {guid, username, last_updated_timestamp, creation_timestamp, email, nickname, discord_id, discord_discriminator, discord_is_verified, discord_avatar, spotify_connected, is_active, is_staff, avatar_url}
  // Dynamic values
  const [emailValue, setEmailValue] = React.useState(props.userInfo['email']);
  const [nicknameValue, setNicknameValue] = React.useState(props.userInfo['nickname']);
  // Modal Values
  const {isOpen, onOpen, onOpenChange, onClose} = useDisclosure();
  const router = useRouter();

  // Display static user information
  function userInfoBlock() {
    return(
      <div className="text-sm mx-auto -mt-2 w-2/3">
        <div className="flex justify-between w-full">
          <p>System GUID:</p>
          <p>{userInfo['guid']}</p>
        </div>
        <div className="flex justify-between w-full">
          <p>Discord ID:</p>
          <p>{userInfo['discord_id']}</p>
        </div>
        <div className="flex justify-between w-full">
          <p>Is Admin:</p>
          <p>{boolToString(userInfo['is_staff'])}</p>
        </div>
      </div>
    )
  }

  function linkedAccountsBlock() {
    return props.linkedAccounts.map((integrationObject) => {
      return (
        <User   
          name={integrationObject['branding_name']}
          key={integrationObject['branding_name']}
          description={(Object.keys(integrationObject['data']).length == 0) ? "Not Connected" : ("Connected to Account: " + integrationObject['data']['display_name'])}
          avatarProps={{
            src: integrationObject['branding_avatar_path'],
            isDisabled: (Object.keys(integrationObject['data']).length == 0)
          }}
        />
      )
    })
  }

  function inputsGUI() {
    return (
      <div className="flex flex-col justify-evenly">
        <Input
          isRequired
          className="mt-2"
          label="Nickname"
          placeholder="Enter your nickname"
          value={nicknameValue}
          description="This is the name that will appear for you on the website."
          onValueChange={setNicknameValue}
        />
        <Input
          isRequired
          className="mt-2"
          label="Email"
          placeholder="Enter your email"
          value={emailValue}
          onValueChange={setEmailValue}
        />
      </div>
    )
  }

  // Send request to update user data based on UI inputs
  const updatePress = () => {
    // Build update json to only include updated fields
    let updateJson = {}
    if(emailValue != props.userInfo['email']) {
      updateJson['email'] = emailValue
    }
    if(nicknameValue != props.userInfo['nickname']) {
      updateJson['nickname'] = nicknameValue
    }
    // Verify updateJson has been updated
    if(!(Object.keys(updateJson).length === 0)) {
      updateUserData(updateJson)
      // Reload page
      router.refresh()
    }
    onClose()
  }

  // Reset values on cancel button press
  const cancelPress = () => {
    setEmailValue(props.userInfo['email'])
    setNicknameValue(props.userInfo['nickname'])
    onClose()
    // Reload page
    router.refresh()
  }

  return (
    <>
      <Button 
        className="px-0 text-tiny text-inheret min-w-0 min-h-0 h-fit hover:underline"
        size="sm"
        onPress={onOpen}
        radius="none"
        variant="light"
      >
        Settings
      </Button>
      <Modal size="xl" isOpen={isOpen} onOpenChange={onOpenChange} isDismissable={false} isKeyboardDismissDisabled={true} onClose={cancelPress}>
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex flex-col flex-wrap w-full gap-1 content-center">
                <img src={props.avatarURL} className="rounded-lg w-20 mx-auto" />
                {props.userInfo['nickname'] + "'s Settings"}
              </ModalHeader>
              <ModalBody>
                <p> 
                  This page allows you to view and update the data stored in the database and shown on the webpages.
                </p>
                <p>User Information:</p>
                <div>
                  {userInfoBlock()}
                </div>
                <p>Linked Accounts:</p>
                <div>
                  {linkedAccountsBlock()}
                </div>
                <p>The below fields can be changed:</p>
                {inputsGUI()}
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={cancelPress}>
                  Close
                </Button>
                <Button color="primary" onPress={updatePress}>
                  Update
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  )
}