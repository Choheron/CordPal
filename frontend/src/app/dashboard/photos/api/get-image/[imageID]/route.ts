import { NextRequest, NextResponse } from 'next/server'
import redis from '@/app/lib/caches'

export async function GET(
  request: NextRequest,
  { params } : { params: Promise<{ imageID: string }> }
) {
  const { imageID } = await params

  if (!imageID) {
    return NextResponse.json({ error: 'Missing Image ID' }, { status: 400 })
  }

  const cacheKey = `photoshop-${imageID}`
  const cached = await redis.getBuffer(cacheKey)

  if (cached) {
    console.log(`Photoshop cache hit for ID: ${imageID}`)
    // @ts-expect-error
    return new NextResponse(cached, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  }
  console.log(`Photoshop cache MISS for mbid: ${imageID}`)

  let imageUrl = ""
  if(imageID == "null") {
    // If no imageID is provided, get a placemonkey image 
    imageUrl = `https://placehold.co/300x300/transparent/FOO?text=No+AOTD`
  } else {
    imageUrl = `${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/photos/image/${imageID}`
  }

  try {
    let result = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'CordPal/0.0.1 (www.cordpal.app)',
      },
    })

    if (!result.ok) {
      return NextResponse.json({ error: 'Failed to fetch photoshop image' }, { status: 502 })
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
    console.warn(`Failed to fetch photoshop image for ID: ${imageID}, using fallback`)

    try {
      const fallbackRes = await fetch("https://placehold.co/300x300/transparent/FOO?text=Photoshop+Fetch+Error")

      if (!fallbackRes.ok) {
        return NextResponse.json({ error: 'Fallback image not found' }, { status: 404 })
      }

      const fallbackBuffer = Buffer.from(await fallbackRes.arrayBuffer())
      // Cache for 1 day (As a real photoshop couldnt be found)
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
      return NextResponse.json({ error: 'Unable to fetch photoshop or fallback' }, { status: 500 })
    }
  }
}