import NodeCache from 'node-cache'

// Reuse this across all album cover routes (Cache for 30 days)
export const albumCoverCache = new NodeCache({ stdTTL: 60 * 60 * 24 * 30 })
