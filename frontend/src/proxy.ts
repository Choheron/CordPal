import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyAuth, isMember } from './app/lib/discord_utils';

// Pages reachable without guild membership
const nonUserPages = ["/dashboard", "/dashboard/about", "/"];

function checkNonUserAccess(request: NextRequest) {
  return nonUserPages.indexOf(request.nextUrl.pathname) !== -1;
}

export async function proxy(request: NextRequest) {
  // X-Heartbeat / X-Member-Check are internal calls that must bypass auth to avoid redirect loops
  if(request.headers.get("X-Heartbeat") || request.headers.get("X-Member-Check")) {
    return NextResponse.next();
  }

  // Start both in parallel — layout needs isMember on all dashboard routes regardless
  const authPromise = verifyAuth();
  const memberPromise = isMember();

  let authorized: any;
  try {
    authorized = await authPromise;
  } catch {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if(authorized.valid !== true) {
    const reason = authorized.reason ?? '';
    return NextResponse.redirect(new URL(`/?redirect=${reason}`, request.url));
  }

  let memberStatus: boolean;
  try {
    memberStatus = await memberPromise;
  } catch {
    memberStatus = false;
  }

  // Gate pages that require guild membership
  if(!checkNonUserAccess(request) && !memberStatus) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Pass membership result downstream so layout/page don't re-fetch
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-is-member', String(memberStatus));

  return NextResponse.next({
    request: { headers: requestHeaders }
  });
}

export const config = {
  matcher: [
    '/dashboard/((?!.*\\/api\\/).*)',   // /dashboard/* but NOT /dashboard/*/api/*
    '/dashboard',                       // exact /dashboard
  ],
}
