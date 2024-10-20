'use client'

import { Card } from "@nextui-org/card";
import { Image } from "@nextui-org/image";
import {
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
} from "@nextui-org/modal";
import { Button } from "@nextui-org/button";
import { useDisclosure } from "@nextui-org/react";
import Link from "next/link";

// Expected props:
//  - imageSrc: Source path of the picture
//  - nameString: String name of the image
//  - creator: String of creator information
//  - uploader: String of who uploaded the image
export default function PhotoModal(props) {
  const {isOpen, onOpen, onOpenChange, onClose} = useDisclosure();

  return (
    <>
      <Card
        isHoverable
        isPressable
        onPress={onOpen}
        radius="lg"
        className="border-none hover:scale-105 bg-transparent"
      >
        <Image
          alt={props.nameString}
          className="object-cover"
          width={0}
          height={0}
          src={props.imageSrc}
          style={{ width: 'auto', height: 'auto' }}
        />
      </Card>
      <Modal 
        size="5xl" 
        isOpen={isOpen} 
        onOpenChange={onOpenChange} 
        onClose={onClose}
        backdrop='blur'
        classNames={{
          base: "group transition-property: all;",
          closeButton: "position:relative z-50 group-hover:text-white duration-1000 hover:bg-white/5 active:bg-white/10",
        }}
      >
        <ModalContent className="bg-transparent w-fit">
          {() => (
            <>
              <ModalHeader className="opacity-0 -mb-16 z-40 group-hover:opacity-100 duration-1000 ease-in-out">
                {props.nameString}
              </ModalHeader>
              <ModalBody className="p-0 group-hover:blur-md duration-1000 ease-in-out">
                <Image
                  alt={props.nameString}
                  className="object-cover"
                  width={0}
                  height={0}
                  src={props.imageSrc}
                  style={{ width: 'auto', height: 'auto' }}
                />
              </ModalBody>
              <ModalFooter className="opacity-0 -mt-20 z-40 group-hover:opacity-100 duration-1000 ease-in-out">
                <Button 
                  as={Link}
                  href={props.imageSrc}
                  target="_blank"
                  radius="lg"
                  className="z-40 text-white border-white bg-white hover:underline bg-opacity-0 hover:bg-opacity-40 duration-1000 ease-in-out" 
                  variant="bordered"
                >
                  Download
                </Button> 
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  )
}