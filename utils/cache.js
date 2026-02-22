const NodeCache = require('node-cache');
const cache = new NodeCache();
module.exports = {
  get: (key)=>cache.get(key),
  set: (key,val,ttl)=>cache.set(key,val,ttl)
};