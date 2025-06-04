import { NextRequest, NextResponse } from 'next/server'
import NodeCache from 'node-cache'

// Cache for 24 hours
const cache = new NodeCache({ stdTTL: 60 * 60 * 24 }) // 24 hours in seconds

export async function GET(
  request: NextRequest,
  { params } : { params: Promise<{ mbid: string }> }
) {
  const { mbid } = await params

  if (!mbid) {
    return NextResponse.json({ error: 'Missing MBID' }, { status: 400 })
  }

  const cacheKey = `cover-${mbid}`
  const cached = cache.get<Buffer>(cacheKey)

  if (cached) {
    return new NextResponse(cached, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  }

  const imageUrl = `https://coverartarchive.org/release/${mbid}/front`

  try {
    let result = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'CordPal/0.0.1 (www.cordpal.app)',
      },
    })

    if (result.status === 404) {
      result = await fetch(`https://placehold.co/300x300?text=Album+Cover+Not+Available+in+CAA`, {
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

    // Cache the buffer
    cache.set(cacheKey, buffer)

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
      cache.set(cacheKey, fallbackBuffer)

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