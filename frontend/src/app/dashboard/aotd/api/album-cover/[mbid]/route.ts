import { getAlbum } from '@/app/lib/aotd_utils'
import { NextRequest, NextResponse } from 'next/server'

import redis from '@/app/lib/caches'
import fs from 'fs/promises';
import path from 'path';


export async function GET(
  request: NextRequest,
  { params } : { params: Promise<{ mbid: string }> }
) {
  const { mbid } = await params;


  if (!mbid) {
    return NextResponse.json({ error: 'Missing MBID' }, { status: 400 })
  }

  const cacheKey = `cover-${mbid}`
  const cached = await redis.getBuffer(cacheKey)

  if (cached) {
    console.log(`Cover art cache hit for mbid: ${mbid}`)
    // @ts-expect-error
    return new NextResponse(cached, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  }
  console.log(`Cover art cache MISS for mbid: ${mbid}`)
  console.log("MBID VALUE:", mbid);


  let imageUrl = ""
  
  if (!mbid || mbid === "null" || mbid === "undefined") {
    // If not album art is provided, get the placeholder SVG 
    const svgPath = path.join(process.cwd(), 'public', 'svgs', 'aotd', 'NoAlbum.svg');
    const svgContent = await fs.readFile(svgPath);
    const svgBuffer = Buffer.from(svgContent)

    return new NextResponse(svgBuffer ,{
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=86400',
        'X-Fallback': 'true',
      },
    })
  } else {
    // Continue with normal process if the mbid is not null
    let release_group_mbid = ""
    try {
      // Check if this is a call for a backend album
      const albumData = await getAlbum(mbid)
      release_group_mbid = JSON.parse(albumData['release_group'])['id']
    } catch {
      // In the event that this album doesnt exist in the backend just make a direct call with the passed in MBID
      // (Most of the time this is due to the request being for album searching)
      release_group_mbid = mbid
    }
    imageUrl = `https://coverartarchive.org/release-group/${release_group_mbid}/front-500.jpg`
  }

  try {
    let result = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'CordPal/0.0.1 (www.cordpal.app)',
      },
    })

    if (result.status === 404) {
      result = await fetch(`https://coverartarchive.org/release/${mbid}/front`, {
        headers: {
          'User-Agent': 'CordPal/0.0.1 (www.cordpal.app)',
        },
      })
    }

    if (!result.ok) {
      return NextResponse.json({ error: 'Failed to fetch album art' }, { status: 502 })
    }

    const arrayBuffer = await result.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Cache for 30 days
    await redis.set(cacheKey, buffer, 'EX', 60 * 60 * 24 * 30)

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': result.headers.get('Content-Type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (error) {
    console.warn(`Failed to fetch CAA image for ${mbid}, using fallback`)

    try {
      const fallbackRes = await fetch("https://placehold.co/300x300/transparent/FOO?text=Cover+Not+Found")

      if (!fallbackRes.ok) {
        return NextResponse.json({ error: 'Fallback image not found' }, { status: 404 })
      }

      const fallbackBuffer = Buffer.from(await fallbackRes.arrayBuffer())
      // Cache for 1 day (As a real album cover couldnt be found)
      await redis.set(cacheKey, fallbackBuffer, 'EX', 60 * 60 * 24)

      return new NextResponse(fallbackBuffer, {
        status: 200,
        headers: {
          'Content-Type': fallbackRes.headers.get('Content-Type') || 'image/jpeg',
          'Cache-Control': 'public, max-age=86400',
          'X-Fallback': 'true',
        },
      })
    } catch (fallbackError) {
      console.error('Failed to fetch fallback image:', fallbackError)
      return NextResponse.json({ error: 'Unable to fetch album art or fallback' }, { status: 500 })
    }
  }
}