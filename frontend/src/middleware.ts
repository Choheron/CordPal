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
  // Check if user is a member of the server, if not, redirect to homepage (As a way of ensuring no one mantually enters a url)
  // NOTE: This should run only if on a page that isnt publically accessible
  console.log("MIDDLEWARE: Checking if user is allowed to access this page...")
  if((!checkNonUserAccess(request)) && (!await isMember())) {
    console.log("MIDDLEWARE: User is not a member of the server... redirecting.")
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  return NextResponse.next();
}
 
// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/dashboard/'],
}