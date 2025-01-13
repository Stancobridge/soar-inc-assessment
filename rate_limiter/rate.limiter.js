const config           = require('../config/index.config.js');
const { rateLimit }    = require("express-rate-limit");
const { RedisStore }   = require("rate-limit-redis");
const { createClient } = require("../cache/redis-client");

const FIVE_MINUTES_IN_MILLISECONDS = 5 * 60 * 1000;

/**
 * Create a redis client for rate limiting
 */
const redisClient = createClient({
    prefix: config.dotEnv.CACHE_PREFIX ,
    url: config.dotEnv.CACHE_REDIS
})

/**
 * Configure global rate limiter
 */
const rateLimiter = rateLimit({
    windowMs: FIVE_MINUTES_IN_MILLISECONDS,
    limit: 50,
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args)
    })
})

module.exports = rateLimiter