import { NextRequest, NextResponse } from 'next/server'

import redis from '@/app/lib/caches'


export async function GET(
  request: NextRequest,
  { params } : { params: Promise<{ hex: string }> }
) {
  const { hex } = await params;


  if (!hex) {
    return NextResponse.json({ error: 'Missing hex' }, { status: 400 })
  }
  // Check if hex is not the right length
  if (hex.length != 32) {
    return NextResponse.json({ error: 'Hex should be a 32 character image code'}, { status: 400 })
  }

  const cacheKey = `review-image-${hex}`
  const cacheTypeKey = `review-image-${hex}-type`
  const [cached, cached_type] = await Promise.all([
    redis.getBuffer(cacheKey),
    redis.get(cacheTypeKey),
  ])

  if (cached && cached_type) {
    console.log(`ReviewImage Cache Hit for: ${hex}`)
    // @ts-expect-error
    return new NextResponse(cached, {
      status: 200,
      headers: {
        'Content-Type': cached_type,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff'
      },
    })
  }
  console.log(`ReviewImage cache MISS for hex: ${hex}`)

  // Attempt to pull image from cordpal backend if the cache is missed
  const backend_url = `${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/aotd/serveReviewImage/${hex}`
  let result = await fetch(backend_url, {
    headers: {
      'User-Agent': 'CordPal/0.0.1 (www.cordpal.app)',
    },
  })

  if (result.status === 404) {
    return NextResponse.json({ error: `ReviewImage with hex ${hex} is not found`, crid: result.headers.get('X-CRID') }, { status: 404 })
  }

  if (!result.ok) {
    return NextResponse.json({ error: 'Failed to fetch ReviewImage due to serverside error', crid: result.headers.get('X-CRID') }, { status: 502 })
  }

  const arrayBuffer = await result.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Pull content type from response
  const temp_type = result.headers.get('Content-Type')
  const content_type = (temp_type != null) ? temp_type : 'image/webp'

  // Cache for 30 days
  await redis.set(cacheKey, buffer, 'EX', 60 * 60 * 24 * 30)
  await redis.set(cacheTypeKey, content_type, 'EX', 60 * 60 * 24 * 30)

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': content_type,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff'
    },
  })
}