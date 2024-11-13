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


// Expected props:
//  - userInfo: JSON Containing user information
//  - avatarURL: String URL of Discord User's Avatar
//  - linkedAccounts: List containing connected account data 
export default function SettingsModal(props) {
  const [emailValue, setEmailValue] = React.useState(props.userInfo['email']);
  const [nicknameValue, setNicknameValue] = React.useState(props.userInfo['nickname']);
  const {isOpen, onOpen, onOpenChange, onClose} = useDisclosure();
  const router = useRouter();

  function linkedAccountsBlock() {
    return props.linkedAccounts.map((integrationObject) => {
      return (
        <User   
          name={integrationObject['branding_name']}
          description={(integrationObject['data'] == null) ? "Not Connected" : ("Connected to Account: " + integrationObject['data']['display_name'])}
          avatarProps={{
            src: integrationObject['branding_avatar_path'],
            isDisabled: (integrationObject['data'] == null)
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