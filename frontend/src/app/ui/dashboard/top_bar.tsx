"use client";

import { Conditional } from "./conditional";
import { usePathname } from 'next/navigation';
import {Divider} from "@heroui/divider";
import {User} from "@heroui/user";

import clsx from 'clsx';

import SettingsModal from "./settings_modal";
import Image from "next/image";
import { isDecember } from "@/app/lib/utils";
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Link } from "@heroui/react";
import { useState } from "react";

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
    { name: 'Home', href: '/dashboard', conditional: true, disabled: false },
    // { name: 'Clips', href: '/dashboard/clips', conditional: props['isMember'], disabled: false },
    { name: 'Photoshops', href: '/dashboard/photos', conditional: props['isMember'], disabled: false },
    { name: 'Quotes', href: '/dashboard/quotes', conditional: props['isMember'], disabled: false },
    { name: 'Album Of the Day (Spotify)', href: '/dashboard/spotify', conditional: props['isMember'], disabled: false },
    { name: 'Functionality Requests', href: '/dashboard/fr', conditional: props['isMember'], disabled: true },
    { name: 'About', href: '/dashboard/about', conditional: true, disabled: false },
  ];


  const userActionsDropdown = () => {
    return (
      <Dropdown>
        <DropdownTrigger>
          {/* User Settings Modal and Profile Display */}
          <User
            as="button"
            className="fixed lg:static top-2.5 left-0 z-10 w-auto ml-5 pt-5 px-2 lg:pt-0 lg:mr-10 lg:-ml-[100%]"
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
    <div className="flex flex-col items-center justify-between max-w-full sm:px-0 pt-20 lg:pt-0 pb-0">
      <div className="hidden lg:flex w-full max-w-full">
        <a
          className="pointer-events-none w-fit p-8 ml-1 lg:ml-1 font-mono text-sm lg:pointer-events-auto lg:p-0 text-gray-500 italic"
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
        <div className="w-full max-w-full h-full my-auto items-center justify-center font-mono text-sm flex flex-col lg:flex-row lg:pt-0">
          {links.map((link, index) => {
              return(
                <Conditional 
                  key={index}
                  showWhen={link.conditional}
                >
                  <Link 
                    key={index}
                    href={link.href}
                    isDisabled={link.disabled}
                    size="sm"
                    className={clsx("px-8 py-1 my-auto text-center rounded-full text-white",
                      {'text-decoration-line: underline bg-gradient-to-r from-neutral-900/0 via-neutral-900 to-neutral-900/0': pathname === link.href},
                      {'line-through': link.disabled})}
                  >
                    {link.name}
                  </Link>
                </Conditional>
              );
            })
          }
        </div>
        {userActionsDropdown()}
      </div>
    </div>
  );
}