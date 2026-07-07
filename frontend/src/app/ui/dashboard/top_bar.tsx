"use client";

import { User } from "@heroui/user";
import { Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from "@heroui/dropdown";
import { Link } from "@heroui/link";

import { Conditional } from "./conditional";
import { usePathname } from 'next/navigation';

import clsx from 'clsx';

import SettingsModal from "./settings_modal";
import { useState } from "react";
import { RiAlbumLine, RiHome2Line, RiImageLine, RiInformationLine, RiQuillPenLine } from "react-icons/ri";
import Image from 'next/image'
import { Alert, Avatar } from "@heroui/react";

// TopBar — responsive navigation for all /dashboard pages, rendered once in dashboard/layout.tsx.
// The markup is rendered a single time and restyled per breakpoint with Tailwind `lg:` prefixes
// (no JS device detection), so mobile and desktop are the same DOM tree.
//
// Desktop (lg and up):
//   - CordPal logo + byline render top left (the logo block is `hidden lg:flex`).
//   - Nav links show icon + text label, laid out in a centered row near the top of the page
//     (at xl the row is absolutely positioned over the logo row via `xl:absolute xl:top-1`).
//   - The user chip (avatar + nickname) sits absolutely top right; its dropdown
//     (Profile / Settings / Logout) opens downward ("bottom-end").
//
// Mobile (below lg):
//   - The nav container's base classes (`fixed bottom-0 z-40 ...`) turn it into an icon-only
//     bottom tab bar: translucent blurred background, iOS safe-area padding, labels hidden.
//     Bottom placement keeps the links thumb-reachable on phones, matching native app patterns.
//   - z-40 keeps the bar above page content (which uses up to z-30) but below HeroUI
//     overlays, which portal to <body> at z-50 (modals, popovers, this bar's own dropdown).
//   - The user dropdown moves into the bar as the rightmost item: an avatar-only trigger
//     whose menu opens upward ("top-end") so it stays on screen. Both the mobile and desktop
//     triggers share one menu via userActionsDropdown(trigger, placement).
//   - Inactive page icons are dimmed (text-zinc-500) and the selected page's icon stays
//     white, since the desktop active-state gradient is invisible against the dark bar.
//
// Expected props:
//  - isMember: Boolean indicating if the current session user is a member of the desired server
//  - userInfo: JSON Containing user information
//  - aotdConnected: Boolean determining if AOTD is connected
//  - avatarURL: String URL of Discord User's Avatar
//  - linkedAccounts: List containing data surrounding linked accounts
export default function TopBar(props) {
  const pathname = usePathname();
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Map of links to display in the side navigation.
  // This should be moved to a database once it reaches a certian size
  const links = [
    { name: 'Home', href: '/dashboard', conditional: true, disabled: false, icon: <RiHome2Line /> },
    // { name: 'Clips', href: '/dashboard/clips', conditional: props['isMember'], disabled: false },
    { name: 'Photoshops', href: '/dashboard/photos', conditional: props['isMember'], disabled: false, icon: <RiImageLine /> },
    { name: 'Quotes', href: '/dashboard/quotes?sortMethod=timestamp_descending&cursive=false', conditional: props['isMember'], disabled: false, icon: <RiQuillPenLine /> },
    { name: 'Album Of the Day', href: '/dashboard/aotd', conditional: props['isMember'], disabled: false, icon: <RiAlbumLine /> },
    { name: 'About', href: '/dashboard/about', conditional: true, disabled: false, icon: <RiInformationLine /> },
  ];

  // usePathname() excludes query strings, so strip them from hrefs when matching
  const isActive = (href) => pathname === href.split('?')[0]

  const userActionsDropdown = (trigger, placement) => {
    return (
      <Dropdown placement={placement}>
        <DropdownTrigger>
          {trigger}
        </DropdownTrigger>
        <DropdownMenu 
          aria-label="Static Actions" 
          variant="flat"
        >
          <DropdownItem 
            key="profile"
            href={`/profile/${props.userInfo['discord_id']}`}
          >
            My Profile
          </DropdownItem>
          <DropdownItem 
            key="settings"
            onPress={() => {setSettingsOpen(true)}}
          >
            Settings
          </DropdownItem>
          <DropdownItem 
            key="logout" 
            className="text-danger" 
            color="danger"
            href="/logout"
          >
            Logout
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    )
  }

  return (
    <div>
      <div className="relative flex flex-col items-center justify-between max-w-full sm:px-0 pb-0">
        <div className="hidden lg:flex flex-col w-full max-w-full">
          <div className="relative w-[222px] h-[41px] 2xl:w-[333px] 2xl:h-[60px] 3xl:w-[444px] 3xl:h-[82px] ml-1 mt-1">
            <Image
              fill
              src="/svgs/logos/CordPal_Logo_Large_V1.svg"
              alt="CordPal Logo"
            />
          </div>
          <a
            className="pointer-events-none w-fit p-8 ml-1 lg:ml-1 font-mono text-sm lg:pointer-events-auto lg:p-0 text-gray-500 italic z-50"
            href="https://homelab.nanophage.win"
            target="_blank"
            rel="noopener noreferrer"
          >
            By{" "}
            Nanophage
          </a>
        </div>
        <div className="w-full max-w-full h-fit items-center justify-between font-mono text-sm flex flex-col lg:flex-row">
          <SettingsModal 
            userInfo={props.userInfo}
            aotdConnected={props.aotdConnected}
            aotdSettings={props.aotdSettings}
            avatarURL={props.avatarURL}
            linkedAccounts={props.linkedAccounts}
            userLoginMethods={props.userLoginMethods}
            isOpenOverride={settingsOpen}
            setIsOpenOverride={setSettingsOpen}
          />
          {/* Navigation Pages */}
          <div className="fixed bottom-0 left-0 z-40 w-full flex flex-row items-center justify-around bg-zinc-900/95 backdrop-blur-2xl border-t border-neutral-800 pb-[env(safe-area-inset-bottom)] font-mono text-sm lg:static lg:z-auto lg:w-full lg:max-w-full lg:h-full lg:my-auto lg:justify-center lg:bg-transparent lg:backdrop-blur-none lg:border-t-0 lg:pb-0 xl:absolute xl:top-1">
            {links.map((link, index) => {
                return(
                  <Conditional
                    key={index}
                    showWhen={link.conditional}
                  >
                    <div
                      className={clsx("flex gap-1 px-3 lg:px-4 py-2 lg:py-1 my-auto text-center rounded-full text-white",
                        {'text-decoration-line:underline bg-gradient-to-r from-neutral-900/0 via-neutral-900 to-neutral-900/0': isActive(link.href)},
                        {'line-through': link.disabled})}
                    >
                      <Link
                        key={index}
                        href={link.href}
                        isDisabled={link.disabled}
                        size="sm"
                        className="text-center rounded-full text-white"
                      >
                        <div className={clsx("text-2xl lg:text-xl lg:pr-1", isActive(link.href) ? 'text-white' : 'text-zinc-500 lg:text-white')}>
                          {link.icon}
                        </div>
                        <span className="hidden lg:inline">{link.name}</span>
                      </Link>
                    </div>
                  </Conditional>
                );
              })
            }
            {/* User avatar dropdown (mobile, in bottom bar) */}
            <div className="lg:hidden px-3 py-2">
              {userActionsDropdown(
                <Avatar
                  as="button"
                  size="sm"
                  isBordered
                  src={props.avatarURL}
                />,
                "top-end"
              )}
            </div>
          </div>
        </div>
        {/* User Settings Modal and Profile Display (desktop, top right) */}
        {userActionsDropdown(
          <User
            as="button"
            className="hidden lg:inline-flex lg:absolute top-4 right-4 z-10 w-auto ml-5 px-2"
            name={props.userInfo['nickname']}
            avatarProps={{
              isBordered: true,
              src: props.avatarURL
            }}
          />,
          "bottom-end"
        )}
      </div>
      <Conditional showWhen={props.aotdConnected && !props.aotdSettings['active_aotd']}>
        <Alert 
          color="danger" 
          title="AOTD - You are INACTIVE" 
          description="You have been marked inactive due to you having not reviewed an Album of the Day in 14 or more days. This means that your albums that have not yet been picked can be Rescued/Submitted by other users."
          className="m-2 sm:w-2/3 mx-auto"
        />
      </Conditional>
    </div>
  );
}