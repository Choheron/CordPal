import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyAuth, isMember } from './app/lib/discord_utils';

// Pages reachable without guild membership
const nonUserPages = ["/dashboard", "/dashboard/about", "/"];

// Link-preview crawlers (Discord etc.) get rewritten to a public embed route instead of the auth redirect
const linkPreviewBots = /discordbot|slackbot|twitterbot|telegrambot|whatsapp|facebookexternalhit/i;
const aotdDayPage = /^\/dashboard\/aotd\/calendar\/(\d{4})\/(\d{2})\/(\d{2})\/?$/;

function checkNonUserAccess(request: NextRequest) {
  return nonUserPages.indexOf(request.nextUrl.pathname) !== -1;
}

export async function proxy(request: NextRequest) {
  // X-Heartbeat / X-Member-Check are internal calls that must bypass auth to avoid redirect loops
  if(request.headers.get("X-Heartbeat") || request.headers.get("X-Member-Check")) {
    return NextResponse.next();
  }

  // Serve link-preview crawlers a public OG-tags-only page (they have no session and would otherwise be redirected)
  if(linkPreviewBots.test(request.headers.get("user-agent") ?? "")) {
    const dayMatch = request.nextUrl.pathname.match(aotdDayPage);
    if(dayMatch) {
      return NextResponse.rewrite(new URL(`/dashboard/aotd/api/embed/${dayMatch[1]}/${dayMatch[2]}/${dayMatch[3]}`, request.url));
    }
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
