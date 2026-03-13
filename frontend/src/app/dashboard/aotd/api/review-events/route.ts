import Redis from 'ioredis'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const albumId = searchParams.get('album_id')
  if (!albumId) return new Response('Missing album_id', { status: 400 })

  const subscriber = new Redis({
    host: process.env.NEXT_PUBLIC_REDIS_CONNECTION_HOST,
    port: Number(process.env.NEXT_PUBLIC_REDIS_CONNECTION_PORT),
    // No keyPrefix — pub/sub channels are not prefixed
  })

  const namespace = process.env.NEXT_PUBLIC_REDIS_CONNECTION_PUBSUB_NAMESPACE ?? ''
  const channel = `${namespace}-aotd_review:${albumId}`

  const stream = new ReadableStream({
    start(controller) {
      subscriber.subscribe(channel, (err) => {
        if (err) controller.close()
      })
      subscriber.on('message', (_channel, message) => {
        controller.enqueue(new TextEncoder().encode(`data: ${message}\n\n`))
      })
    },
    cancel() {
      subscriber.unsubscribe()
      subscriber.disconnect()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}