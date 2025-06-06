'use client'

import { Card } from "@heroui/card";
import { Image } from "@heroui/image";
import {
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { useDisclosure } from "@heroui/react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { getImageData } from "@/app/lib/photos_utils";
import {User} from "@heroui/user";
import { getUserData } from "@/app/lib/user_utils";
import { Conditional } from "../conditional";
import {Spinner} from "@heroui/spinner";
import { convertToLocalTZString } from "@/app/lib/utils";

// Expected props:
//  - imageSrc: Source path of the picture
//  - imageID: Database GUID of image
export default function PhotoModal(props) {
  const [imgData, setImgData] = useState({})
  const [uploaderData, setUploaderData] = useState({})
  const [creatorData, setCreatorData] = useState({})
  const [loading, setLoading] = useState(false)
  const [uploadTimestamp, setUploadTimestamp] = useState<Date>(new Date())
  const {isOpen, onOpen, onOpenChange, onClose} = useDisclosure();

  useEffect(() => {
    const setImageDataFunc = async () => {
      setImgData(await getImageData(props.imageID))
    }
    if(isOpen) {
      setLoading(true)
      setImageDataFunc()
    }
  }, [isOpen]);

  /* 
  imgData object should have the following format:
    {
      "image_id": X,
      "title": "TITLE",
      "description": "DESCRIPTION",
      "upload_timestamp": "STRING OF TIME",
      "uploader": "DISCORD ID",
      "creator": "DISCORD ID",
      "tagged_users": [
          "DISCORD ID",
          "DISCORD ID"
      ]
    }
  */
  useEffect(() => {
    const setSecondaryDataFunc = async () => {
      setUploaderData(await getUserData(imgData['uploader']))
      setCreatorData(await getUserData(imgData['creator']))
      setUploadTimestamp(new Date(Date.parse(imgData['upload_timestamp'])))
    }
    setSecondaryDataFunc()
    setLoading(false)
  }, [imgData]);

  const handleOnClose = () => {
    setImgData({})
    setUploaderData({})
    setCreatorData({})
    setLoading(false)
    // do normal onclose
    onClose()
  }

  return (
    <>
      <Card
        isHoverable
        isPressable
        onPress={onOpen}
        radius="lg"
        className="!duration-700 border-none hover:scale-105 bg-transparent"
      >
        <Image
          alt={imgData['title']}
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
        onClose={handleOnClose}
        placement="center"
        scrollBehavior="outside"
        backdrop='blur'
        classNames={{
          base: "group transition-property: all;",
          closeButton: "position:relative z-50 group-hover:text-white duration-150 hover:bg-white/5 active:bg-white/10",
        }}
      >
        <ModalContent className="bg-transparent w-fit h-fit max-h-full shadow-none">
          {() => (
            <>
              <Conditional showWhen={loading}>
                <Spinner size="lg" />
              </Conditional>
              <Conditional showWhen={!loading}>
                <ModalHeader className={`flex flex-col gap-2 opacity-0 ${(imgData['uploader'] !== imgData['creator'] ? "-mb-48" : "-mb-36")} z-40 group-hover:opacity-100 duration-1000 ease-in-out`}>
                  <Conditional showWhen={!loading}>
                    <b>{imgData['title']}</b>
                    {imgData['description']}
                    <div className="flex gap-3 ">
                      <p className="my-auto">{(imgData['uploader'] !== imgData['creator'] ? "Uploader:" : "Mastermind:")} </p>
                      <User
                        className=""
                        name={uploaderData['nickname']}
                        avatarProps={{
                          src: `${uploaderData['avatar_url']}`
                        }}
                      />
                    </div>
                    <Conditional showWhen={imgData['uploader'] !== imgData['creator']} >
                      <div className="flex gap-3 ">
                        <p className="my-auto">Creator: </p>
                        <User
                          className=""
                          name={creatorData['nickname']}
                          avatarProps={{
                            src: `${creatorData['avatar_url']}`
                          }}
                        />
                      </div>
                    </Conditional>
                  </Conditional>
                </ModalHeader>
                <ModalBody className="p-0 filter h-fit group-hover:brightness-50 group-hover:blur-md duration-1000 ease-in-out">
                  <Image
                    alt={imgData['title']}
                    loading="lazy"
                    className="object-cover"
                    width={0}
                    height={0}
                    src={props.imageSrc}
                    style={{ width: 'auto', height: 'auto' }}
                  />
                </ModalBody>
                <ModalFooter className="flex flex-col max-w-full opacity-0 -mt-32 pb-2 z-40 group-hover:opacity-100 duration-1000 ease-in-out">
                  <Conditional showWhen={!loading}>
                    <p>Uploaded: {convertToLocalTZString(uploadTimestamp)}</p>
                    <p>Filename: {imgData['filename']}</p>
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
                  </Conditional>
                </ModalFooter>
              </Conditional>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  )
}