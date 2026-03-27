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
import { Tabs, Tab } from "@heroui/react";
import { Switch } from "@heroui/switch";

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
  const aotdConnected = (props.aotdConnected) ? props.aotdConnected : false
  // Login Settings Values
  const [emailValue, setEmailValue] = React.useState(props.userInfo['email']);
  const [nicknameValue, setNicknameValue] = React.useState(props.userInfo['nickname']);
  const [nicknameUnique, setNicknameUnique] = React.useState(true)
  // Album Of The Day Settings Values
  const [hideScoresPreReview, setHideScoresPreReview] = React.useState((props.aotdSettings != null) ? (props.aotdSettings['hide_scores_prereview']) : false)
  const [hideTagsPreReview, setHideTagsPreReview] = React.useState((props.aotdSettings != null) ? (props.aotdSettings['hide_tags_prereview']) : false)
  // Update Check
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
    const loginFieldsModified = emailChange || nicknameChange
    const loginFieldsValid = nicknameUnique && nonEmpty
    const loginChangedAndValid = loginFieldsModified && loginFieldsValid

    const aotdSettingsAvailable = props.aotdSettings != null
    const hideScoresChange = aotdSettingsAvailable && (hideScoresPreReview != props.aotdSettings['hide_scores_prereview'])
    const hideTagsChange = aotdSettingsAvailable && (hideTagsPreReview != props.aotdSettings['hide_tags_prereview'])
    const aotdChanged = hideScoresChange || hideTagsChange

    // Allow update if: any change exists, AND login fields are either untouched or validly modified
    const loginOk = !loginFieldsModified || loginFieldsValid
    setCanUpdate(loginOk && (loginChangedAndValid || aotdChanged))
  }, [nicknameValue, emailValue, nicknameUnique, hideScoresPreReview, hideTagsPreReview])

  function userInfoBlock() {
    const rows = [
      { label: "System GUID", value: userInfo['guid'], mono: true },
      { label: "Discord ID", value: userInfo['discord_id'], mono: true },
      { label: "Admin", value: boolToString(userInfo['is_staff']), mono: true },
      { label: "Login Methods", value: loginMethods.join(", "), mono: true },
    ]
    return (
      <div className="border border-neutral-800 rounded-2xl bg-black/50 divide-y divide-neutral-800/60">
        {rows.map(({ label, value, mono }) => (
          <div key={label} className="flex justify-between items-center px-4 py-2.5 text-sm">
            <span className="text-white/50">{label}</span>
            <span className={`text-white/90 text-right ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
          </div>
        ))}
      </div>
    )
  }

  function linkedAccountsBlock() {
    return (
      <div className="border border-neutral-800 rounded-2xl bg-black/50 divide-y divide-neutral-800/60">
        {props.linkedAccounts.map((integrationObject, index) => {
          const isConnected = Object.keys(integrationObject['data']).length > 0
          return (
            <div key={index} className="flex items-center gap-3 px-4 py-3">
              <img
                src={integrationObject['branding_avatar_path']}
                width={36}
                height={36}
                className="rounded-md shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-normal">{integrationObject['branding_name']}</p>
                <p className="text-xs text-white/50 truncate">
                  {isConnected ? integrationObject['data']['display_name'] : "Not connected"}
                </p>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full shrink-0 ${
                isConnected
                  ? 'bg-green-500/15 text-green-400'
                  : 'bg-neutral-800 text-white/40'
              }`}>
                {isConnected ? 'Connected' : 'Not connected'}
              </span>
            </div>
          )
        })}
      </div>
    )
  }

  function inputsGUI() {
    return (
      <div className="border border-neutral-800 rounded-2xl bg-black/50 px-4 pt-3 pb-4">
        <Tabs aria-label="Login/Username" className="w-full max-w-md">
          <Tab key="login" title="Login">
            <div className="flex flex-col gap-1">
              <Input
                isRequired
                label="Nickname"
                placeholder="Enter your nickname"
                value={nicknameValue}
                isInvalid={(!nicknameUnique) || (nicknameValue=="")}
                errorMessage="Nickname must be unique and cannot be empty."
                description="Shown on the website and used as your login username. Must be unique."
                onValueChange={setNicknameValue}
                classNames={{ description: "text-white/40" }}
              />
              <Input
                isRequired
                label="Email"
                placeholder="Enter your email"
                value={emailValue}
                onValueChange={setEmailValue}
                description="Will be used for password recovery in the future."
                classNames={{ description: "text-white/40" }}
              />
            </div>
          </Tab>
          <Tab key="aotd" title="Album Of The Day" disabled={!aotdConnected}>
            <div className="flex flex-col gap-1">
              <Switch isSelected={hideScoresPreReview} onValueChange={setHideScoresPreReview}>
                Hide Scores before Submitting Review
              </Switch>
              <p className="text-xs text-white/40">Hide AOTD score and user review scores before user has reviewed?</p>
            </div>
            <div className="flex flex-col gap-1 mt-1">
              <Switch isSelected={hideTagsPreReview} onValueChange={setHideTagsPreReview}>
                Hide Tags before Submitting Review
              </Switch>
              <p className="text-xs text-white/40">Hide AOTD Tags before user has reviewed?</p>
            </div>
          </Tab>
        </Tabs>
      </div>
    )
  }

  // Send request to update user data based on UI inputs
  const updatePress = () => {
    // Build update json to only include updated fields
    let updateJson = {}
    // Default settings updates
    updateJson['default'] = {}
    if(emailValue != props.userInfo['email']) {
      updateJson['default']['email'] = emailValue
    }
    if(nicknameValue != props.userInfo['nickname']) {
      updateJson['default']['nickname'] = nicknameValue
    }
    // Album of the Day settings updates
    updateJson['aotd'] = {}
    if(props.aotdSettings != null) {
      if(hideScoresPreReview != props.aotdSettings['hide_scores_prereview']) {
        updateJson['aotd']['hide_scores_prereview'] = hideScoresPreReview
      }
      if(hideTagsPreReview != props.aotdSettings['hide_tags_prereview']) {
        updateJson['aotd']['hide_tags_prereview'] = hideTagsPreReview
      }
    }
    // Verify at least one nested section has updates
    if(Object.keys(updateJson['default']).length > 0 || Object.keys(updateJson['aotd']).length > 0) {
      updateUserData(updateJson)
    }
    if(props.isOpenOverride != null) {
      props.setIsOpenOverride(false)
    }
    cancelPress()
  }

  // Reset values on cancel button press
  const cancelPress = () => {
    if(props.isOpenOverride != null) {
      props.setIsOpenOverride(false)
    }
    setEmailValue(props.userInfo['email'])
    setNicknameValue(props.userInfo['nickname'])
    // Update AOTD settings
    setHideScoresPreReview((props.aotdSettings != null) ? (props.aotdSettings['hide_scores_prereview']) : false)
    setHideTagsPreReview((props.aotdSettings != null) ? (props.aotdSettings['hide_tags_prereview']) : false)
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
              <ModalHeader className="flex flex-col items-center gap-1 pt-6 pb-2">
                <a href={`/profile/${userInfo['discord_id']}`} className="group flex flex-col items-center gap-2">
                  <img
                    src={props.avatarURL}
                    className="rounded-full w-20 ring-2 ring-white/10 group-hover:ring-white/30 transition-all"
                  />
                  <span className="text-base">{props.userInfo['nickname']}'s Settings</span>
                </a>
              </ModalHeader>
              <ModalBody className="font-extralight gap-4">
                <p className="text-xs text-white/40 text-center -mt-2">
                  View and update your profile data. Click your avatar above to visit your profile.
                </p>

                <div className="flex flex-col gap-1.5">
                  <p className="text-xs uppercase tracking-widest text-white/40 font-medium px-1">User Information</p>
                  {userInfoBlock()}
                </div>

                <div className="flex flex-col gap-1.5">
                  <p className="text-xs uppercase tracking-widest text-white/40 font-medium px-1">Linked Accounts</p>
                  {linkedAccountsBlock()}
                </div>

                <div className="flex flex-col gap-1.5">
                  <p className="text-xs uppercase tracking-widest text-white/40 font-medium px-1">Update Settings</p>
                  {inputsGUI()}
                </div>
              </ModalBody>
              <ModalFooter className="flex justify-between">
                <EditPasswordModal
                  userInfo={userInfo}
                  update={loginMethods.indexOf("Username/Password") != -1}
                />
                <div className="flex gap-2">
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
