"use client";

import { Conditional } from "./conditional";
import { usePathname } from 'next/navigation';
import {Divider} from "@heroui/divider";
import {User} from "@heroui/user";

import clsx from 'clsx';

import SettingsModal from "./settings_modal";
import Image from "next/image";
import { isDecember } from "@/app/lib/utils";
import { Link } from "@heroui/react";

// Expected props:
//  - isMember: Boolean indicating if the current session user is a member of the desired server
//  - userInfo: JSON Containing user information
//  - avatarURL: String URL of Discord User's Avatar
//  - linkedAccounts: List containing data surrounding linked accounts
export default function TopBar(props) {
  const pathname = usePathname();

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

  return (
    <div className="flex flex-col items-center justify-between max-w-full sm:px-4 lg:px-24 pt-20 lg:pt-10 pb-0">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm flex flex-col lg:flex-row">
        <div>
          {/* Santa Hat on User Avatar, because its festive :) */}
          {(isDecember()) ? 
            (
              <Image 
                src="/images/holiday_decor/santa_hat_PNG64.png"
                width={50}
                height={50}
                alt="Santa Hat on top of Avatar for User"
                className="invisible lg:visible lg:absolute z-50 -scale-x-100"
              />
            ) : (<></>)}
          <User
            className="fixed lg:static top-2.5 left-0 z-10 w-auto ml-5 lg:ml-0 py-2 px-2 backdrop-blur-2xl bg-zinc-800/30 border border-neutral-800"
            name={props.userInfo['nickname']}
            description={(
              <SettingsModal 
                userInfo={props.userInfo}
                avatarURL={props.avatarURL}
                linkedAccounts={props.linkedAccounts}
                userLoginMethods={props.userLoginMethods}
              />
            )}
            avatarProps={{
              src: props.avatarURL
            }}
          />
        </div>
        <Link 
          size="sm"
          href="/logout"
          className="z-0 fixed lg:static text-white right-0 top-0 flex w-full justify-end lg:justify-center pb-6 pt-8 pr-4 backdrop-blur-2xl border border-neutral-800 bg-zinc-800/30 lg:w-auto lg:rounded-xl lg:p-4 hover:underline"
        >
          Logout
        </Link>
      </div>
      <div className="hidden lg:flex w-full max-w-5xl">
        <a
          className="pointer-events-none w-fit place-items-center gap-2 p-8 ml-6 lg:ml-1 font-mono text-sm lg:pointer-events-auto lg:p-0"
          href="https://homelab.nanophage.win"
          target="_blank"
          rel="noopener noreferrer"
        >
          By{" "}
          Nanophage
        </a>
      </div>
      <div className="w-full max-w-5xl items-center justify-around font-mono text-sm flex flex-col lg:flex-row lg:pt-5">
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
                  className={clsx("px-8 py-1 text-center rounded-full text-white",
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
      <Divider className='mt-2 w-full lg:w-3/4' />
    </div>
  );
}