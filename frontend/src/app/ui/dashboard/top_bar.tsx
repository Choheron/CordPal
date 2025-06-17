"use client";

import { Conditional } from "./conditional";
import { usePathname } from 'next/navigation';
import {User} from "@heroui/user";

import clsx from 'clsx';

import SettingsModal from "./settings_modal";
import { Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Link } from "@heroui/react";
import { useState } from "react";
import { RiAlbumLine, RiHome2Line, RiImageLine, RiInformationLine, RiMusic2Line, RiQuillPenLine, RiSettings3Line } from "react-icons/ri";
import Image from 'next/image'

// Expected props:
//  - isMember: Boolean indicating if the current session user is a member of the desired server
//  - userInfo: JSON Containing user information
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
    { name: 'Quotes', href: '/dashboard/quotes', conditional: props['isMember'], disabled: false, icon: <RiQuillPenLine /> },
    { name: 'Album Of the Day', href: '/dashboard/aotd', conditional: props['isMember'], disabled: false, icon: <RiAlbumLine /> },
    { name: 'Functionality Requests', href: '/dashboard/fr', conditional: props['isMember'], disabled: true, icon: <RiSettings3Line /> },
    { name: 'About', href: '/dashboard/about', conditional: true, disabled: false, icon: <RiInformationLine /> },
  ];


  const userActionsDropdown = () => {
    return (
      <Dropdown>
        <DropdownTrigger>
          {/* User Settings Modal and Profile Display */}
          <User
            as="button"
            className="fixed lg:absolute top-4 right-4 z-10 w-auto ml-5 pt-5 px-2 lg:pt-0"
            name={props.userInfo['nickname']}
            avatarProps={{
              isBordered: true,
              src: props.avatarURL
            }}
          />
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
    <div className="relative flex flex-col items-center justify-between max-w-full sm:px-0 pt-20 sm:pt-0 pb-0">
      <div className="hidden lg:flex flex-col w-full max-w-full">
        <div className="relative w-[222px] h-[41px] 2xl:w-[444px] 2xl:h-[82px] ml-1 mt-1">
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
      <div className="z-10 w-full max-w-full h-fit items-center justify-between font-mono text-sm flex flex-col lg:flex-row">
        <SettingsModal 
          userInfo={props.userInfo}
          avatarURL={props.avatarURL}
          linkedAccounts={props.linkedAccounts}
          userLoginMethods={props.userLoginMethods}
          isOpenOverride={settingsOpen}
          setIsOpenOverride={setSettingsOpen}
        />
        {/* Navigation Pages */}
        <div className="w-full max-w-full h-full my-auto items-center justify-center font-mono text-sm flex flex-col lg:flex-row lg:pt-0 2xl:absolute 2xl:top-1">
          {links.map((link, index) => {
              return(
                <Conditional 
                  key={index}
                  showWhen={link.conditional}
                >
                  <div 
                    className={clsx("flex gap-1 px-4 py-1 my-auto text-center rounded-full text-white",
                      {'text-decoration-line: underline bg-gradient-to-r from-neutral-900/0 via-neutral-900 to-neutral-900/0': pathname === link.href},
                      {'line-through': link.disabled})}
                  >
                    <div className="text-xl">
                      {link.icon}
                    </div>
                    <Link 
                      key={index}
                      href={link.href}
                      isDisabled={link.disabled}
                      size="sm"
                      className="text-center rounded-full text-white"
                    >
                      {link.name}
                    </Link>
                  </div>
                </Conditional>
              );
            })
          }
        </div>
      </div>
      {userActionsDropdown()}
    </div>
  );
}