import NodeCache from 'node-cache'

// Reuse this across all routes
export const albumCoverCache = new NodeCache({ stdTTL: 60 * 60 * 24 })
