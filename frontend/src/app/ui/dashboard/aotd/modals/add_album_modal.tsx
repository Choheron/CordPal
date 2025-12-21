'use client'

import {
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
  useDisclosure
} from "@heroui/modal";
import { addToast, Button, Divider, Link } from "@heroui/react";
import { Checkbox } from "@heroui/checkbox";
import { Input } from "@heroui/input";
import { Textarea } from "@heroui/input";

import React from "react";
import { useRouter } from 'next/navigation';
import { Listbox,  ListboxItem} from "@heroui/listbox";
import { checkIfAlbumAlreadyExists, checkIfUserCanSubmit, submitAlbumToBackend } from "@/app/lib/aotd_utils";
import { Conditional } from "../../conditional";
import InfoPopover from "@/app/ui/general/info_popover";
import { musicBrainzAlbumSearch } from "@/app/lib/aotd_utils";
import {Image} from "@heroui/image";
import { isUserAdmin } from "@/app/lib/user_utils";

// Modal to allow a user to submit an album for the album of the day pool
export default function AddAlbumModal(props) {
  // Props check
  const [selectionChance, setSelectionChance] = React.useState((props.userSelectChance) ? props.userSelectChance : "!ERR!")
  // Validation Checks
  const [userAllowedToSubmit, setUserAllowedToSubmit] = React.useState(false);
  const [userAllowedToSubmitMessage, setUserAllowedToSubmitMessage] = React.useState("");
  const [isAdmin, setIsAdmin] = React.useState(false);
  // Dynamic values
  const [commentValue, setCommentValue] = React.useState("");
  const [isHidden, setIsHidden] = React.useState(false);
  const [selectedAlbum, setSelectedAlbum] = React.useState(null);
  const [albumError, setAlbumError] = React.useState(false)
  const [albumErrorData, setAlbumErrorData] = React.useState({})
  // Search Dynamic Values
  const [searchTitle, setSearchTitle] = React.useState("");
  const [searchArtist, setSearchArtist] = React.useState<any>("");
  const [searchObj, setSearchObj] = React.useState({ album: "", artist: null});
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

  // UseEffect to check if a user is allowed to submit albums and see if the user is an admin
  React.useEffect(() => {
    const checkAdmin = async() => {
      const adminFlag = await isUserAdmin()
      setIsAdmin(adminFlag)
    }
    getUserSubmissionValidity()
    checkAdmin()
  }, [])

  // Send a search request and a
  const searchPress = () => {
    // Set search loading to true
    setIsSearchLoading(true)
    // Clear existing album list elements
    setAlbumList([])
    // Create payload to send data to backend
    let albumSearchData = { album: "", artist: null}
    if(searchTitle != "") {
      albumSearchData.album = searchTitle
    }
    if((searchArtist != "") && (searchArtist != null)) {
      albumSearchData.artist = searchArtist
    } else {
      setSearchArtist("")
    }
    setSearchObj(albumSearchData)
  }

  // UseEffect to search for an album once query data is updated
  React.useEffect(() => {
    const getSearchResults = async () => {
      if(searchObj.album == "") {
        return;
      }
      setSearchAlbumsResponse((await musicBrainzAlbumSearch(searchObj.album, searchObj.artist)))
    }
    getSearchResults()
  }, [searchObj])

  // UseEffect to map album data from spotify to a selectable listItem
  React.useEffect(() => {
    if(searchAlbumsResponse['releases']) {
      setAlbumList(
        searchAlbumsResponse['releases'].map((album_obj, index) => {
          return album_obj
        })
      )
    }
    setIsSearchLoading(false)
  }, [searchAlbumsResponse])


  // UseEffect to map album data from musicbrainz to a selectable listItem
  React.useEffect(() => {
    if(searchAlbumsResponse['releases']) {
      setSelectedAlbum(null)
      setAlbumError(false)
      for(let i = 0; i < searchAlbumsResponse['releases'].length; i++) {
        if(!(searchAlbumsResponse['releases'][i])) {
          break;
        }
        if(searchAlbumsResponse['releases'][i]['id'] == selectedValue) {
          setSelectedAlbum(searchAlbumsResponse['releases'][i])
        }
      }
    }
  }, [selectedValue])

  // UseEffect to set of album is already submitted
  React.useEffect(() => {
    const checkIfAlbumAlreadySubmitted = async () => {
      if(selectedValue == "") {
        return;
      }
      const albumErrData = await checkIfAlbumAlreadyExists((selectedAlbum) ? selectedAlbum['release-group']['id'] : null)
      setAlbumErrorData(albumErrData)
      setAlbumError(albumErrData['exists'])
    }

    console.log(selectedAlbum)
    checkIfAlbumAlreadySubmitted()
  }, [selectedAlbum])


  // Send request to upload the submitted image
  const submitPress = async () => {
    // Create payload to send data to backend
    let albumData = {}
    albumData['user_comment'] = commentValue
    albumData['album'] = selectedAlbum
    albumData['album']['hidden'] = isHidden
    // Call backend to submit album
    const responseObj = await submitAlbumToBackend(albumData)
    // Alert user of action status
    if((responseObj['status'] == 200) && (selectedAlbum != null)) {
      addToast({
        title: `Successfully submitted "${selectedAlbum['title']}"!`,
        description: `${selectedAlbum['title']} has been added to the Album of the Day Selecton Pool!`,
        color: "success",
      })
    } else {
      addToast({
        title: `Failed to submit album!`,
        description: `Album failiure submitted with the following error code: ${responseObj['status']}. Please contact server administrators with CRID: ${responseObj['crid']}.`,
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
    setIsHidden(false)
    
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
            isDisabled={!userAllowedToSubmit}
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
      <Modal 
        size="xl" 
        isOpen={isOpen} 
        isDismissable={false} 
        onOpenChange={onOpenChange} 
        onClose={cancelPress}
        scrollBehavior="inside"
      >
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
                    className="max-h-[25vh] overflow-y-auto"
                  >
                    {(album) => (
                      // Display each album in alist
                      <ListboxItem
                        key={album['id']}
                        className="my-1 rounded-xl bg-zinc-800/30 border border-neutral-800"
                      >
                        <div className="flex max-w-full">
                          <div className="shrink-0">
                            <Image
                              src={`/dashboard/aotd/api/album-cover/${album['release-group']['id']}`}
                              fallbackSrc="https://placehold.co/100x100?text=Cover+Not+Found"
                              alt={`Album Art for ${album['title']}`}
                              width={50}
                              height={50}
                              className="rounded-xl"
                            />
                          </div>
                          <div className="flex flex-col mx-2 w-full">
                            <div className="flex">
                              <p className="text-lg line-clamp-1">{album['title']}</p>
                              <Conditional showWhen={album['disambiguation']}>
                                <p className="text-sm my-auto ml-1 italic line-clamp-1">&#40;{album['disambiguation']}&#41;</p>
                              </Conditional>
                            </div>
                            <p className="text-sm italic">{album['artist-credit'][0]['name']}</p>
                            <p className="text-sm italic">{album['date']}</p>
                          </div>
                          <div className="w-1/2">
                            <p className="text-sm">Type: {album['release-group']['primary-type']}</p>
                            <p className="text-sm">{album['track-count']} Tracks</p>
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
                      <Image
                        src={`/dashboard/aotd/api/album-cover/${selectedAlbum['id']}`}
                        fallbackSrc="https://placehold.co/150x150?text=Cover+Not+Found"
                        alt={`Album Art for ${selectedAlbum['title']}`}
                        width={150}
                        height={150}
                        className="rounded-xl"
                      />
                      <div className="flex flex-col ml-2">
                        <div className="flex">
                          <p className="text-2xl">{selectedAlbum['title']}</p>
                          <Conditional showWhen={selectedAlbum['disambiguation']}>
                            <p className="text-sm my-auto ml-1 italic">&#40;{selectedAlbum['disambiguation']}&#41;</p>
                          </Conditional>
                        </div>
                        <p className="text-base italic">{selectedAlbum['artist-credit'][0]['name']}</p>
                        <p className="text-base italic">{selectedAlbum['date']}</p>
                        <p className="text-sm">{selectedAlbum['track-count']} Tracks</p>
                        <a href={`https://musicbrainz.org/release/${selectedAlbum['id']}`} target="_noreferrer" className="text-lg text-blue-600 hover:underline">
                          MusicBrainz Link for Verification
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
                <div className="flex flex-col">
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
                  <Conditional showWhen={isAdmin}>
                    <div className="">
                      <Checkbox isSelected={isHidden} onValueChange={setIsHidden}>
                        Hide This Submission?
                      </Checkbox>
                    </div>
                  </Conditional>
                </div>
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