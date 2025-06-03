'use client'

import {
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
  useDisclosure
} from "@heroui/modal";
import { addToast, Button, Divider, Link, select } from "@heroui/react";
import {Input} from "@heroui/react";
import {Textarea} from "@heroui/input";
import React from "react";
import { useRouter } from 'next/navigation';
import { Listbox,  ListboxItem} from "@heroui/listbox";

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
  const [albumErrorData, setAlbumErrorData] = React.useState({})
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

  // Check if the user is allowed to submit
  // Moved outside of useEffect to allow function to be called externally 
  const getUserSubmissionValidity = async () => {
    const canSubmitObj: {} = await checkIfUserCanSubmit();
    setUserAllowedToSubmit(canSubmitObj['canSubmit']);
    setUserAllowedToSubmitMessage(canSubmitObj['reason']);
  }

  // UseEffect to check if a user is allowed to submit albums
  React.useEffect(() => {
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
      const albumErrData = await checkIfAlbumAlreadyExists(selectedValue)
      setAlbumErrorData(albumErrData)
      setAlbumError(albumErrData['exists'])
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
  const submitPress = async () => {
    // Create payload to send data to backend
    let albumData = {}
    albumData['user_comment'] = commentValue
    albumData['album'] = selectedAlbum
    // Call backend to submit album
    const status = await submitAlbumToBackend(albumData)
    // Alert user of action status
    if((status == 200) && (selectedAlbum != null)) {
      addToast({
        title: `Successfully submitted "${selectedAlbum['name']}"!`,
        description: `${selectedAlbum['name']} has been added to the Album of the Day Selecton Pool!`,
        color: "success",
      })
    } else {
      addToast({
        title: `Failed to submit album!`,
        description: `Album failiure submitted with the following error code: ${status}. Please contact server administrators.`,
        color: "danger",
      })
    }
    // Check user submission validity
    getUserSubmissionValidity()
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
  }
  
  return (
    <>
      <div className="flex flex-col sm:flex-row gap-0 justify-center w-full">
        <div className={`flex mx-auto sm:mx-0`}>
          <Button 
            className="p-2 mt-2 mb-1 rounded-lg text-inheret min-w-0 min-h-0 h-fit bg-gradient-to-br from-green-700 to-green-800 hover:underline"
            size="lg"
            onPress={onOpen}
            radius="none"
            variant="solid"
            // isDisabled={!userAllowedToSubmit}
            isDisabled={true} // Disabiling album submission until migration takes place
          >
            <b>Submit An Album</b>
          </Button>
        </div>
        <Conditional showWhen={!userAllowedToSubmit && userAllowedToSubmitMessage != ""}>
          <div className="flex gap-1 w-fit mx-auto sm:mx-1 my-auto backdrop-blur-2xl px-2 py-2 rounded-2xl border border-neutral-800">
            <p className="text-sm my-auto italic text-gray-400">
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
                  <div className="text-red-500 my-auto">
                    <p className="underline mx-auto">Album has already been submitted!</p>
                    <div className="flex w-full">
                      <p className="my-auto">Submitted by:</p>
                      <Link 
                        isBlock 
                        href={`/profile/${albumErrorData['submitter_id']}`}
                      >
                        {albumErrorData['submitter_nickname']}
                      </Link>
                    </div>
                  </div>
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