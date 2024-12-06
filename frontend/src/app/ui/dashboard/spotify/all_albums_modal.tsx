'use client'

import {
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
  useDisclosure
} from "@nextui-org/modal";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell
} from "@nextui-org/table";
import { Avatar, Button } from "@nextui-org/react";
import React from "react";
import { useRouter } from 'next/navigation';
import { getAllAlbums, getAllAlbumsNoCache } from "@/app/lib/spotify_utils";
import { convertToLocalTZString, ratingToTailwindBgColor } from "@/app/lib/utils";


// Modal to display all submitted albums
//  - 
export default function AllAlbumsModal(props) {
  const [updateTimestamp, setUpdateTimestamp] = React.useState<any>("")
  const [albumList, setAlbumList] = React.useState([])
  // Modal Controller Vars
  const {isOpen, onOpen, onOpenChange, onClose} = useDisclosure();
  const router = useRouter();
  // Columns for Table
  const columns = [
    {
      key: "title",
      label: "ALBUM NAME",
      sortable: false,
    },
    {
      key: "artist",
      label: "ARTIST",
      sortable: false,
    },
    {
      key: "submitter",
      label: "SUBMITTER",
      sortable: false,
    },
    {
      key: "submission_date",
      label: "SUBMITTED ON",
      sortable: false,
    },
    {
      key: "rating",
      label: "RATING (IF AVAIL)",
      sortable: true,
    },
  ];

  // UseEffect to pull Album Data
  React.useEffect(() => {
    const ingestData = async () => {
      let albumData = await getAllAlbums()
      setAlbumList(albumData['albums_list'])
      setUpdateTimestamp(albumData['timestamp'])
    }
    ingestData()
  }, [])

  // Render Cell dynamically
  const renderCell = React.useCallback((album , columnKey: React.Key) => {
    // Change render based on column key
    switch (columnKey) {
      case "title":
        return (
          <div className="flex gap-2">
            <Avatar
              src={album['album_img_src']}
            />
            <a href={album['album_src']} target="_noreferrer" className="text-lg my-auto hover:underline">
              {album['title']}
            </a>
          </div>
        );
      case "artist":
        return (
          <a href={album['artist']['href']} target="_noreferrer" className="text-md my-auto hover:underline">
            {album['artist']['name']}
          </a>
        );
      case "submitter":
        return (
          <div className="flex gap-2">
            <Avatar
              src={album['submitter_avatar_url']}
            />
            <p className="my-auto">
              {album['submitter_nickname']}
            </p>
          </div>
        );
      case "submission_date":
        return (
          <p className="my-auto">
            {album['submission_date']}
          </p>
        );
      case "rating":
        return (
          (album['rating'] != null)? 
            <div className={`px-2 py-2`}>
              <p className={`text-center text-black ${ratingToTailwindBgColor(album['rating'])} rounded-full`}>
                <b>{album['rating'].toFixed(2)}</b>
              </p>
            </div> 
            : 
            <p className="text-center">
              --
            </p>
        );
    }
  }, []);

  // Reset values on cancel button press
  const hardRefresh = () => {
    const ingestNewData = async () => {
      let albumData = await getAllAlbumsNoCache()
      setAlbumList(albumData['albums_list'])
      setUpdateTimestamp(albumData['timestamp'])
    }
    ingestNewData()
  }

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
      <Modal 
        size="5xl" 
        scrollBehavior={"inside"}
        isOpen={isOpen} 
        onOpenChange={onOpenChange} 
        backdrop="blur"
        onClose={cancelPress}
      >
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex flex-col flex-wrap w-full gap-1 content-center">
                Album Data
              </ModalHeader>
              <ModalBody>
                <Table aria-label="Album Submissions">
                  <TableHeader columns={columns}>
                    {(column) => <TableColumn key={column.key} className="w-fit">{column.label}</TableColumn>}
                  </TableHeader>
                  <TableBody 
                    items={albumList}
                    emptyContent={"No rows to display."}
                  >
                    {(item) => (
                      <TableRow key={item['title']}>
                        {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ModalBody>
              <ModalFooter>
                <div className="flex w-full justify-between">
                  <p className="my-auto">
                    Data Last Updated: {convertToLocalTZString(updateTimestamp, true)}
                  </p>
                  <div>
                    <Button color="danger" variant="bordered" onPress={onClose}>
                      Close
                    </Button>
                  </div>
                </div>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  )
}