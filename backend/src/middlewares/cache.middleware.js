/**
 * Simple In-Memory Cache Middleware
 * สำหรับ cache response ที่ไม่เปลี่ยนแปลงบ่อย
 * 
 * Note: สำหรับ production ควรใช้ Redis หรือ Memcached
 */

// Simple in-memory cache store
const cache = new Map();

// Cache statistics
const stats = {
  hits: 0,
  misses: 0
};

/**
 * Cache configuration
 */
const DEFAULT_TTL = 60 * 1000; // 1 minute default
const MAX_CACHE_SIZE = 100; // Maximum number of cache entries

/**
 * Generate cache key from request
 */
function generateCacheKey(req) {
  const { method, originalUrl, user } = req;
  // Include user ID for user-specific data
  const userId = user?.id || 'anonymous';
  return `${method}:${originalUrl}:${userId}`;
}

/**
 * Check if cache entry is expired
 */
function isExpired(entry) {
  return Date.now() > entry.expiresAt;
}

/**
 * Clean up expired entries
 */
function cleanupExpired() {
  for (const [key, entry] of cache.entries()) {
    if (isExpired(entry)) {
      cache.delete(key);
    }
  }
}

/**
 * Evict oldest entries if cache is full
 */
function evictOldest() {
  if (cache.size >= MAX_CACHE_SIZE) {
    // Delete first (oldest) entry
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
}

/**
 * Set cache entry
 */
export function setCache(key, data, ttl = DEFAULT_TTL) {
  evictOldest();
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttl,
    createdAt: Date.now()
  });
}

/**
 * Get cache entry
 */
export function getCache(key) {
  const entry = cache.get(key);
  
  if (!entry) {
    stats.misses++;
    return null;
  }
  
  if (isExpired(entry)) {
    cache.delete(key);
    stats.misses++;
    return null;
  }
  
  stats.hits++;
  return entry.data;
}

/**
 * Invalidate cache entries by pattern
 */
export function invalidateCache(pattern) {
  if (typeof pattern === 'string') {
    // Simple string match
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    }
  } else if (pattern instanceof RegExp) {
    // Regex match
    for (const key of cache.keys()) {
      if (pattern.test(key)) {
        cache.delete(key);
      }
    }
  }
}

/**
 * Clear all cache
 */
export function clearCache() {
  cache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  cleanupExpired();
  return {
    size: cache.size,
    hits: stats.hits,
    misses: stats.misses,
    hitRate: stats.hits + stats.misses > 0 
      ? (stats.hits / (stats.hits + stats.misses) * 100).toFixed(2) + '%'
      : '0%'
  };
}

/**
 * Cache middleware factory
 * @param {Object} options - Cache options
 * @param {number} options.ttl - Time to live in milliseconds
 * @param {function} options.keyGenerator - Custom key generator
 * @param {function} options.condition - Condition to cache (req) => boolean
 * @returns {function} Express middleware
 */
export function cacheMiddleware(options = {}) {
  const {
    ttl = DEFAULT_TTL,
    keyGenerator = generateCacheKey,
    condition = () => true
  } = options;

  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Check condition
    if (!condition(req)) {
      return next();
    }

    const key = keyGenerator(req);
    const cachedData = getCache(key);

    if (cachedData) {
      // Return cached response
      res.set('X-Cache', 'HIT');
      return res.json(cachedData);
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json to cache successful responses
    res.json = (data) => {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300 && data?.success !== false) {
        setCache(key, data, ttl);
      }
      res.set('X-Cache', 'MISS');
      return originalJson(data);
    };

    next();
  };
}

/**
 * Predefined cache configurations for common endpoints
 */
export const CacheConfigs = {
  // Cache leave types for 5 minutes (rarely changes)
  leaveTypes: cacheMiddleware({ 
    ttl: 5 * 60 * 1000,
    condition: (req) => req.originalUrl.includes('/types')
  }),
  
  // Cache departments for 10 minutes
  departments: cacheMiddleware({
    ttl: 10 * 60 * 1000,
    condition: (req) => req.originalUrl.includes('/departments')
  }),
  
  // Cache user balance for 30 seconds
  userBalance: cacheMiddleware({
    ttl: 30 * 1000,
    condition: (req) => req.originalUrl.includes('/balance')
  }),
  
  // Short cache for listings (15 seconds)
  shortCache: cacheMiddleware({
    ttl: 15 * 1000
  })
};

/**
 * Invalidation helpers
 */
export function invalidateUserCache(userId) {
  invalidateCache(`:${userId}`);
}

export function invalidateLeaveCache(leaveId) {
  invalidateCache(`leaves`);
  if (leaveId) {
    invalidateCache(`leave/${leaveId}`);
  }
}

// Cleanup expired entries periodically
setInterval(cleanupExpired, 60 * 1000);

export default {
  cacheMiddleware,
  setCache,
  getCache,
  invalidateCache,
  clearCache,
  getCacheStats,
  CacheConfigs,
  invalidateUserCache,
  invalidateLeaveCache
};
