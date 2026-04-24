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

  // Verify the session cookie is present and the Discord token is still valid
  let authorized: Awaited<ReturnType<typeof verifyAuth>>;
  try {
    authorized = await verifyAuth();
  } catch {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if(authorized !== true) {
    const reason = authorized.reason ?? '';
    return NextResponse.redirect(new URL(`/?redirect=${reason}`, request.url));
  }

  if(checkNonUserAccess(request)) {
    return NextResponse.next();
  }

  // Gate pages that require guild membership
  if(!(await isMember())) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/((?!.*\\/api\\/).*)',  // /dashboard/* but NOT /dashboard/*/api/*
    '/dashboard',                       // exact /dashboard
  ],
}
