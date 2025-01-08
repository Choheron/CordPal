'use client'

import {
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
  useDisclosure
} from "@nextui-org/modal";
import { Button, Divider, select } from "@nextui-org/react";
import {Input} from "@nextui-org/react";
import {Textarea} from "@nextui-org/input";
import React from "react";
import { useRouter } from 'next/navigation';
import { Listbox,  ListboxSection,  ListboxItem} from "@nextui-org/listbox";

import { checkIfAlbumAlreadyExists, checkIfUserCanSubmit, spotifySearch, submitAlbumToBackend } from "@/app/lib/spotify_utils";
import { Conditional } from "../../conditional";

// Modal to allow a user to submit an album for the album of the day pool
export default function AddAlbumModal(props) {
  // Validation Checks
  const [userAllowedToSubmit, setUserAllowedToSubmit] = React.useState(false);
  const [userAllowedToSubmitMessage, setUserAllowedToSubmitMessage] = React.useState("");
  // Dynamic values
  const [commentValue, setCommentValue] = React.useState("");
  const [selectedAlbum, setSelectedAlbum] = React.useState(null);
  const [albumError, setAlbumError] = React.useState(false)
  // Search Dynamic Values
  const [searchTitle, setSearchTitle] = React.useState("");
  const [searchArtist, setSearchArtist] = React.useState("");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isSearchLoading, setIsSearchLoading] = React.useState(false);
  const [searchAlbumsResponse, setSearchAlbumsResponse] = React.useState({});
  // Mapped data to album cards
  const [albumList, setAlbumList] = React.useState([]);
  // Listbox Selection Settings
  const [selectedKey, setSelectedKey]: any = React.useState(new Set([]));
  const selectedValue = React.useMemo(
    () => Array.from(selectedKey).join(", "),
    [selectedKey]
  );

  const {isOpen, onOpen, onOpenChange, onClose} = useDisclosure();
  const router = useRouter();

   // UseEffect to check if a user is allowed to submit albums
   React.useEffect(() => {
    const getUserSubmissionValidity = async () => {
      const canSubmitObj: {} = await checkIfUserCanSubmit();
      setUserAllowedToSubmit(canSubmitObj['canSubmit']);
      setUserAllowedToSubmitMessage(canSubmitObj['reason']);
    }
    getUserSubmissionValidity()
  }, [])

  // Send a search request and a
  const searchPress = () => {
    // Set search loading to true
    setIsSearchLoading(true)
    // Clear existing album list elements
    setAlbumList([])
    // Create payload to send data to backend
    let albumSearchData = {}
    albumSearchData['title'] = searchTitle
    albumSearchData['artist'] = searchArtist
    // Send search request to backend
    let searchString = ""
    if(searchTitle != "") {
      searchString += searchTitle
    }
    if(searchArtist != "") {
      searchString += (" artist:" + searchArtist)
    }
    setSearchQuery(searchString)
  }

  // UseEffect to search for an album once query data is updated
  React.useEffect(() => {
    const getSearchResults = async () => {
      if(searchQuery == "") {
        return;
      }
      setSearchAlbumsResponse((await spotifySearch("album", searchQuery, 6, 0))['albums'])
    }
    getSearchResults()
  }, [searchQuery])

  // UseEffect to map album data from spotify to a selectable listItem
  React.useEffect(() => {
    if(searchAlbumsResponse['items']) {
      setAlbumList(
        searchAlbumsResponse['items'].map((album_obj, index) => {
          return album_obj
        })
      )
    }
    setIsSearchLoading(false)
  }, [searchAlbumsResponse])

  // UseEffect to get selected album data
  React.useEffect(() => {
    const getSearchResults = async () => {
      if(searchQuery == "") {
        return;
      }
      setSearchAlbumsResponse((await spotifySearch("album", searchQuery, 5, 0))['albums'])
    }
    getSearchResults()
  }, [searchQuery])

  // UseEffect to map album data from spotify to a selectable listItem
  React.useEffect(() => {
    const checkIfAlbumAlreadySubmitted = async () => {
      if(selectedValue == "") {
        return;
      }
      setAlbumError(await checkIfAlbumAlreadyExists(selectedValue))
    }
    checkIfAlbumAlreadySubmitted()
    if(searchAlbumsResponse['items']) {
      setSelectedAlbum(null)
      setAlbumError(false)
      for(let i = 0; i < searchAlbumsResponse['items'].length; i++) {
        if(!(searchAlbumsResponse['items'][i])) {
          break;
        }
        if(searchAlbumsResponse['items'][i]['id'] == selectedValue) {
          setSelectedAlbum(searchAlbumsResponse['items'][i])
        }
      }
    }
  }, [selectedValue])

  // Send request to upload the submitted image
  const submitPress = () => {
    // Create payload to send data to backend
    let albumData = {}
    albumData['user_comment'] = commentValue
    albumData['album'] = selectedAlbum
    // Call backend to submit album
    submitAlbumToBackend(albumData)
    // Call cancel functionality to clear systems
    cancelPress()
  }

  // Reset values on cancel button press
  const cancelPress = () => {
    // Clear user data and search result data
    setCommentValue("")
    setSearchArtist("")
    setSearchTitle("")
    setAlbumList([])
    setSelectedAlbum(null)
    setIsSearchLoading(false)
    setSearchAlbumsResponse({})
    setAlbumError(false)
    
    onClose()
    // Reload page
    router.refresh()
  }
  
  return (
    <>
      <div className="flex flex-col justify-evenly w-full">
        <Button 
          className="p-2 my-4 mx-auto rounded-lg text-inheret min-w-0 min-h-0 h-fit bg-gradient-to-br from-green-700 to-green-800 hover:underline"
          size="lg"
          onPress={onOpen}
          radius="none"
          variant="solid"
          isDisabled={!userAllowedToSubmit}
        >
          <b>Submit An Album</b>
        </Button>
        <Conditional showWhen={!userAllowedToSubmit}>
          <div className="w-fit mx-auto backdrop-blur-2xl px-2 py-2 rounded-2xl bg-red-800/30 border border-neutral-800">
            <p className="my-2 text-sm">
              {userAllowedToSubmitMessage}
            </p>
          </div>
        </Conditional>
      </div>
      <Modal size="xl" isOpen={isOpen} isDismissable={false} onOpenChange={onOpenChange} onClose={cancelPress}>
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="mx-auto -mb-3">
                Submit an Album for the Album Pool
              </ModalHeader>
              <ModalBody>
              <div className="flex flex-col gap-2 justify-evenly">
                <Divider />
                <p className="text-xl">Album Search: </p>
                <Input 
                  className="w-full"
                  size="md"
                  label="Album Title:" 
                  placeholder="Enter an Album title" 
                  value={searchTitle}
                  onValueChange={setSearchTitle}
                  isRequired
                />
                <Input 
                  className="w-full"
                  size="md"
                  label="Artist:" 
                  placeholder="Enter an Artist's name" 
                  value={searchArtist}
                  onValueChange={setSearchArtist}
                />
                <Button 
                  isLoading={isSearchLoading}
                  color="primary" 
                  isDisabled={!((searchTitle !== "") || (searchArtist !== ""))}
                  onPress={searchPress}
                >
                  Search for Album
                </Button>
                <Divider />
                <p>Search Results:</p>
                <Conditional showWhen={albumList.length == 0}>
                  <p className="mx-auto italic">
                    Albums will appear here once you submit your search!
                  </p>
                </Conditional>
                <Conditional showWhen={albumList.length != 0}>
                  <Listbox 
                    items={albumList}
                    aria-label="Available Albums"
                    selectionMode="single"
                    onSelectionChange={setSelectedKey}
                  >
                    {(album) => (
                      <ListboxItem
                        key={album['id']}
                        className="my-1 rounded-xl bg-zinc-800/30 border border-neutral-800"
                      >
                        <div className="flex">
                          <img src={album['images'][2]['url']} width={64} height={64}  className="rounded-xl" />
                          <div className="flex flex-col ml-2">
                            <p className="text-xl line-clamp-1">{album['name']}</p>
                            <p className="text-md italic">{album['artists'][0]['name']}</p>
                          </div>
                        </div>
                      </ListboxItem>
                    )}
                  </Listbox>
                </Conditional>
                {(selectedAlbum) && (
                  <>
                    <Divider />
                    <p>Selected Album:</p>
                    <div className="flex">
                      <img src={selectedAlbum['images'][0]['url']} width={150} height={150}  className="rounded-xl" />
                      <div className="flex flex-col ml-2">
                        <p className="text-xl">{selectedAlbum['name']}</p>
                        <p className="text-md italic">{selectedAlbum['artists'][0]['name']}</p>
                        <a href={selectedAlbum['external_urls']['spotify']} target="_noreferrer" className="text-lg hover:underline">
                          Spotify Link for Verification
                        </a>
                      </div>
                    </div>
                  </>
                )}
                <Divider />
                <Textarea
                  label="Comment"
                  minRows={1}
                  placeholder="Optional Comment to include next to the Album, Currently not displayed to other users..."
                  value={commentValue}
                  onValueChange={setCommentValue}
                />
              </div>
              </ModalBody>
              <ModalFooter>
                <Conditional showWhen={albumError}>
                  <p className="text-red-500 underline mx-auto">Album has already been submitted!</p>
                </Conditional>
                <Button color="danger" variant="light" onPress={cancelPress}>
                  Cancel
                </Button>
                <Button 
                  color="primary" 
                  isDisabled={!((selectedAlbum) && (albumList) && (!albumError))}
                  onPress={submitPress}
                >
                  Submit Album
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  )
}