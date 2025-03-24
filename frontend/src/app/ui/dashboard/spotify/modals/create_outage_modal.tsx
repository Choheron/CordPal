'use client'

import {
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
  useDisclosure
} from "@heroui/modal";
import { Button, Divider, RangeCalendar, Spinner } from "@heroui/react";
import {
  today, 
  getLocalTimeZone, 
  parseDate, 
  DateDuration
} from "@internationalized/date";
import {Input} from "@heroui/react";
import {Textarea} from "@heroui/input";

import { Conditional } from "../../conditional";
import { useEffect, useState } from "react";
import { RiArrowRightLine, RiErrorWarningLine } from "react-icons/ri";
import { createOutage, getUserOutages } from "@/app/lib/spotify_utils";

// Modal to allow users to submit an outage
// Expected Props:
//  - 
export default function CreateOutageModal(props) {
  // Functionality States
  const minStartDate = today(getLocalTimeZone()).add({days: 3})
  const [differenceDays, setDifferenceDays] = useState(0)
  const [userOutages, setUserOutages] = useState([])
  const [outagesInterval, setOutagesInterval] = useState([])
  // UI Controls
  const [submissionError, setSubmissionError] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  // User supplied information
  const [reason, setReason] = useState("")
  let [dateRange, setDateRange] = useState({
    start: minStartDate,
    end: minStartDate.add({days: 2}),
  });
  
  // Modal control
  const {isOpen, onOpen, onOpenChange, onClose} = useDisclosure();

  // Get user outages (async to be called on update and load)
  const getOutageDates = async () => {
    const outages = await getUserOutages()

    setUserOutages(outages)
    setOutagesInterval(
      outages.map((outageObj) => {
        return [parseDate(outageObj['start_date']), parseDate(outageObj['end_date'])]
      })
    )
  }

  // useEffect to query existing outages
  useEffect(() => {
    getOutageDates()
    setLoading(false)
  }, [])

  // useEffect to determine date difference on update of provided range
  useEffect(() => {
    const startDate = dateRange.start.toDate(getLocalTimeZone())
    const endDate = dateRange.end.toDate(getLocalTimeZone())

    setDifferenceDays(Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1)
  }, [dateRange])

  // Send request to upload the submitted image
  const submitPress = async () => {
    // Toggle processing on
    setProcessing(true) 
    // Create payload to send data to backend
    const outageBody = {
      start_date: dateRange.start.toString(),
      end_date: dateRange.end.toString(),
      reason: reason,
    }
    // Make request to backend
    const responseObj = await createOutage(outageBody)
    setSubmissionError(responseObj)
    
    if((responseObj['status'] != 200)) {
      setProcessing(false)
    } else {
      // Call cancel functionality to clear systems
      cancelPress()
    }
  }

  // Reset values on cancel button press
  const cancelPress = () => {
    setDateRange({start: minStartDate, end: minStartDate.add({days: 2})})
    setProcessing(false)
    setSubmissionError(null)
    getOutageDates()

    onClose()
  }

  // Determine if dates are unavailable
  let isDateUnavailable = (date) => {
    return outagesInterval.some(
      (interval) => date.compare(interval[0]) >= 0 && date.compare(interval[1]) <= 0,
    );
  }

  const mapOutages = () => {
    return userOutages.map((outage, index) => {
      return (
        <div className="flex" key={index}>
          <p className="pr-2" >{index + 1}.</p>
          <p>{outage['start_date']}</p> 
          <RiArrowRightLine className="text-xl my-auto"/>
          <p>{outage['end_date']}</p>
        </div>
      )
    })
  }

  // Display outages already set by the user
  const displayOutages = () => {
    return (
      <div className="w-full px-2 py-2 text-small border border-neutral-800 rounded-2xl bg-zinc-800/30">
        <p>Existing Outages:</p>
        <div className="flex flex-col">
          {mapOutages()}
        </div>
      </div>
    )
  }
  
  return (
    <>
      <div className="flex flex-col lg:flex-row gap-1 justify-center w-full">
        <div className="flex">
          <Button 
            className="p-2 mt-4 mb-1 rounded-lg text-inheret min-w-0 min-h-0 h-fit bg-gradient-to-br from-green-700 to-green-800 hover:underline"
            size="lg"
            onPress={onOpen}
            radius="none"
            variant="solid"
          >
            <b>Submit an Outage</b>
          </Button>
        </div>
      </div>
      <Modal size="xl" isOpen={isOpen} isDismissable={false} onOpenChange={onOpenChange} onClose={cancelPress}>
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="mx-auto -mb-3">
                Submit a New Outage Window
              </ModalHeader>
              <ModalBody>
              <div className="flex flex-col gap-2 justify-evenly">
                <Divider />
                <div className="max-w-[320px] lg:max-w-[650px] px-2 py-2 text-small border border-neutral-800 rounded-2xl bg-zinc-800/30">
                  <p>
                    Select dates on the below calendar to submit an outage. In order to submit an outage you will need to submit it at least 3 days before the desired start date, 
                    so as to avoid abuse. During your outage period, your albums will not be available for selection, however you will still be able to review if you so choose. An outage
                    can be cancelled in your profile page.
                  </p>
                </div>
                {((submissionError) && (submissionError['status'] != 200)) ? (
                  <>
                    <Divider />
                    <div className="flex rounded-2xl bg-red-600/10 border border-red-800">
                      <div className="p-2">
                        <RiErrorWarningLine className="text-red-600 mx-auto" />
                        {submissionError['status']}
                      </div>
                      <Divider orientation="vertical" />
                      <p className="my-auto text-sm w-full px-2">
                        <b>ERROR:</b> {submissionError['message']}
                      </p>
                    </div>
                  </>
                ) : (
                  <></>
                )}
                {(userOutages.length > 0) ? (
                  <>
                    <Divider /> 
                    {displayOutages()}
                  </>
                  ) : (<></>)}
                <Divider />
                <div className="relative text-center">
                  <div className={`${(loading) ? "brightness-[0.25]" : ""}`}>
                    <RangeCalendar
                      value={dateRange} 
                      onChange={setDateRange}
                      minValue={minStartDate}
                      visibleMonths={2}
                      pageBehavior="single"
                      isDisabled={loading}
                      isDateUnavailable={isDateUnavailable}
                      classNames={{
                        base: "mx-auto w-fit border border-black",
                      }}
                    />
                  </div>
                  <Conditional showWhen={loading}>
                    <div className="absolute top-1/2 left-1/2">
                      <Spinner
                        size="lg"
                        className="-ml-7 -mt-7"
                      />
                    </div>
                  </Conditional>
                </div>
                {/* Selection Data */}
                <div className="flex flex-col px-2 font-extralight">
                  <div className="flex w-full justify-between">
                    <p>Selected Date Range:</p>
                    <div className="flex gap-2">
                      <p className="my-auto">{dateRange.start.toString()}</p>
                      <RiArrowRightLine className="text-xl my-auto"/>
                      <p className="my-auto">{dateRange.end.toString()}</p>
                    </div>
                  </div>
                  <div className="flex w-full justify-between">
                    <p>Number Of Days: </p>
                    <p>{differenceDays}</p>
                  </div>
                </div>
                <Textarea
                  label="Outage Reason"
                  minRows={1}
                  placeholder="Please provide context for the outage..."
                  value={reason}
                  onValueChange={setReason}
                  isRequired
                />
              </div>
              </ModalBody>
              <ModalFooter>
                <Button 
                  color="danger" 
                  variant="light" 
                  onPress={cancelPress}
                  isDisabled={processing}
                >
                  Cancel
                </Button>
                <Button 
                  color="primary" 
                  isDisabled={!((reason != ""))}
                  onPress={submitPress}
                >
                  {processing ? (<Spinner color="success" size="sm" />) : ("Submit Outage")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  )
}