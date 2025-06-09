import NodeCache from 'node-cache'
import Redis from 'ioredis'

// Reuse this across all album cover routes (Cache for 30 days) [LEGACY IN MEMORY]
export const inMemoryCache = new NodeCache({ stdTTL: 60 * 60 * 24 * 30 })

const redis = new Redis({
  host: process.env.NEXT_PUBLIC_REDIS_CONNECTION_HOST,
  port: <any>process.env.NEXT_PUBLIC_REDIS_CONNECTION_PORT,
  keyPrefix: process.env.NEXT_PUBLIC_REDIS_CONNECTION_NAMESPACE,
})

export default redis