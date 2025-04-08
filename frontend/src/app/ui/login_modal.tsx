"use client"

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
import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { Conditional } from "./dashboard/conditional";


// Expected props:
//  - userInfo: JSON Containing user information
//  - update: Boolean for if this user is updating an existing password or not
export default function LoginModal(props) {
  // States
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [errorText, setErrorText] = useState("")
  const [loading, setLoading] = useState(false)
  // Modal Values
  const {isOpen, onOpen, onOpenChange, onClose} = useDisclosure();
  const router = useRouter();

  function inputsGUI() {
    return (
      <div className="flex flex-col justify-evenly">
        <Input
          isRequired
          className="mt-2"
          label="Username/Nickname"
          placeholder="Enter Username/Nickname"
          value={username}
          onValueChange={setUsername}
        />
        <Input
          isRequired
          className="mt-2"
          label="Password"
          placeholder="Enter Password"
          value={password}
          onValueChange={setPassword}
          type="password"
        />
      </div>
    )
  }

  // Send request to update user data based on UI inputs
  const updatePress = async () => {
    setLoading(true)
    // Build update json to only include updated fields
    let loginJson = {}
    loginJson['username'] = username
    loginJson['password'] = password
    // Make password call to update password on backend
    const loginResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/users/traditionalLogin`, {
      method: "POST",
      credentials: "include",
      cache: 'no-cache',
      body: JSON.stringify(loginJson)
    });
    const status = loginResponse.status
    const data = await loginResponse.json()
    // If error, display error
    if(status != 200) {
      setErrorText(data['message'])
      setLoading(false)
    } else if((data['errorType'] != "") && (!data['success'])) {
      setErrorText(data['message'])
      setLoading(false)
    } else {
      // On success, redirect to dashboard
      router.replace("/dashboard")
    }
  }

  // Reset values on cancel button press
  const cancelPress = () => {
    setUsername("")
    setPassword("")
    setErrorText("")
    onClose()
  }

  return (
    <>
      <Button 
        color="primary" 
        onPress={onOpen}
        radius="lg"
        className={`w-full hover:underline bg-black`}
        variant="solid"
      >
        User/Pass
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
                <p>Login with Username and Password</p>
              </ModalHeader>
              <ModalBody className="font-extralight">
                <Conditional showWhen={errorText != ""}>
                  <Alert color="danger" title={errorText} />
                </Conditional>
                <p>Note: You must login with discord and set up a password before you can use the traditional login method.</p>
                {inputsGUI()}
              </ModalBody>
              <ModalFooter className="flex justify-between">
                <Button 
                  color="danger" 
                  variant="light" 
                  onPress={cancelPress}
                  isDisabled={loading}
                >
                  Close
                </Button>
                <Button 
                  color="primary" 
                  onPress={updatePress}
                  isDisabled={(username == "") || (password == "") || loading}
                >
                  {(loading) ? <Spinner className="text-white" /> : "Login"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  )
}