'use client'

// URL params used by this page (all optional):
//   title      — album title filter text
//   artist     — artist name filter text
//   submitter  — discord_id of the selected submitter; single value, matched exactly
//   aotd       — "1" to show only albums that have been Album Of the Day
//   sort       — active sort column and direction, formatted as "column:direction"
//                  e.g. sort=rating:descending  (default when absent)
//                  valid columns: title | artist | submitter | submission_date | standard_deviation | rating | last_aotd
//   page       — current page number (default 1); reset to 1 on any filter or sort change

import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell
} from "@heroui/table";
import { Avatar } from "@heroui/avatar";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";
import { Input } from "@heroui/input";
import { Checkbox } from "@heroui/checkbox";
import { Pagination } from "@heroui/pagination";

import React from "react";
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { convertToLocalTZString, ratingToTailwindBgColor } from "@/app/lib/utils";
import Link from "next/link";
import { Conditional } from "@/app/ui/dashboard/conditional";
import ClientTimestamp from "@/app/ui/general/client_timestamp";
import UserDropdown from "@/app/ui/general/userUiItems/user_dropdown";
import PageTitle from "@/app/ui/dashboard/page_title";


const sortAlbumList = (list: any[], descriptor: any) => {
  if (!descriptor?.column) return list
  return [...list].sort((a, b) => {
    switch (descriptor.column) {
      case 'rating':
        return descriptor.direction === "ascending" ? a['rating'] - b['rating'] : b['rating'] - a['rating']
      case 'standard_deviation':
        return descriptor.direction === "ascending"
          ? a['standard_deviation'] - b['standard_deviation']
          : b['standard_deviation'] - a['standard_deviation']
      case 'submission_date': {
        const dA: any = new Date(a['submission_date'])
        const dB: any = new Date(b['submission_date'])
        return descriptor.direction === "ascending" ? dA - dB : dB - dA
      }
      case 'submitter':
        return descriptor.direction === "ascending"
          ? (a['submitter_nickname'] < b['submitter_nickname'] ? 1 : -1)
          : (a['submitter_nickname'] > b['submitter_nickname'] ? 1 : -1)
      case 'artist':
        return descriptor.direction === "ascending"
          ? (a['artist']['name'] < b['artist']['name'] ? 1 : -1)
          : (a['artist']['name'] > b['artist']['name'] ? 1 : -1)
      case 'title':
        return descriptor.direction === "ascending"
          ? (a['title'] < b['title'] ? 1 : -1)
          : (a['title'] > b['title'] ? 1 : -1)
      case 'last_aotd':
        return descriptor.direction === "ascending"
          ? (a['last_aotd'] < b['last_aotd'] ? 1 : -1)
          : (a['last_aotd'] > b['last_aotd'] ? 1 : -1)
      default: return 0
    }
  })
}


const columns = [
  { key: "title",             label: "ALBUM",          sortable: true },
  { key: "artist",            label: "ARTIST",         sortable: true },
  { key: "submitter",         label: "SUBMITTER",      sortable: true },
  { key: "submission_date",   label: "SUBMITTED ON",   sortable: true },
  { key: "standard_deviation",label: "STDDEV",         sortable: true },
  { key: "rating",            label: "RATING (IF AVAIL)", sortable: true },
  { key: "last_aotd",         label: "LAST AOD",       sortable: true },
]


interface Props {
  albums: any[]
  timestamp: string
}

export default function AlbumsClient({ albums, timestamp }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = React.useTransition()
  const rowsPerPage = 50

  // Derived from URL params
  const urlTitle = searchParams.get('title') ?? ''
  const urlArtist = searchParams.get('artist') ?? ''
  const urlSubmitter = searchParams.get('submitter') ?? ''
  const aotdFilter = searchParams.get('aotd') === '1'
  const page = Number(searchParams.get('page') ?? '1')
  // Stored as "column:direction" in the URL; defaults to rating desc when absent
  const sortDescriptor: any = React.useMemo(() => {
    const s = searchParams.get('sort')
    if (!s) return { column: "rating", direction: "descending" }
    const [column, direction] = s.split(':')
    return { column, direction: direction as "ascending" | "descending" }
  }, [searchParams])
  // UserDropdown expects selectedKeys as a Set
  const submitterFilter = React.useMemo(
    () => new Set(urlSubmitter ? [urlSubmitter] : []),
    [urlSubmitter]
  )

  // Local state for text inputs — gives immediate feedback while URL update is debounced
  const [titleInput, setTitleInput] = React.useState(urlTitle)
  const [artistInput, setArtistInput] = React.useState(urlArtist)

  // Merges updates into the current URL params and pushes a new history entry,
  // so each filter change is reachable via the browser back button. Pass null to remove a param.
  const updateParams = React.useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === '') params.delete(key)
      else params.set(key, value)
    }
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }, [searchParams, router, pathname])

  // Debounce text inputs → URL (300ms)
  React.useEffect(() => {
    if (titleInput === urlTitle) return
    const t = setTimeout(() => updateParams({ title: titleInput, page: null }), 300)
    return () => clearTimeout(t)
  }, [titleInput, urlTitle, updateParams])

  // Debounce artist input → URL (300ms)
  React.useEffect(() => {
    if (artistInput === urlArtist) return
    const t = setTimeout(() => updateParams({ artist: artistInput, page: null }), 300)
    return () => clearTimeout(t)
  }, [artistInput, urlArtist, updateParams])

  // Sync local text state back when URL changes (back/forward navigation)
  React.useEffect(() => setTitleInput(urlTitle), [urlTitle])
  React.useEffect(() => setArtistInput(urlArtist), [urlArtist])

  const displayedAlbumList = React.useMemo(() => {
    let list = albums
    if (urlTitle) list = list.filter(a => (a['title'] as string).toLowerCase().includes(urlTitle.toLowerCase()))
    if (urlArtist) list = list.filter(a => (a['artist']['name'] as string).toLowerCase().includes(urlArtist.toLowerCase()))
    if (submitterFilter.size) list = list.filter(a => (a['submitter'] as string) === [...submitterFilter][0]) // spread, not Object.values() — plain Sets aren't enumerable as object properties
    if (aotdFilter) list = list.filter(a => a['last_aotd'] != null && a['rating'] != null)
    return sortAlbumList(list, sortDescriptor)
  }, [albums, urlTitle, urlArtist, submitterFilter, aotdFilter, sortDescriptor])

  const totalPages = Math.max(1, Math.ceil(displayedAlbumList.length / rowsPerPage))
  const paginatedAlbumList = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage
    return displayedAlbumList.slice(start, start + rowsPerPage)
  }, [displayedAlbumList, page, rowsPerPage])

  const handleSortChange = (descriptor) => {
    updateParams({ sort: `${descriptor.column}:${descriptor.direction}`, page: null })
  }

  // Invalidate the server cache then re-run the server component with fresh data
  const hardRefresh = async () => {
    await fetch('/dashboard/aotd/api/revalidateAOtD', { method: 'POST' })
    startTransition(() => router.refresh())
  }

  const renderCell = React.useCallback((album: any, columnKey: React.Key) => {
    switch (columnKey) {
      case "title":
        return (
          <div className="w-fit lg:w-[300px]">
            <Link href={"/dashboard/aotd/album/" + album['album_id']} prefetch={false}>
              <Button
                radius="sm"
                className="relative min-w-0 w-fit lg:w-full justify-start h-fit px-0 hover:underline text-white lg:py-1"
                variant="light"
              >
                <Avatar
                  src={`/dashboard/aotd/api/album-cover/${album['album_id']}`}
                  className="my-auto shrink-0 size-10 md:size-10"
                  radius="sm"
                />
                <p className="w-fit text-lg hover:underline max-w-lg text-ellipsis hidden md:block">
                  {album['title']}
                </p>
              </Button>
            </Link>
          </div>
        )
      case "artist":
        return (
          <div className="w-fit lg:w-[150px]">
            <a href={album['artist']['href']} target="_noreferrer" className="w-fit text-md my-auto hover:underline text-xs md:text-sm">
              {album['artist']['name']}
            </a>
          </div>
        )
      case "submitter":
        return (
          <div className="flex w-fit gap-2">
            <Avatar src={`${album['submitter_avatar_url']}`} />
            <p className="my-auto hidden md:block">{album['submitter_nickname']}</p>
          </div>
        )
      case "submission_date":
        return (
          <div className="my-auto text-center">
            <ClientTimestamp timestamp={album['submission_date']} />
          </div>
        )
      case "rating":
        return (
          (album['rating'] != null) ?
            <div className="px-2 py-2">
              <p className={`text-center text-black ${ratingToTailwindBgColor(album['rating'])} rounded-full`}>
                <b>{album['rating'].toFixed(2)}</b>
              </p>
            </div>
            :
            <p className="text-center">--</p>
        )
      case "standard_deviation":
        return (
          (album['standard_deviation'] != null) ?
            <div className="px-auto w-full">
              <p className="text-center text-white text-lg">
                <b>{album['standard_deviation'].toFixed(2)}</b>
              </p>
            </div>
            :
            <p className="text-center">--</p>
        )
      case "last_aotd":
        const dateArr = ((album['last_aotd'] != null) ? album['last_aotd'].split("-") : null)
        return (
          (album['last_aotd'] != null) ? (
            <Link href={`/dashboard/aotd/calendar/${dateArr[0]}/${dateArr[1]}/${dateArr[2]}`} prefetch={false}>
              <Button radius="lg" className="w-full mx-auto hover:underline text-white" variant="solid">
                <b>{album['last_aotd']}</b>
              </Button>
            </Link>
          ) : (
            <></>
          )
        )
    }
  }, [])


  return (
    <>
      <PageTitle text={`Album Data for ${(displayedAlbumList.length === albums.length) ? "all" : ""} ${isPending ? "LOADING" : displayedAlbumList.length} Albums`} />
      <div>
        <div className="flex flex-col sm:flex-row gap-1 w-full md:w-3/4 mx-auto">
          <Input label="Title" placeholder="Filter by Title" value={titleInput} onValueChange={setTitleInput} />
          <Input label="Artist" placeholder="Filter by Artist" value={artistInput} onValueChange={setArtistInput} />
          <UserDropdown label="Submitter" setSelectionCallback={(s: Set<any>) => updateParams({ submitter: [...s][0] ?? null, page: null })} selectedKeys={submitterFilter} />
        </div>
        <div className="w-full md:w-3/4 mx-auto my-1">
          <Checkbox isSelected={aotdFilter} onValueChange={(v) => updateParams({ aotd: v ? '1' : null, page: null })} className="w-full ml-1">
            Only Show Albums that have been Album Of the Day
          </Checkbox>
        </div>
        <div>
          <div className="flex w-full md:w-3/4 mx-auto justify-between my-1">
            <p className="mt-auto">
              Data Last Updated: {convertToLocalTZString(new Date(timestamp), true)}
            </p>
            <div className="flex">
              <Button color="primary" variant="solid" className="mr-2 mt-auto" isDisabled={isPending} onPress={hardRefresh}>
                <Conditional showWhen={!isPending}>Hard Refresh</Conditional>
                <Conditional showWhen={isPending}><Spinner color="warning" /></Conditional>
              </Button>
            </div>
          </div>
        </div>
        {/* Mobile: Card list */}
        <div className="md:hidden flex flex-col gap-2 w-full mt-2">
          {isPending ? (
            <div className="flex flex-col items-center py-8 gap-2">
              <Spinner />
              <p>Loading...</p>
            </div>
          ) : paginatedAlbumList.length === 0 ? (
            <p className="text-center py-8">No Data Available...</p>
          ) : (
            paginatedAlbumList.map((album: any) => (
              <Link key={album['album_id']} href={`/dashboard/aotd/album/${album['album_id']}`} prefetch={false}>
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-zinc-800/30 border border-neutral-800 active:bg-zinc-700/30">
                  <Avatar src={`/dashboard/aotd/api/album-cover/${album['album_id']}`} radius="sm" className="shrink-0 size-14" />
                  <div className="flex flex-col flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{album['title']}</p>
                    <p className="text-xs text-gray-400 truncate">{album['artist']['name']}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Avatar src={album['submitter_avatar_url']} className="size-5 shrink-0" />
                      <p className="text-xs text-gray-400 truncate">{album['submitter_nickname']}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {album['rating'] != null ? (
                      <span className={`px-2 py-0.5 text-xs rounded-full text-black font-bold ${ratingToTailwindBgColor(album['rating'])}`}>
                        {album['rating'].toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500">--</span>
                    )}
                    {album['last_aotd'] && (
                      <span className="text-xs text-gray-500">{album['last_aotd']}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
        {/* Desktop: Table */}
        <div className="hidden md:block">
          <Table
            aria-label="Album Submissions"
            sortDescriptor={sortDescriptor}
            onSortChange={handleSortChange}
            isStriped
            className="max-w-full md:w-3/4 mx-auto"
          >
            <TableHeader columns={columns}>
              {(column) =>
                <TableColumn key={column.key} allowsSorting={column.sortable} className="w-fit text-center">{column.label}</TableColumn>
              }
            </TableHeader>
            <TableBody
              items={paginatedAlbumList}
              emptyContent={
                isPending ?
                  <div><Spinner /><p>Loading...</p></div>
                  :
                  <p>No Data Available...</p>
              }
            >
              {(item: any) => (
                <TableRow key={`${item['album_id']} - ${item['title']} - ${item['artist']['name']} - ${item['submitter_nickname']}`}>
                  {(columnKey) => <TableCell className="min-w-0 md:w-fit">{renderCell(item, columnKey)}</TableCell>}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {totalPages > 1 && (
          <div className="flex justify-center mt-4 pb-4">
            <Pagination
              total={totalPages}
              page={page}
              onChange={(p) => updateParams({ page: String(p) })}
              color="primary"
            />
          </div>
        )}
      </div>
    </>
  )
}
