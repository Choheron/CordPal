"use client"

import { useEffect, useState } from "react"
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Skeleton,
  useDisclosure,
  Spinner,
  Alert
} from "@heroui/react";
import { RiAddFill, RiSubtractFill } from "react-icons/ri";
import { useRouter } from 'next/navigation';
import { Conditional } from "@/app/ui/dashboard/conditional";


/* Display the confirmation modal for songs to remove and keep
 * Expected Props:
 *  - trackList: List of Objects - List of spotify song objects that also contain the fields related to removal/keep
 *  - playlistData: Object - Playlist data from spotify
 *  - bearerToken: String - Spotify user bearer token
 */
export default function ConfirmationModal(props) {
  const playlistData = props.playlistData
  const bearer_token = props.bearerToken
  const [trackList, setTrackList] = useState(props.trackList);
  const [removeList, setRemoveList] = useState([]);
  const [keepList, setKeepList] = useState([]);
  const [finalPlaytime, setFinalPlaytime] = useState(0);
  // Handle loading state
  const [loading, setLoading] = useState(false);
  const [requestComplete, setRequestComplete] = useState(false)
  // Modal Control
  const {onOpenChange} = useDisclosure();
  // Redirection
  const { push } = useRouter();

  // Generate lists when trackList changes
  useEffect(() => {
    // Only do this sort if the modal is open
    if(props.isOpen == true) {
      let tempKeep: any = []
      let tempRemove: any = []
      let tempPlaytime = 0
      trackList.map((track, index) => {
        track['playlist_index'] = index
        if(track['USER_CHOICE'] == "KEEP") {
          tempKeep.push(track)
          tempPlaytime += track['track']['duration_ms']
        } else {
          tempRemove.push(track)
        }
      })
      setKeepList(tempKeep)
      setRemoveList(tempRemove)
      setFinalPlaytime(tempPlaytime)
    }
  }, [trackList])


  const trackToGrid = (track, index) => {
    const keep = (track['USER_CHOICE'] == "KEEP")

    const trackHtml = () => {
      let trackData = track['track']
      let albumData = trackData['album']
      let artistData = trackData['artists'][0]

      return (
        <div 
          className={`flex w-full p-1 rounded-lg ${(track['USER_CHOICE']) ? ((track['USER_CHOICE'] == "KEEP") ? "bg-green-400/30" : "bg-red-400/30") : ""}`}
          key={`${track['playlist_index']}-nonskeleton`}
        >
          <div className={`size-[50px] sm:mr-1 flex-shrink-0`}>
            <img 
              src={albumData['images'][0]['url']}
              className='rounded-lg w-full h-full'
              alt={`test`}
            />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm line-clamp-1">{trackData['name']}</p>
            <p className="text-xs">{artistData['name']}</p>
          </div>
        </div>
      )
    }
    const trackHtmlSkeleton = () => {
      return (
        <Skeleton 
          key={track['playlist_index']}
          className="rounded-xl"
        >
          {trackHtml()}
        </Skeleton>
      )
    }

    return (
      <div 
        className="grid grid-cols-[45%_10%_45%] mb-1"
        key={`${index}-row`}
      >
        {/* Remove List Item */}
        <div>
          {(keep) ? (trackHtmlSkeleton()) : (trackHtml())}
        </div>
        {/* Action Button */}
        <Button
          className="flex m-auto text-2xl py-2 size-fit"
          radius="full"
          isIconOnly
          color={(keep) ? ("danger") : ("success")}
          isDisabled={requestComplete}
          onPress={() => {
            const newTrackList = [...trackList]
            newTrackList[track['playlist_index']]['USER_CHOICE'] = ((keep) ? ("REMOVE") : ("KEEP"))
            setTrackList(newTrackList)
          }}
        >
          {(keep) ? (<RiSubtractFill />) : (<RiAddFill />)}
        </Button>
        {/* Keep List Item */}
        <div>
          {(keep) ? (trackHtml()) : (trackHtmlSkeleton())}
        </div>
      </div>
    )
  }

  const handleSubmitButton = () => {
    const makeRequest = async () => {
      const chunkSize = 100;
      for (let i = 0; i < removeList.length; i += chunkSize) {
        const chunk = removeList.slice(i, i + chunkSize);
        const reqBody = {
          "playlist_id": playlistData['id'],
          "trackURIs": chunk.map((track) => ({ "uri": track['track']['uri'] })),
          "snapshot_id": playlistData['snapshot_id'],
        }
        const deleteRes = await fetch('/dashboard/grooveselect/api/submit-playlist-changes', {
          method: "POST",
          credentials: "include",
          cache: 'no-cache',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${bearer_token}`,
          },
          body: JSON.stringify(reqBody)
        });
      }
      setLoading(false)
      setRequestComplete(true)
    }
    setLoading(true)
    makeRequest()
  }

  // Final Return Statement 
  return (
    <>
      <Modal 
        isOpen={props.isOpen} 
        onOpenChange={onOpenChange}
        size="5xl"
        scrollBehavior="inside"
        isKeyboardDismissDisabled={true}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Confirm Changes to: {`"${playlistData['name']}"`}
              </ModalHeader>
              <ModalBody>
                {(loading) ? (
                  <Spinner />
                ):(
                  <div className="flex flex-col gap-2">
                    {/* Playlist Stats */}
                    <div className="text-sm">
                      <p className="text-base">Please confirm your changes here, once you click the proceed button the changes will be made to your playlist. Please note that if you havent deleted any songs or made any changes, you will be unable to submit.</p>
                      <p>Total Songs to Remove: {removeList.length}</p>
                      <p>Total Songs In Final Playlist: {keepList.length}</p>
                      <p>Length of Final Playlist: {Math.floor(finalPlaytime/(60 * 60 * 1000)).toFixed(0)}h {Math.floor(finalPlaytime/1000/60%60).toFixed(0)}m {(finalPlaytime/1000%60).toFixed(0).padStart(2, "0")}s</p>
                    </div>
                    <Conditional showWhen={requestComplete}>
                      <Alert color="success" title="Your request has been processed. Please check Spotify! You can click start over to work on a new playlist." />
                    </Conditional>
                    {/* Removal and Keep Lists */}
                    <div className="w-full">
                      <div className="grid grid-cols-[45%_10%_45%] text-xl">
                        <p className="mx-auto">{(requestComplete) ? "Removed" : "Removing"}</p>
                        <p></p>
                        <p className="mx-auto">{(requestComplete) ? "Kept" : "Keeping"}</p>
                      </div>
                      {trackList.map((track, index) => {
                        return (
                          trackToGrid(track, index)
                        )
                      })}
                    </div>
                  </div>
                )}
              </ModalBody>
              <ModalFooter className="w-full flex justify-between">
                <Button color="danger" variant="light" onPress={() => push("/dashboard/grooveselect")}>
                  Start Over
                </Button>
                <Button 
                  color="primary" 
                  onPress={handleSubmitButton}
                  isDisabled={(removeList.length == 0) || (requestComplete)}
                >
                  Submit
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}