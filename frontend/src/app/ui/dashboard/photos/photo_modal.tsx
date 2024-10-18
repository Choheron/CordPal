'use client'

import {Card} from "@nextui-org/card";
import { Image } from "@nextui-org/image";
import {
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
} from "@nextui-org/modal";
import { useDisclosure } from "@nextui-org/react";

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
        // hideCloseButton
        isOpen={isOpen} 
        onOpenChange={onOpenChange} 
        onClose={onClose}
        backdrop='blur'
        classNames={{
          closeButton: "position:relative z-50 hover:bg-white/5 active:bg-white/10",
        }}
      >
        <ModalContent className="bg-transparent w-fit">
          {() => (
            <>
              <ModalBody className="p-0">
                <Image
                  alt={props.nameString}
                  className="object-cover"
                  width={0}
                  height={0}
                  src={props.imageSrc}
                  style={{ width: 'auto', height: 'auto' }}
                />
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  )
}