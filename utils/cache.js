const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

module.exports = {
  get: (key) => cache.get(key),
  set: (key, value, ttl) => cache.set(key, value, ttl),
  del: (key) => cache.del(key)
};