'use client'

import Link from "next/link";
import { Conditional } from "./conditional";
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

export default async function TopBar(props) {
  const pathname = usePathname();

  // Map of links to display in the side navigation.
  // This should be moved to a database once it reaches a certian size
  const links = [
    { name: 'Home', href: '/dashboard'},
    { name: 'Photoshops', href: '/dashboard/photos' },
    { name: 'Quotes', href: '/dashboard/quotes' },
    { name: 'Todo List', href: '/dashboard/todo' },
  ];

  return (
    <div className="flex flex-col items-center justify-between p-24 pb-10">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          Welcome {props.userInfo['global_name']}!
        </p>
        <div className="fixed bottom-0 left-0 flex-col h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:size-auto lg:bg-none">
          <p className="flex justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
            Logout
          </p>
        </div>
      </div>
      <a
        className="pointer-events-none flex w-full max-w-5xl place-items-center gap-2 p-8 ml-16 font-mono text-sm lg:pointer-events-auto lg:p-0"
        href="https://homelab.nanophage.win"
        target="_blank"
        rel="noopener noreferrer"
      >
        By{" "}
        Nanophage
      </a>
      <div className="z-10 w-full max-w-5xl items-center justify-around font-mono text-sm lg:flex pt-5">
        {links.map((link, index) => {
            return(
              <Link 
                key={index}
                href={link.href}
                className={clsx({'text-decoration-line: underline bg-gradient-to-r from-neutral-900/0 via-neutral-900/75 to-neutral-900/0': pathname === link.href})}
              >
                {link.name}
              </Link>
            );
          })
        }
      </div>
    </div>
  );
}