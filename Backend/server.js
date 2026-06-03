import express from 'express';
import redis from 'redis';
import winston from 'winston';
import {LogtailTransport} from "@logtail/winston"
import {Logtail} from "@logtail/node"
import crypto from 'crypto';
import cors from 'cors';


const app = express();

// major caching techniques used in this implementation:
// 1. Cache-aside pattern
// 2. Cache key normalization
// 3. cache memory management ana eviction policies
// 4. pending request tracking to prevent request duplication and thundering herd problem


// major logging techniques used in this implementation:
// 1. Structured logging with JSON format for better log parsing and analysis
// 2. Log levels to differentiate between info, warning, and error messages
// 3. Correlation IDs (requestId) to trace logs related to the same request across different log entries
// 4. Logtail integration for centralized log management and monitoring in production environments
// 5. Process-level error logging for uncaught exceptions and unhandled promise rejections to ensure all errors are captured
// 6. Performance logging to track API response times and identify potential bottlenecks
// 7. Cache hit/miss logging to monitor cache effectiveness and identify opportunities for optimization
// 8. Redis error logging to capture and troubleshoot issues related to caching


// setup cors for cross-origin requests
app.use( cors() )


// setup logtail for production logging
const logtail = new Logtail( process.env.BETTER_STACK_KEY );

// setup winston loggers for both development and production
winston.loggers.add('development', {
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.Console(),
    ],
    defaultMeta: { service: 'dev-logger' } 
})

winston.loggers.add('production', {
    level: 'info',
    format: winston.format.json(),
    transports: [
        new LogtailTransport(logtail),
    ],
    defaultMeta: { service: 'prod-logger' } 
})

// initialize logger based on environment
const logger = winston.loggers.get( process.env.NODE_ENV || 'development' );


// middleware to log all incoming requests and their outcomes, including URL, method, 
// status code, and duration of the request for performance monitoring and debugging purposes
app.use((req, res, next) => {
    const start = Date.now();

    req.requestId = crypto.randomUUID();


    // log the incoming request URL for debugging and monitoring purposes
    logger.info( {
        event: "request_received",
        url: generateURLFromReq(req),
        method: req.method,
        requestId: req.requestId,
        path: req.path,
        query: req.query
    } );

    res.on('finish', () => {
        logger.info({
            event: 'request_completed',
            url: generateURLFromReq(req),
            method: req.method,
            statusCode: res.statusCode,
            durationMs: Date.now() - start,
            requestId: req.requestId,
            path: req.path,
            query: req.query
        });
    });

    next();
});



// setup Redis client
const redisClient = redis.createClient();

// handle Redis cache errors and log them using the 
// configured logger
redisClient.on('error', (err) => {
    logger.error({
        event: "redis_error",
        message: "Redis error: " + (err.message || "Unknown error"),
        stack: err.stack
    });
});



// generate URL from request for logging
function generateURLFromReq( req ) {
    return `${req.protocol}://${req.get('host')}${req.originalUrl}`;
}


const supportedCategories = [
    'business', 
    'entertainment', 
    'general', 
    'health', 
    'science', 
    'sports', 
    'technology'
];


// pendingRequests map to track in-flight requests and prevent 
// duplicate API calls for the same category or search query
const pendingRequests = new Map();


// getOrSetCache()
// helper function to get data from Redis cache or set it if not present
async function getOrSetCache( req, key, fetchFunction, expiration = 3600 ) {
    try {
        // attempt to retrieve cached data from Redis using the provided key
        let cachedData = await redisClient.get(key);

        // check if cached data exists for the provided key, if it does log a cache hit and return the cached data
        if ( cachedData ) {
            logger.info({
                event: "cache_hit",
                cacheKey: key,
                requestId: req.requestId
            });

            return JSON.parse(cachedData);
        }

        // if there is already a pending request for the same key, 
        // wait for that request to complete and return its result to 
        // prevent duplicate API calls
        if ( pendingRequests.has(key) ) {
            logger.info({
                event: "pending_request",
                cacheKey: key,
                requestId: req.requestId
            });

            return await pendingRequests.get(key);
        }

        // add the key to the pending requests map
        const pendingRequest = fetchFunction();
        pendingRequests.set(key, pendingRequest);

        try {
            // if no cached data is found, call the provided fetch function to retrieve fresh data
            const data = await pendingRequest;

            // log a cache miss and cache the fetched data in Redis with the specified expiration time
            logger.info({
                event: "cache_miss",
                cacheKey: key,
                requestId: req.requestId
            });

            await redisClient.setEx(key, expiration, JSON.stringify(data));

            return data;
        } finally {
            // remove the key from the pending requests map once the request is complete
            pendingRequests.delete(key);
        }
    } catch (err) {
        // if any errors occur during the cache retrieval or setting process, log the error and rethrow it
        logger.error({
            event: "cache_error",
            message: "Cache error: " + (err.message || "Unknown error"),
            stack: err.stack,
            cacheKey: key,
            requestId: req.requestId
        });

        throw err;
    }
}

app.get('/feed', async (req, res) => {
    // get category from query parameters, default to 'general' 
    // if not provided
    let category = req.query.category || 'general';

    // validate that the requested category is supported, if not return
    // a 400 Bad Request response with an error message
    if ( !supportedCategories.includes(category) ) {
        return res.status(400).json({
            status: 'error',
            error: {
                message: `Invalid category. Supported categories are: ${supportedCategories.join(', ')}`
            }
        });
    }

    // generate a unique cache key for the requested category to check if
    // results are already cached in Redis
    const cacheKey = `news:${category}`;

    const apiStart = Date.now();

    try {
        // use the getOrSetCache helper function to retrieve news data from Redis cache or fetch it from the News API if not cached
        const data = await getOrSetCache( req, cacheKey, async () => {    
            const response = await fetch(`https://newsapi.org/v2/top-headlines?category=${category}&apiKey=${process.env.NEWS_API_KEY}`,
                {
                    signal: AbortSignal.timeout( 5000 ) // set a timeout of 5 seconds for the API request
                }
            );

            // check if the response from the News API is successful, if not throw an error
            if ( !response.ok ) {
                throw new Error(`News API error: ${response.statusText}`);
            }

            // parse and return the JSON response from the News API
            return response.json();
        });

        logger.info({
            event: "api_fetch_success",
            cacheKey: cacheKey,
            requestId: req.requestId,
            apiDurationMs: Date.now() - apiStart
        });

        // return the news data as a JSON response to the client
        res.json({
            status: "success",
            data
        });
    } catch (err) {
        // if any errors occur during the fetch operation or while processing the results, log the error and return a 500 Internal Server Error response with an error message
        logger.error({
            event: "fetch_error",
            message: "Error fetching news data: " + (err.message || "Unknown error"),
            cacheKey: cacheKey,
            requestId: req.requestId,
            stack: err.stack,
            apiDurationMs: Date.now() - apiStart
        });

        res.status(500).json({
            status: 'error',
            error: {
                message: 'Failed to fetch news data'
            }
        });
    }
});


app.get("/search", async (req, res) => {
    // get search query from request
    const query = req.query.q;

    // validate that the search query parameter "q" is provided, 
    // if not return a 400 Bad Request response with an error message
    if ( !query ) {
        return res.status(400).json({
            status: 'error',
            error: {
                message: 'Missing search query parameter "q"'
            }
        });
    }

    // generate a unique normalized cache key for the search query to 
    // check if results are already cached in Redis
    const cacheKey = `search:${query.toLowerCase()}`;

    const apiStart = Date.now();

    try {
        let data = await getOrSetCache( req, cacheKey, async () => {
            const response = await fetch(`https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&apiKey=${process.env.NEWS_API_KEY}`,
                {
                    signal: AbortSignal.timeout( 5000 ) // set a timeout of 5 seconds for the API request
                }
            );

            // check if the response from the News API is successful, if not throw an error
            if ( !response.ok ) {
                throw new Error(`News API error: ${response.statusText}`);
            }

            // parse and return the JSON response from the News API
            return response.json();
        }, 3 * 60 ); // cache search results for 3 minutes to balance freshness and performance

        logger.info({
            event: "api_fetch_success",
            cacheKey: cacheKey,
            requestId: req.requestId,
            apiDurationMs: Date.now() - apiStart
        });

        // return the search results as a JSON response to the client
        res.json({
            status: "success",
            data
        });
    } catch (err) {
        // if any errors occur during the fetch operation or while processing the results, log the error and return a 500 Internal Server Error response with an error message
        logger.error({
            event: "fetch_error",
            message: "Error fetching search results: " + (err.message || "Unknown error"),
            cacheKey: cacheKey,
            requestId: req.requestId,
            stack: err.stack,
            apiDurationMs: Date.now() - apiStart
        });

        res.status(500).json({
            status: 'error',
            error: {
                message: 'Failed to fetch search results'
            }
        });
    }
});


// logger for process-level uncaught exceptions and unhandled 
// promise rejections to ensure that all errors are captured 
// and logged for debugging and monitoring purposes
process.on('uncaughtException', (err) => {
    logger.error({
        event: "uncaught_exception",
        message: "Uncaught exception: " + (err.message || "Unknown error"),
        stack: err.stack
    });
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error({
        event: "unhandled_rejection",
        message: "Unhandled rejection: " + (reason.message || "Unknown error"),
        stack: reason?.stack
    });
});


const PORT = process.env.PORT;

async function startServer() {
    try {
        await redisClient.connect({
            url: process.env.REDIS_URL
        });

        // set redis memory limit to 256 
        await redisClient.configSet('maxmemory', '24mb');

        await redisClient.configSet('maxmemory-policy', 'allkeys-lru');


        app.listen(PORT, () => {
            logger.info({
                event: "server_started",
                message: `Server is running on port ${PORT}`
            });

            console.log(`Server listening on port ${PORT}`)
        });
    } catch (err) {
        logger.error({
            event: "redis_connection_error",
            message: "Failed to connect to Redis: " + (err.message || "Unknown error"),
            stack: err.stack
        });

        process.exit(1);
    }
}

startServer();