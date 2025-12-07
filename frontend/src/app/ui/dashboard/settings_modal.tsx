import {
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
  useDisclosure
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Badge } from "@heroui/badge";
import { Input } from "@heroui/input";

import React, { useEffect } from "react";
import { useRouter } from 'next/navigation';

import { isUserFieldUnique, updateUserData } from "@/app/lib/user_utils";
import { boolToString } from "@/app/lib/utils";
import EditPasswordModal from "./edit_password_modal";
import { Conditional } from "./conditional";


// Expected props:
//  - userInfo: JSON Containing user information
//  - avatarURL: String URL of Discord User's Avatar
//  - linkedAccounts: List containing connected account data 
//  - userLoginMethods: List - List of Strings corresponding to login methods
//  - isOpenOverride: Boolean - Override button and determine open state by passed in value
//  - setIsOpenOverride: function - Override the open function. REQUIRED IF isOpenOverride is provided
export default function SettingsModal(props) {
  // Static values
  const userInfo = props.userInfo // UserInfo Object Keys: {guid, username, last_updated_timestamp, creation_timestamp, email, nickname, discord_id, discord_discriminator, discord_is_verified, discord_avatar, spotify_connected, is_active, is_staff, avatar_url}
  const loginMethods = props.userLoginMethods
  // Dynamic values
  const [emailValue, setEmailValue] = React.useState(props.userInfo['email']);
  const [nicknameValue, setNicknameValue] = React.useState(props.userInfo['nickname']);
  const [nicknameUnique, setNicknameUnique] = React.useState(true)
  const [oldPassValue, setOldPassValue] = React.useState("")
  const [newPassValue, setNewPassValue] = React.useState("")
  const [canUpdate, setCanUpdate] = React.useState(false)
  // Modal Values
  const {isOpen, onOpen, onOpenChange, onClose} = useDisclosure();
  const router = useRouter();

  // useEffect to check if nickname is unique
  useEffect(() => {
    const checkUnique = async () => {
      const checkResponse = await isUserFieldUnique("nickname", nicknameValue)
      setNicknameUnique(checkResponse['json']['unique'])
    }
    if(nicknameValue != props.userInfo['nickname']) {
      checkUnique()
    } else {
      setNicknameUnique(true)
    }
  }, [nicknameValue])

  // useEffect to check if the user can update their data
  useEffect(() => {
    const emailChange = (emailValue != userInfo['email'])
    const nicknameChange = (nicknameValue != userInfo['nickname'])
    const nonEmpty = ((nicknameValue != "") && (emailValue != ""))
    setCanUpdate((emailChange || nicknameChange) && nicknameUnique && nonEmpty)
  }, [nicknameValue, emailValue])

  // Display static user information
  function userInfoBlock() {
    return(
      <div className="text-sm mx-auto -mt-2 w-4/5">
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
        <div className="flex justify-between w-full">
          <p>Available Login Methods:</p>
          <p className="text-right">{loginMethods.join(", ")}</p>
        </div>
      </div>
    )
  }

  function linkedAccountsBlock() {
    return props.linkedAccounts.map((integrationObject, index) => {
      return (
        <div key={index} className="flex w-fit mr-auto">
          <img 
            src={integrationObject['branding_avatar_path']}
            width={50}
            height={50}
            className="mr-2"
          />
          <div className="flex flex-col">
            <p className="font-normal">{integrationObject['branding_name']}</p>
            <p className="text-xs">
              {(Object.keys(integrationObject['data']).length == 0) ? "Not Connected" : ("Connected to Account: " + integrationObject['data']['display_name'])}
            </p>
          </div>
        </div>
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
          isInvalid={(!nicknameUnique) || (nicknameValue=="")}
          errorMessage="Nickname must be unique and cannot be empty."
          description="This is the name that will appear for you on the website. If you opt to set a password, you will use this nickname as your login username. This must be unique for all users."
          onValueChange={setNicknameValue}
          classNames={{
            description: "text-white"
          }}
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
    if(props.isOpenOverride != null) {
      props.setIsOpenOverride(false)
    }
    onClose()
  }

  // Reset values on cancel button press
  const cancelPress = () => {
    if(props.isOpenOverride != null) {
      props.setIsOpenOverride(false)
    }
    setEmailValue(props.userInfo['email'])
    setNicknameValue(props.userInfo['nickname'])
    onClose()
    // Reload page
    router.refresh()
  }

  return (
    <>
      <Conditional showWhen={props.isOpenOverride == null}>
        <Badge 
          color="primary" 
          content=""
          size="sm"
          placement="top-left"
          className="-ml-1 animate-pulse"
          isInvisible={loginMethods.indexOf("Username/Password") != -1}
        >
          <Button 
            className="px-0 text-tiny text-inheret min-w-0 min-h-0 h-fit hover:underline"
            size="sm"
            onPress={onOpen}
            radius="none"
            variant="light"
          >
            Settings
          </Button>
        </Badge>
      </Conditional>
      <Modal 
        size="xl" 
        isOpen={(props.isOpenOverride != null) ? props.isOpenOverride : isOpen} 
        onOpenChange={onOpenChange} 
        isDismissable={false} 
        isKeyboardDismissDisabled={true} 
        onClose={cancelPress}
      >
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex flex-col flex-wrap w-full gap-1 content-center">
                <a href={`/profile/${userInfo['discord_id']}`}>
                  <img src={props.avatarURL} className="rounded-lg w-20 mx-auto" />
                  {props.userInfo['nickname'] + "'s Settings"}
                </a>
              </ModalHeader>
              <ModalBody className="font-extralight">
                <div className="w-full font-extralight mx-auto px-2 py-2 my-2 text-sm text-center italic border border-neutral-800 rounded-2xl bg-black/50">
                  <p>
                    This page allows you to view and update the data stored in the database and shown on the webpages. Click on your profile picture above to go to your profile!
                  </p>
                </div>
                <p className="font-normal">User Information:</p>
                <div>
                  {userInfoBlock()}
                </div>
                <p className="font-normal">Linked Accounts:</p>
                <div className="flex flex-col gap-2">
                  {linkedAccountsBlock()}
                </div>
                <p className="font-normal">Update User Settings:</p>
                {inputsGUI()}
              </ModalBody>
              <ModalFooter className="flex justify-between">
                <EditPasswordModal 
                  userInfo={userInfo}
                  update={loginMethods.indexOf("Username/Password") != -1}
                />
                <div>
                  <Button color="danger" variant="light" onPress={cancelPress}>
                    Close
                  </Button>
                  <Button 
                    color="primary" 
                    onPress={updatePress}
                    isDisabled={!canUpdate}
                  >
                    Update
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