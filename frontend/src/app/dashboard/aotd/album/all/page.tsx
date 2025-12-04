'use client'

import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell
} from "@heroui/table";
import { Avatar, Button, Spinner, Input, Checkbox } from "@heroui/react";
import React from "react";
import { useRouter } from 'next/navigation';
import { getAllAlbums, getAllAlbumsNoCache } from "@/app/lib/aotd_utils";
import { convertToLocalTZString, ratingToTailwindBgColor } from "@/app/lib/utils";
import Link from "next/link";
import { Conditional } from "@/app/ui/dashboard/conditional";
import ClientTimestamp from "@/app/ui/general/client_timestamp";
import UserDropdown from "@/app/ui/general/userUiItems/user_dropdown";
import PageTitle from "@/app/ui/dashboard/page_title";
import { list } from "postcss";


// Page to display a table containing all albums
export default function Page() {
  const [updateTimestamp, setUpdateTimestamp] = React.useState<any>("")
  const [albumListOriginal, setAlbumListOriginal] = React.useState([])
  const [albumList, setAlbumList] = React.useState<Object[] | null>(null)
  // Album List Loading vars
  const [listLoading, setListLoading] = React.useState(true)
  // Sorting variables
  const [sortDescriptor, setSortDescriptor] = React.useState<any>({ column: "rating", direction: "descending"})
  const [titleFilter, setTitleFilter] = React.useState("")
  const [artistFilter, setArtistFilter] = React.useState("")
  const [submitterFilter, setSubmitterFilter] = React.useState(new Set([]))
  const [aotdFilter, setAotdFilter] = React.useState(false);
  const router = useRouter();
  // Columns for Table
  const columns = [
    {
      key: "title",
      label: "ALBUM NAME",
      sortable: true,
    },
    {
      key: "artist",
      label: "ARTIST",
      sortable: true,
    },
    {
      key: "submitter",
      label: "SUBMITTER",
      sortable: true,
    },
    {
      key: "submission_date",
      label: "SUBMITTED ON",
      sortable: true,
    },
    {
      key: "rating",
      label: "RATING (IF AVAIL)",
      sortable: true,
    },
    {
      key: "last_aotd",
      label: "LAST AOD",
      sortable: true,
    },
  ];

  // Custom sorting method
  const handleSortChange = (descriptor) => {
    if(albumList == null) {
      return
    }
    setSortDescriptor(descriptor)
    switch(descriptor.column) {
      // Sort on rating
      case 'rating':
        setAlbumList(albumList.sort((a, b) => {
          if (descriptor.direction === "ascending") return a['rating'] - b['rating'];
          if (descriptor.direction === "descending") return b['rating'] - a['rating'];
          return 0;
        }))
        break;
      // Sort on Submission Date
      case 'submission_date':
        setAlbumList(albumList.sort((a, b) => {
          const dateA: any = new Date(a['submission_date']);
          const dateB: any = new Date(b['submission_date']);
          
          if (descriptor.direction === "ascending") return (dateA - dateB);
          if (descriptor.direction === "descending") return (dateB - dateA);
          return 0;
        }))
        break;
      // Sort on Submitter Nickname
      case 'submitter':
        setAlbumList(albumList.sort((a, b) => {
          if (descriptor.direction === "ascending") return ((a['submitter_nickname'] < b['submitter_nickname']) ? 1 : -1);
          if (descriptor.direction === "descending") return ((a['submitter_nickname'] > b['submitter_nickname']) ? 1 : -1);
          return 0;
        }))
        break;
      // Sort on Artist Name
      case 'artist':
        setAlbumList(albumList.sort((a, b) => {
          if (descriptor.direction === "ascending") return ((a['artist']['name'] < b['artist']['name']) ? 1 : -1);
          if (descriptor.direction === "descending") return ((a['artist']['name'] > b['artist']['name']) ? 1 : -1);
          return 0;
        }))
        break;
      // Sort on Album Title
      case 'title':
        setAlbumList(albumList.sort((a, b) => {
          if (descriptor.direction === "ascending") return ((a['title'] < b['title']) ? 1 : -1);
          if (descriptor.direction === "descending") return ((a['title'] > b['title']) ? 1 : -1);
          return 0;
        }))
        break;
      // Sort on Last Album of Day Date
      case 'last_aotd':
        setAlbumList(albumList.sort((a, b) => {
          if (descriptor.direction === "ascending") return ((a['last_aotd'] < b['last_aotd']) ? 1 : -1);
          if (descriptor.direction === "descending") return ((a['last_aotd'] > b['last_aotd']) ? 1 : -1);
          return 0;
        }))
        break;
    }
  };

  // UseEffect to pull Album Data on first mount (offloaded to client to make the page load faster)
  React.useEffect(() => {
    if(albumList == null) {
      const ingestData = async () => {
        setListLoading(true)
        let albumData = await getAllAlbums()
        setAlbumList(albumData['albums_list'].sort((a,b) => {return b['rating'] - a['rating']}))
        setAlbumListOriginal(albumData['albums_list'])
        setUpdateTimestamp(albumData['timestamp'])
        setListLoading(false)
      }
      ingestData()
    }
  }, [])

  // UseEffect for when filters change
  React.useEffect(() => {
    let newAlbumList = albumListOriginal;
    let changes = false;
    if(titleFilter != "") {
      changes = true
      newAlbumList = newAlbumList.filter(album => (album['title'] as string).toLowerCase().includes(titleFilter.toLowerCase()))
    } 
    if(artistFilter != "") {
      changes = true
      newAlbumList = newAlbumList.filter(album => (album['artist']['name'] as string).toLowerCase().includes(artistFilter.toLowerCase()))
    }
    if(submitterFilter.size != 0) {
      changes = true
      newAlbumList = newAlbumList.filter(album => (album['submitter'] as string) == (Object.values(submitterFilter)[0]))
    }
    if(aotdFilter) {
      changes = true
      newAlbumList = newAlbumList.filter(album => ((album['last_aotd'] != null) && (album['rating'] != null)))
    }
    // Set new list if there have been changes
    if(changes) {
      setAlbumList(newAlbumList)
    } else {
      setAlbumList(albumListOriginal)
    }
  }, [titleFilter, artistFilter, submitterFilter, aotdFilter])

  // Render Cell dynamically
  const renderCell = React.useCallback((album , columnKey: React.Key) => {
    // Change render based on column key
    switch (columnKey) {
      case "title":
        return (
          <div className="w-[400px]">
            <Button 
              as={Link}
              prefetch={false}
              href={"/dashboard/aotd/album/" + album['album_id']}
              radius="lg"
              className={`relative w-full max-w-full justify-start h-fit px-0 hover:underline text-white py-1`}
              variant="light"
            >
              <Avatar
                src={`/dashboard/aotd/api/album-cover/${album['album_id']}`}
                className='my-auto shrink-0'
                radius="sm"
              />
              <p className="w-fit text-lg hover:underline max-w-lg text-ellipsis">
                {album['title']}
              </p>
            </Button>
          </div>
        );
      case "artist":
        return (
          <div className="w-[100px]">
            <a href={album['artist']['href']} target="_noreferrer" className="w-fit text-md my-auto hover:underline">
              {album['artist']['name']}
            </a>
          </div>
        );
      case "submitter":
        return (
          <div className="flex gap-2">
            <Avatar
              src={`${album['submitter_avatar_url']}`}
            />
            <p className="my-auto">
              {album['submitter_nickname']}
            </p>
          </div>
        );
      case "submission_date":
        return (
          <div className="my-auto">
            <ClientTimestamp timestamp={album['submission_date']} full={true} />
          </div>
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
      case "last_aotd":
        const dateArr = ((album['last_aotd'] != null) ? album['last_aotd'].split("-") : null)
        return (
          (album['last_aotd'] != null) ? (
            <Button 
              as={Link}
              href={`/dashboard/aotd/calendar/${dateArr[0]}/${dateArr[1]}/${dateArr[2]}`}
              radius="lg"
              className={`w-full mx-auto hover:underline text-white`}
              variant="solid"
            >
              <b>{(album['last_aotd'] != null) ? album['last_aotd'] : "N/A"}</b>
            </Button> 
          ):(
            <></>
          )
        );
    }
  }, []);


  // Reset values on cancel button press
  const hardRefresh = () => {
    const ingestNewData = async () => {
      setAlbumList([])
      let albumData = await getAllAlbumsNoCache()
      setAlbumList(albumData['albums_list'])
      setUpdateTimestamp(albumData['timestamp'])
      setListLoading(false)
    }
    setListLoading(true)
    ingestNewData()
  }


  return (
    <>
      <PageTitle text={`Album Data for ${(titleFilter == "") ? "all" : ""} ${(albumList) ? albumList.length : "LOADING"} Albums`} />
      <div>
        {/* Filter Inputs */}
        <div className="flex gap-1 w-full md:w-3/4 mx-auto">
          <Input 
            label="Title" 
            placeholder="Filter by Title" 
            value={titleFilter} 
            onValueChange={setTitleFilter}
          />
          <Input 
            label="Artist" 
            placeholder="Filter by Artist" 
            value={artistFilter} 
            onValueChange={setArtistFilter}
          />
          <UserDropdown 
            label={"Submitter"}
            setSelectionCallback={setSubmitterFilter}
            selectedKeys={submitterFilter}
          />
        </div>
        <div className="w-full md:w-3/4 mx-auto my-1">
          <Checkbox 
            isSelected={aotdFilter} 
            onValueChange={setAotdFilter}
            className="w-full ml-1"
          >
            Only Show Albums that have been Album Of the Day
          </Checkbox>
        </div>
        <div>
          <div className="flex w-full md:w-3/4 mx-auto justify-between my-1">
            <p className="mt-auto">
              Data Last Updated: {(listLoading) ? " Loading..." : convertToLocalTZString(updateTimestamp, true)}
            </p>
            <div className="flex">
              <Button color="primary" variant="solid" className="mr-2 mt-auto" isDisabled={listLoading} onPress={hardRefresh}>
                <Conditional showWhen={!listLoading}>
                  Hard Refresh
                </Conditional>
                <Conditional showWhen={listLoading}>
                  <Spinner color="warning" />
                </Conditional>
              </Button>
            </div>
          </div>
        </div>
        {/* Table displaying Albums */}
        <Table 
          aria-label="Album Submissions"
          sortDescriptor={sortDescriptor}
          onSortChange={handleSortChange}
          isStriped
          className="w-full md:w-3/4 mx-auto"
        >
          <TableHeader columns={columns}>
            {(column) =>
              <TableColumn key={column.key} allowsSorting={column.sortable} className="w-fit">{column.label}</TableColumn>
            }
          </TableHeader>
          <TableBody 
            items={(albumList) ? albumList : []}
            emptyContent={(listLoading) ? 
              <div>
                <Spinner />
                <p>Loading...</p>
              </div>
              : 
              <p>No Data Available...</p> 
            }
          >
            {(item: any) => (
              <TableRow key={`${item['album_id']} - ${item['title']} - ${item['artist']['name']} - ${item['submitter_nickname']}`}>
                {(columnKey) => <TableCell className="w-fit">{renderCell(item, columnKey)}</TableCell>}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  )
}