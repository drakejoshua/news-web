import express from 'express';
import redis from 'redis';
import winston from 'winston';
import {LogtailTransport} from "@logtail/winston"
import {Logtail} from "@logtail/node"


const app = express();


// setup logtail for production logging
const logtail = new Logtail( process.env.BETTER_STACK_KEY );

// setup winston loggers for both development and production
winston.loggers.add('development', {
    level: 'info',
    transports: [
        new winston.transports.Console(),
    ],
    defaultMeta: { service: 'dev-logger' } 
})

winston.loggers.add('production', {
    level: 'warn',
    transports: [
        new LogtailTransport(logtail),
    ],
    defaultMeta: { service: 'prod-logger' } 
})

// initialize logger based on environment
const logger = winston.loggers.get( process.env.NODE_ENV || 'development' );



// setup Redis client
const redisClient = redis.createClient();

// handle Redis cache errors and log them using the 
// configured logger
redisClient.on('error', (err) => {
    logger.error("Redis error: ", err.message || "Unknown error");
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
async function getOrSetCache( key, fetchFunction, expiration = 3600 ) {
    try {
        // attempt to retrieve cached data from Redis using the provided key
        let cachedData = await redisClient.get(key);

        // check if cached data exists for the provided key, if it does log a cache hit and return the cached data
        if ( cachedData ) {
            logger.info(`Cache hit for key: ${key}`);

            return JSON.parse(cachedData);
        }

        // if there is already a pending request for the same key, 
        // wait for that request to complete and return its result to 
        // prevent duplicate API calls
        if ( pendingRequests.has(key) ) {
            logger.info(`Waiting for pending request for key: ${key}`);

            return await pendingRequests.get(key);
        }

        // add the key to the pending requests map
        const pendingRequest = fetchFunction();
        pendingRequests.set(key, pendingRequest);

        try {
            // if no cached data is found, call the provided fetch function to retrieve fresh data
            const data = await pendingRequest;

            // log a cache miss and cache the fetched data in Redis with the specified expiration time
            logger.info(`Cache miss for key: ${key}`);

            await redisClient.setEx(key, expiration, JSON.stringify(data));

            return data;
        } finally {
            // remove the key from the pending requests map once the request is complete
            pendingRequests.delete(key);
        }
    } catch (err) {
        // if any errors occur during the cache retrieval or setting process, log the error and rethrow it
        logger.error("Cache error: ", err.message || "Unknown error");

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

    // log the incoming request URL for debugging and monitoring purposes
    logger.info( generateURLFromReq(req) );

    // generate a unique cache key for the requested category to check if
    // results are already cached in Redis
    const cacheKey = `news:${category}`;

    try {
        // use the getOrSetCache helper function to retrieve news data from Redis cache or fetch it from the News API if not cached
        const data = await getOrSetCache(cacheKey, async () => {    
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

        // return the news data as a JSON response to the client
        res.json({
            status: "success",
            data
        });
    } catch (err) {
        // if any errors occur during the fetch operation or while processing the results, log the error and return a 500 Internal Server Error response with an error message
        logger.error("Error fetching news data: ", err.message || "Unknown error");

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

    // log the incoming request URL for debugging and monitoring
    logger.info( generateURLFromReq(req) );

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

    // attempt to retrieve cached search results from Redis using 
    // the generated cache key
    let cachedData = await redisClient.get(cacheKey);

    try {
        let data = await getOrSetCache(cacheKey, async () => {
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

        // return the search results as a JSON response to the client
        res.json({
            status: "success",
            data
        });
    } catch (err) {
        // if any errors occur during the fetch operation or while processing the results, log the error and return a 500 Internal Server Error response with an error message
        logger.error("Error fetching search results: ", err.message || "Unknown error");

        res.status(500).json({
            status: 'error',
            error: {
                message: 'Failed to fetch search results'
            }
        });
    }
});


async function startServer() {
    try {
        await redisClient.connect();

        // set redis memory limit to 256 
        await redisClient.configSet('maxmemory', '256mb');

        await redisClient.configSet('maxmemory-policy', 'allkeys-lru');

        const PORT = process.env.PORT || 8000;

        app.listen(PORT, () => {
            console.log(`Server running on ${PORT}`);
        });
    } catch (err) {
        console.error('Failed to connect Redis', err);
        process.exit(1);
    }
}

startServer();