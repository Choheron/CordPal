import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyAuth } from './app/lib/discord_utils';
 
export async function middleware(request: NextRequest) {
  console.log("Checking login");
  // Check if user is authorized, if not, redirect to login
  if(!(await verifyAuth())) {
    return NextResponse.redirect(new URL('/', request.url));
  }
}
 
// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/dashboard', '/dashboard/:path*'],
}