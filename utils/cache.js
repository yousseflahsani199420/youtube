const NodeCache = require('node-cache');

// Create cache instance
const cache = new NodeCache({
  stdTTL: 600, // Default TTL: 10 minutes
  checkperiod: 120, // Check for expired keys every 2 minutes
  useClones: true
});

// Wrapper functions for easier use
module.exports = {
  get: (key) => cache.get(key),
  set: (key, value, ttl) => cache.set(key, value, ttl),
  del: (key) => cache.del(key),
  flush: () => cache.flushAll(),
  stats: () => cache.getStats()
};
