import express from 'express';
import redis from 'redis';
import winston from 'winston';
import {LogtailTransport} from "@logtail/winston"
import {Logtail} from "@logtail/node"


const app = express();
const redisClient = redis.createClient();

const logtail = new Logtail( process.env.BETTER_STACK_KEY );

// setup winston loggers
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

const logger = winston.loggers.get( process.env.NODE_ENV || 'development' );



redisClient.on('error', (err) => {
    logger.error("Redis error: ", err);
});

function generateURLFromReq( req ) {
    return `${req.protocol}://${req.get('host')}${req.originalUrl}`;
}

app.get('/feed', (req, res) => {
    res.send('Hello World!');
    logger.info( generateURLFromReq(req) );
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});