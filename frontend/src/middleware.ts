import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyAuth, isMember } from './app/lib/discord_utils';

// List of pages that nonusers are allowed to visit
const nonUserPages = ["/dashboard", "/dashboard/about"];

// Check if path is in allowed pages for nonusers
function checkNonUserAccess(request: NextRequest) {
  return (nonUserPages.indexOf(request.nextUrl.pathname) != -1);
}

export async function middleware(request: NextRequest) {
  console.log("MIDDLEWARE: Running for Path: " + request.nextUrl.pathname)
  // Check if user is authorized, if not, redirect to login
  if(!(await verifyAuth())) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  // If this is a heartbeat call, skip it
  if((request.headers.get("X-Heartbeat")) || (request.headers.get("X-Member-Check"))) {
    console.log("MIDDLEWARE: Skipping middleware for heartbeat or isMember call.")
    return NextResponse.next();
  }
  // If this page is an allowed page for non-member users, return
  if(checkNonUserAccess(request)) {
    return NextResponse.next();
  }
  // Check if user is a member of the server, if not, redirect to homepage (As a way of ensuring no one mantually enters a url)
  if(!(await isMember())) {
    console.log("MIDDLEWARE: User is not a member of the server... redirecting.")
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  return NextResponse.next();
}
 
// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    {
      source: '/dashboard/:page*'
    }
  ],
}