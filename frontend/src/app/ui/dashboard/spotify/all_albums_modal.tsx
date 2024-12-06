'use client'

import {
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
  useDisclosure
} from "@nextui-org/modal";
import { Button } from "@nextui-org/react";
import React from "react";
import { useRouter } from 'next/navigation';
import { getAllAlbums } from "@/app/lib/spotify_utils";
import { convertToLocalTZString } from "@/app/lib/utils";


// Modal to allow a user to upload an image
export default function AllAlbumsModal(props) {
  const [updateTimestamp, setUpdateTimestamp] = React.useState<any>("")
  const [albumList, setAlbumList] = React.useState([])

  const {isOpen, onOpen, onOpenChange, onClose} = useDisclosure();
  const router = useRouter();

  // UseEffect to pull Album Data
  React.useEffect(() => {
    const ingestData = async () => {
      let albumData = await getAllAlbums()
      setAlbumList(albumData['albums_list'])
      setUpdateTimestamp(albumData['timestamp'])
    }
    ingestData()
  }, [])

  // Reset values on cancel button press
  const cancelPress = () => {
    onClose()
    // Reload page
    router.refresh()
  }

  return (
    <>
      <Button 
        className="p-2 mx-auto w-[90%] text-sm text-inheret h-fit hover:underline"
        size="sm"
        onPress={onOpen}
        radius="lg"
        variant="solid"
      >
        View All Albums
      </Button>
      <Modal size="5xl" isOpen={isOpen} onOpenChange={onOpenChange} isDismissable={false} onClose={cancelPress}>
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex flex-col flex-wrap w-full gap-1 content-center">
                Album Data
              </ModalHeader>
              <ModalBody>
                {albumList.toString()}
              </ModalBody>
              <ModalFooter>
                <div className="flex w-full justify-between">
                  <p className="my-auto">
                    Data Last Updated: {convertToLocalTZString(updateTimestamp, true)}
                  </p>
                  <Button color="danger" variant="light" onPress={onClose}>
                    Close
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