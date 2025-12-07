"use client"

import {
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
  useDisclosure
} from "@heroui/modal";
import { Alert } from "@heroui/alert";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";
import { Input } from "@heroui/input";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { Conditional } from "./dashboard/conditional";


// Expected props:
//  - userInfo: JSON Containing user information
//  - update: Boolean for if this user is updating an existing password or not
//  - isDisabled: Boolean - Is the button to open the modal to be disabled
export default function LoginModal(props) {
  // States
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [alertColor, setAlertColor] = useState<any>("danger")
  const [errorText, setErrorText] = useState("")
  const [loading, setLoading] = useState(false)
  // Modal Values
  const {isOpen, onOpen, onOpenChange, onClose} = useDisclosure();
  const router = useRouter();


  // Listener for keyboard enter press
  const handleKeyPress = useCallback((event) => {
    if (event.key === 'Enter') {
      if (username !== "" && password !== "" && !loading) {
        updatePress();
      }
    }
  }, [username, password, loading]);


  // UseEffect to add key listener
  useEffect(() => {
    // Only add event listener if modal is open
    if (!isOpen) return;

    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [isOpen, handleKeyPress]);


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
      setAlertColor("danger")
      setErrorText(data['message'])
      setLoading(false)
    } else if((data['errorType'] != "") && (!data['success'])) {
      setAlertColor("danger")
      setErrorText(data['message'])
      setLoading(false)
    } else {
      setAlertColor("success")
      setErrorText(data['message'])
      // On success, redirect to dashboard
      router.replace("/dashboard")
      router.refresh()
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
        isDisabled={props.isDisabled}
      >
        User/Pass
      </Button>
      <Modal 
        size="xl" 
        isOpen={(props.isDisabled) ? !props.isDisabled : isOpen} 
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
                  <Alert color={alertColor} title={errorText} />
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