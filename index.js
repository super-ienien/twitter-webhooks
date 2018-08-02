const crypto = require('crypto');
const request = require ('request');
const EventEmitter = require('events');

let twitterServerTimeOffset = 0;

const TWITTER_API_URI = 'https://api.twitter.com/1.1/';

module.exports = function twitterWebhookMiddlewareFactory (config)
{
    if (typeof config !== 'object' || !config) throw new Error ('config arguments is missing or is not an object');
    if (typeof config.consumerSecret !== 'string') throw new Error ('You must provide a consumer secret');
    if (typeof config.consumerKey !== 'string') throw new Error ('You must provide a consumer key');

    const consumerSecret = config.consumerSecret;
    const consumerKey = config.consumerKey;
    const userEmitters = new Map();
    const middleware = function twitterWebhookMiddleware (req, res, next)
    {
        switch (req.method)
        {
            case 'GET':
                if (req.query.crc_token)
                {
                    return res.json({
                        response_token: crypto.createHmac('sha256', consumerSecret).update(req.query.crc_token).digest('base64')
                    });
                }
            break;
            case 'POST':
                res.sendStatus(200);
                const payload = req.body;
                this.emit('raw', payload);
                if (typeof payload.for_user_id === 'string')
                {
                    const emitter = userEmitters.get(payload.for_user_id);
                    if (!emitter) return;
                    for (let eventName in payload)
                    {
                        if (eventName === 'for_user_id') continue;
                        const events = payload[eventName];
                        eventName = eventName.replace('_events', '');
                        if (Array.isArray(events))
                        {
                            for (let i = 0; i<events.length; i++)
                            {
                                emitter.emit(eventName, events[i])
                            }
                        }
                        else
                        {
                            emitter.emit(eventName, events);
                        }
                    }
                    return;
                }
                else if (payload.user_event && typeof payload.user_event === 'object')
                {
                    if (payload.user_event.revoke && typeof payload.user_event.revoke === 'object')
                    {
                        const emitter = userEmitters.get(payload.user_event.revoke.source.user_id);
                        if (emitter) emitter.emit('revoke', payload.user_event.revoke);
                        return;
                    }
                }
                this.emit('unknown', payload);
            break;
        }

        next();
    };

    middleware.subscribe = function subscribe (config)
    {
        if (!config.userId) throw new Error('You must provide userId');
        const env = config.env || 'env-beta';
        return new Promise((resolve, reject) => {
            request({
                uri: `${TWITTER_API_URI}account_activity/all/${env}/webhooks.json?url=${encodeURIComponent(config.url)}`,
                method: 'POST',
                json: true,
                oauth: {
                    consumer_key: consumerKey,
                    consumer_secret: consumerSecret,
                    token: config.token,
                    token_secret: config.tokenSecret,
                    timestamp: Math.floor((Date.now() + twitterServerTimeOffset)/1000).toString(),
                }
            }, (error, response, json) =>
            {
                if (error) return reject(error);
                switch (response.statusCode)
                {
                    case 200:
                        resolve(this.getUserActivity(json.id));
                    break;
                    case 403:
                        if (Array.isArray(json.errors))
                        {
                            error = new Error (json.errors[0].message);
                            error.code = json.errors[0].code;
                            reject(error);
                            break;
                        }
                    default:
                        error = new Error (response.body.toString());
                        error.code = response.statusCode;
                        reject(error);
                }
            });
        });
    };

    middleware.getUserActivity = function (userId)
    {
        if (userEmitters.has(userId)) return userEmitters.get(userId);
        const emitter = new EventEmitter();
        userEmitters.set(userId, emitter);
        return emitter;
    };

    Object.assign(middleware, new EventEmitter());

};