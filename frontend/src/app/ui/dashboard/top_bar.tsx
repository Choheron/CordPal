"use client";

import Link from "next/link";
import { Conditional } from "./conditional";
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

// Expected props:
//  - isMember: Boolean indicating if the current session user is a member of the desired server
export default function TopBar(props) {
  const pathname = usePathname();

  // Map of links to display in the side navigation.
  // This should be moved to a database once it reaches a certian size
  const links = [
    { name: 'Home', href: '/dashboard', conditional: true },
    { name: 'Photoshops', href: '/dashboard/photos', conditional: props['isMember'] },
    { name: 'Quotes', href: '/dashboard/quotes?sortMethod=count', conditional: props['isMember'] },
    { name: 'Todo List', href: '/dashboard/todo', conditional: props['isMember'] },
    { name: 'About', href: '/dashboard/about', conditional: true },
  ];

  return (
    <div className="flex flex-col items-center justify-between p-24 pb-10">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed lg:static left-0 top-0 flex w-full justify-center pb-6 pt-8 backdrop-blur-2xl border-neutral-800 bg-zinc-800/30 from-inherit lg:w-auto lg:rounded-xl lg:border lg:p-4">
          Welcome {props.userInfo['global_name']}!
        </p>
        <div className="fixed bottom-0 left-0 flex-col h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:size-auto lg:bg-none">
          <Link 
            href="/logout"
            className="fixed lg:static left-0 top-0 flex w-full justify-center pb-6 pt-8 backdrop-blur-2xl border-neutral-800 bg-zinc-800/30 from-inherit lg:w-auto lg:rounded-xl lg:border lg:p-4"
          >
            Logout
          </Link>
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
              <Conditional 
                key={index}
                showWhen={link.conditional}
              >
                <Link 
                  key={index}
                  href={link.href}
                  className={clsx("px-8 py-1 text-center",
                    {'text-decoration-line: underline bg-gradient-to-r from-neutral-900/0 via-neutral-900 to-neutral-900/0': pathname === link.href})}
                >
                  {link.name}
                </Link>
              </Conditional>
            );
          })
        }
      </div>
    </div>
  );
}