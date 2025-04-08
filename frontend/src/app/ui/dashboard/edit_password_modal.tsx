import {
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
  useDisclosure
} from "@heroui/modal";
import { addToast, Alert, Button, Spinner } from "@heroui/react";
import {Input} from "@heroui/react";
import React, { useEffect } from "react";
import { useRouter } from 'next/navigation';
import { getPasswordValidators, updateUserPassword } from "@/app/lib/user_utils";
import { Conditional } from "./conditional";
import { revalidateTag } from "next/cache";


// Expected props:
//  - userInfo: JSON Containing user information
//  - update: Boolean for if this user is updating an existing password or not
export default function EditPasswordModal(props) {
  // Static values
  const userInfo = props.userInfo // UserInfo Object Keys: {guid, username, last_updated_timestamp, creation_timestamp, email, nickname, discord_id, discord_discriminator, discord_is_verified, discord_avatar, spotify_connected, is_active, is_staff, avatar_url}
  const nickname = userInfo['nickname']
  const update = props.update
  // Password States
  const [hasUpdated, setHasUpdated] = React.useState(false)
  const [oldPassValue, setOldPassValue] = React.useState("")
  const [oldPassError, setOldPassErrorValue] = React.useState("")
  const [newPassValue, setNewPassValue] = React.useState("")
  const [newPassConfirmValue, setNewPassConfirmValue] = React.useState("")
  const [passErrorMessage, setPassErrorMessage] = React.useState("")
  // Other States
  const [passRequirements, setPassReqirements] = React.useState(<p>Loading Password Requirements...</p>)
  const [canUpdate, setCanUpdate] = React.useState(true)
  const [awaiting, setAwaiting] = React.useState(false)
  const [serverErr, setServerErr] = React.useState("")
  // Modal Values
  const {isOpen, onOpen, onOpenChange, onClose} = useDisclosure();
  const router = useRouter();

  // useEffect to pull the password requirements
  useEffect(() => {
    const setReqs = async () => {
      const requirements = await getPasswordValidators()
      setPassReqirements(
        <div>
          <p>Password Requirements:</p>
          <ol className="list-disc">
            {requirements.map((req, index) => {
              return (
                <li key={index} className="ml-5">
                  <p>{req}</p>
                </li>
              )
            })}
            <Conditional showWhen={update}>
              <li key={requirements.length} className="ml-5">
                <p>Your new password can&apos;t be the same as your old password.</p>
              </li>
            </Conditional>
          </ol>
        </div>
      )
    }
    setReqs()
  }, [])

  // useEffect to ensure that passwords meet requirements
  useEffect(() => {
    if(newPassValue == "" && hasUpdated) {
      setPassErrorMessage("Password cannot be empty.")
      setCanUpdate(false)
      return
    }
    if((newPassConfirmValue != "") && (newPassValue != "") && (newPassConfirmValue != newPassValue)) {
      setPassErrorMessage("Passwords do not match")
      setCanUpdate(false)
      return
    }
    setPassErrorMessage("")
    setCanUpdate(true)
  }, [oldPassValue, newPassValue, newPassConfirmValue])

  function inputsGUI() {
    return (
      <div className="flex flex-col justify-evenly">
        <Conditional showWhen={update}>
          <Input
            isRequired
            className="mt-2"
            label="Old Password"
            placeholder="Enter your Old Password"
            value={oldPassValue}
            isInvalid={oldPassError != ""}
            errorMessage={oldPassError}
            onValueChange={setOldPassValue}
            type="password"
          />
        </Conditional>
        <Input
          isRequired
          className="mt-2"
          label="New Password"
          placeholder="Enter your New Password"
          value={newPassValue}
          isInvalid={passErrorMessage != ""}
          errorMessage={passErrorMessage}
          onValueChange={(e) => {
              setNewPassValue(e)
              setHasUpdated(true)
            }
          }
          type="password"
        />
        <Input
          isRequired
          className="mt-2"
          label="Confirm New Password"
          placeholder="Enter your New Password Again"
          value={newPassConfirmValue}
          isInvalid={passErrorMessage != ""}
          onValueChange={setNewPassConfirmValue}
          type="password"
        />
      </div>
    )
  }

  // Send request to update user data based on UI inputs
  const updatePress = async () => {
    setAwaiting(true)
    // Build update json to only include updated fields
    let updateJson = {}
    updateJson['update'] = update
    updateJson['old_password'] = oldPassValue
    updateJson['new_password'] = newPassConfirmValue
    updateJson['user_data'] = userInfo
    // Make password call to update password on backend
    const response = await updateUserPassword(updateJson)
    setAwaiting(false)
    if(response['code'] != 200) { // Check for server level or system level failure
      setServerErr(response['data']['message'])
    } else if(!response['data']['success']) { // Check for failure status
      if(response['data']['errorType'] == "OLD") {
        setOldPassErrorValue(response['data']['message'])
      } else if(response['data']['errorType'] == "NEW") {
        setPassErrorMessage(response['data']['message'])
      }
    } else {
      addToast({
        title: "Password Updated",
        description: response['data']['message'],
        color: "success",
      })
      // Run the cancel command
      cancelPress()
    }
  }

  // Reset values on cancel button press
  const cancelPress = () => {
    setOldPassValue("")
    setOldPassErrorValue("")
    setNewPassValue("")
    setNewPassConfirmValue("")
    setPassErrorMessage("")
    setServerErr("")
    setHasUpdated(false)
    setAwaiting(false)
    onClose()
  }

  return (
    <>
      <Button 
        color="primary" 
        onPress={onOpen}
      >
        {(props.update) ? "Change Password" : "Set your Password"}
      </Button>
      <Modal 
        size="xl" 
        isOpen={isOpen} 
        onOpenChange={onOpenChange} 
        isDismissable={false} 
        isKeyboardDismissDisabled={false} 
        onClose={cancelPress}
      >
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex flex-col flex-wrap w-full gap-1 content-center">
                <p>Update Your Password</p>
              </ModalHeader>
              <ModalBody className="font-extralight">
                <Conditional showWhen={serverErr != ""}>
                  <Alert color="danger" title={serverErr} />
                </Conditional>
                <p>Your Current Login Username: <b>{`${userInfo['nickname']}`}</b></p>
                <p>{passRequirements}</p>
                {inputsGUI()}
              </ModalBody>
              <ModalFooter className="flex justify-between">
                <Button color="danger" variant="light" onPress={cancelPress}>
                  Close
                </Button>
                <Button 
                  color="primary" 
                  onPress={updatePress}
                  isDisabled={!canUpdate || awaiting || (serverErr != "")}
                >
                  {(awaiting) ? <Spinner className="text-white" /> : "Submit"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  )
}