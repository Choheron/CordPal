// Link preview embed for AOTD calendar day pages.
// Crawlers (Discordbot etc.) have no session, so proxy.ts rewrites their requests for
// /dashboard/aotd/calendar/[year]/[month]/[day] to this route instead of redirecting to login.
// Returns a bare HTML document containing only the Open Graph tags Discord needs to build a preview
// (album title, artist, score, and cover art) — never the full page.
import { getAlbumOfTheDayData, getAlbumAvgRating } from '@/app/lib/aotd_utils'
import { NextRequest, NextResponse } from 'next/server'


//
// Escape album/artist strings for safe inclusion in meta tag attributes
//
function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

//
// Build the OG-tags-only HTML document served to crawlers
// - twitter:card "summary_large_image" makes Discord use the large image layout
// - theme-color sets the accent stripe on the embed
//
function buildHtml(title: string, description: string, imageUrl: string, pageUrl: string) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>${title}</title>
<meta property="og:site_name" content="CordPal" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description}" />
<meta property="og:image" content="${imageUrl}" />
<meta property="og:url" content="${pageUrl}" />
<meta name="twitter:card" content="summary_large_image" />
</head>
<body></body>
</html>`
}

//
// Serve link preview HTML for a given AOTD date
// - RETURN: text/html response containing only OG meta tags
//
export async function GET(
  request: NextRequest,
  { params } : { params: Promise<{ year: string, month: string, day: string }> }
) {
  const { year, month, day } = await params;
  // Declare date string
  const date = `${year}-${month}-${day}`
  // OG urls must be absolute, so point image/canonical urls at prod regardless of environment
  const origin = "https://www.cordpal.app"
  // Canonical url of the real calendar day page (what the crawler thinks it fetched)
  const pageUrl = `${origin}/dashboard/aotd/calendar/${year}/${month}/${day}`

  console.log(`Link preview embed requested for date: ${date}`)
  // Get album of the day for this date
  const albumOfTheDayObj = await getAlbumOfTheDayData(date)

  // No AOTD for this date (future date, pre-AOTD date, or malformed url) - serve a fallback embed
  if(albumOfTheDayObj['album_id'] == null) {
    const html = buildHtml(
      "Album Of the Day",
      `No album of the day found for ${date}.`,
      `${origin}/dashboard/aotd/api/album-cover/null`,
      pageUrl,
    )
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  }

  // Fetch the average rating for this date (unrounded, same as AlbumDisplay)
  const avg_rating = await getAlbumAvgRating(albumOfTheDayObj['album_id'], false, date)
  // 11 is the "no ratings" sentinel returned by getAlbumAvgRating - omit the score line in that case
  const scoreText = (avg_rating != 11 && avg_rating != null) ? `Average Rating: ${avg_rating.toFixed(2)}` : ""

  const html = buildHtml(
    escapeHtml(`${albumOfTheDayObj['title']} — ${albumOfTheDayObj['artist']['name']}`),
    escapeHtml(`Album Of the Day for ${date}&#10;${scoreText}`),
    `${origin}/dashboard/aotd/api/album-cover/${albumOfTheDayObj['album_id']}`,
    pageUrl,
  )
  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
