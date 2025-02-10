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
import InfoPopover from "@/app/ui/general/info_popover";

// Modal to allow a user to submit an album for the album of the day pool
export default function AddAlbumModal(props) {
  // Props check
  const [selectionChance, setSelectionChance] = React.useState((props.userSelectChance) ? props.userSelectChance : "!ERR!")
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
    location.reload()
  }
  
  return (
    <>
      <div className="flex flex-col lg:flex-row gap-1 justify-center w-full">
        <div className="flex flex-col">
          <Button 
            className="p-2 mt-4 mb-1 rounded-lg text-inheret min-w-0 min-h-0 h-fit bg-gradient-to-br from-green-700 to-green-800 hover:underline"
            size="lg"
            onPress={onOpen}
            radius="none"
            variant="solid"
            isDisabled={!userAllowedToSubmit}
          >
            <b>Submit An Album</b>
          </Button>
          <InfoPopover 
            triggerText="Odds" 
            triggerClassName="my-auto mx-auto"
            triggerTextColor="blue-500"
            popoverTitle="What are the odds of one of my albums getting picked?"
            popoverText={`Given current conditions (blocked users, number of AOtD picks you may or may not have, etc) you currently have a selection chance of: ${selectionChance}%`}
            popoverPlacement="top"
            showArrow={true}
          />
        </div>
        <Conditional showWhen={!userAllowedToSubmit && userAllowedToSubmitMessage != ""}>
          <div className="flex gap-1 w-fit mx-2 my-4 backdrop-blur-2xl px-2 py-2 rounded-2xl border border-neutral-800">
            <p className="text-sm my-auto">
              You are currently unable to Submit an album. 
            </p>
            <InfoPopover 
              triggerText=" Why?" 
              triggerClassName="my-auto"
              triggerTextColor="blue-500"
              popoverTitle="Why am I unable to submit an album?"
              popoverText={userAllowedToSubmitMessage}
              popoverPlacement="top"
              showArrow={true}
            />
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
                <div className="max-w-[320px] lg:max-w-[650px] px-2 py-2 mt-2 text-small italic border border-neutral-800 rounded-2xl bg-zinc-800/30">
                  <p>
                    NOTE: Please refrain from submitting &quot;best of&quot; albums to the AOtD pool. The purpose of the AOtD is to add albums created by the artist in their originial form &#40;extended editions,
                    deluxes, and the like are allowed&#41;. If any album is in question, ask in the discord. Additionally, please check if an album&apos;s deluxe, extended, etc edition has already been submitted before
                    submitting an album. 
                  </p>
                </div>
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