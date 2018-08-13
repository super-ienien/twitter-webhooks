'use strict';

const crypto = require('crypto');
const EventEmitter = require('events');
const UserActivityEmitter = require('./user-activity-emitter');

let twitterServerTimeOffset = 0;

const TWITTER_API_URI = 'https://api.twitter.com/1.1/';
const {sendApiRequest} = require('./helpers');

module.exports = function userActivityWebhook (config) {
    let serverUrl, route, callbackUrl, consumerSecret, consumerKey, accessToken, accessTokenSecret, environment;

    const userActivityEmitters = new Map();

    function prepareUserContextRequest (args) {
        if (!args.userId) throw new Error('Twitter webhooks : You must provide userId');
        if (!args.accessToken) throw new Error('Twitter webhooks : You must provide user accessToken');
        if (!args.accessTokenSecret) throw new Error('Twitter webhooks : You must provide user accessTokenSecret');

        return {
            json: true,
            oauth: {
                consumer_key: consumerKey,
                consumer_secret: consumerSecret,
                token: args.accessToken,
                token_secret: args.accessTokenSecret,
                timestamp: Math.floor((Date.now() + twitterServerTimeOffset) / 1000).toString()
            }
        };
    }

    function prepareAppContextRequest (args) {
        const accessTokenOption = args.accessToken || accessToken;
        const accessTokenSecretOption = args.accessTokenSecret || accessTokenSecret;
        if (typeof accessTokenOption !== 'string') throw new Error('Twitter webhooks : You must provide your app accessToken');
        if (typeof accessTokenSecretOption !== 'string') throw new Error('Twitter webhooks : You must provide your app accessTokenSecret');

        return {
            json: true,
            oauth: {
                consumer_key: consumerKey,
                consumer_secret: consumerSecret,
                token: accessTokenOption,
                token_secret: accessTokenSecretOption,
                timestamp: Math.floor((Date.now() + twitterServerTimeOffset) / 1000).toString()
            }
        };
    }

    const middleware = function userActivityWebhookMiddleware (req, res, next) {
        switch (req.method) {
        case 'GET':
            if (req.query.crc_token) {
                console.log({
                    response_token: crypto.createHmac('sha256', consumerSecret).update(req.query.crc_token).digest('base64')
                });
                return res.json({
                    response_token: 'sha256=' + crypto.createHmac('sha256', consumerSecret).update(req.query.crc_token).digest('base64')
                });
            }
            break;
        case 'POST':
            res.sendStatus(200);
            const payload = req.body;
            if (typeof payload.for_user_id === 'string') {
                const emitter = userActivityEmitters.get(payload.for_user_id);
                for (let eventName in payload) {
                    if (eventName === 'for_user_id') continue;
                    const events = payload[eventName];
                    eventName = eventName.replace('_events', '');
                    if (Array.isArray(events)) {
                        for (let i = 0; i < events.length; i++) {
                            if (emitter) emitter.emit(eventName, events[i]);
                            middleware.emit('event', eventName, payload.for_user_id, events[i]);
                        }
                    } else {
                        if (emitter) emitter.emit(eventName, events);
                        middleware.emit('event', eventName, payload.for_user_id, events);
                    }
                }
                return;
            } else if (payload.user_event && typeof payload.user_event === 'object') {
                if (payload.user_event.revoke && typeof payload.user_event.revoke === 'object') {
                    const emitter = userActivityEmitters.get(payload.user_event.revoke.source.user_id);
                    if (emitter) emitter.emit('revoke', payload.user_event.revoke);
                    middleware.emit('event', 'revoke', payload.user_event.revoke.source.user_id, payload.user_event.revoke);
                    return;
                }
            }
            middleware.emit('unknown-event', payload);
            break;
        }

        next();
    };

    middleware.subscribe = function subscribe (args = {}) {
        const options = prepareUserContextRequest(args);

        args = Object.assign({}, args);
        options.uri = `${TWITTER_API_URI}account_activity/all/${environment}/subscriptions.json`;
        options.method = 'POST';

        return sendApiRequest(options)
        .then(function () {
            return middleware.getUserActivity(args);
        });
    };

    middleware.unsubscribe = function unsubscribe (args = {}) {
        const options = prepareUserContextRequest(args);
        const userId = args.userId;

        options.uri = `${TWITTER_API_URI}account_activity/all/${environment}/subscriptions.json`;
        options.method = 'DELETE';

        return sendApiRequest(options)
        .then(function () {
            const emitter = userActivityEmitters.get(userId);
            if (emitter) {
                emitter.emit('unsubscribe');
                userActivityEmitters.delete(userId);
                emitter.removeAllEventListener();
            }
        });
    };

    middleware.register = function register (args = {}) {
        const options = prepareAppContextRequest(args);
        const callbackUrlOption = args.callbackUrl || callbackUrl;
        if (typeof callbackUrlOption !== 'string') throw new Error('You must provide a callback url to register a twitter webhook');

        options.uri = `${TWITTER_API_URI}account_activity/all/${environment}/webhooks.json?url=${encodeURIComponent(callbackUrlOption)}`;
        options.method = 'POST';

        return sendApiRequest(options)
        .then(function (response) {
            return response.body;
        });
    };

    middleware.unregister = function unregister (args = {}) {
        const options = prepareAppContextRequest(args);
        if (typeof args.webhookId !== 'string') throw new Error('You must provide a webhookId');

        options.uri = `${TWITTER_API_URI}account_activity/all/${environment}/webhooks/${args.webhookId}.json`;
        options.method = 'DELETE';

        return sendApiRequest(options)
        .then(function (response) {
            // TODO EMIT DELETE EVENT
        });
    };

    middleware.getWebhooks = function getWebhooks (args = {}) {
        const options = prepareAppContextRequest(args);

        options.uri = `${TWITTER_API_URI}account_activity/all/webhooks.json`;
        options.method = 'GET';

        return sendApiRequest(options)
        .then(function (response) {
            return response.body;
        });
    };

    middleware.getWebhook = function getWebhook (args = {}) {
        const options = prepareAppContextRequest(args);

        options.uri = `${TWITTER_API_URI}account_activity/all/${environment}/webhooks.json`;
        options.method = 'GET';

        return sendApiRequest(options)
        .then(function (response) {
            return response.body;
        });
    };

    middleware.triggerChallengeResponseCheck = function (args = {}) {
        const options = prepareAppContextRequest(args);

        if (typeof args.webhookId !== 'string') throw new Error('You must provide a webhookId');

        options.uri = `${TWITTER_API_URI}account_activity/all/${environment}/webhooks/${args.webhookId}.json`;
        options.method = 'PUT';

        return sendApiRequest(options);
    };

    middleware.getSubscriptionsCount = function (args = {}) {
        const options = prepareAppContextRequest(args);

        options.uri = `${TWITTER_API_URI}account_activity/subscriptions/list.json`;
        options.method = 'GET';

        return sendApiRequest(options)
        .then(function (response) {
            return response.body;
        });
    };

    middleware.isSubscribed = function (args = {}) {
        const options = prepareUserContextRequest(args);

        options.uri = `${TWITTER_API_URI}account_activity/subscriptions/list.json`;
        options.method = 'GET';

        return sendApiRequest(options)
        .then(function (response) {
            return response.statusCode === 204;
        })
        .catch(function (error) {
            if (error.statusCode !== -1) return false;
            throw error;
        });
    };

    middleware.getSubscriptions = function (args = {}) {
        const options = prepareAppContextRequest(args);

        options.uri = `${TWITTER_API_URI}account_activity/all/${environment}/subscriptions/list.json`;
        options.method = 'GET';

        return sendApiRequest(options)
        .then(function (response) {
            return response.body.subscriptions;
        });
    };

    middleware.getUserActivity = function (args) {
        if (userActivityEmitters.has(args.userId)) return userActivityEmitters.get(args.userId);
        const emitter = new UserActivityEmitter(args);
        userActivityEmitters.set(args.userId, emitter);
        return emitter;
    };

    middleware.config = function (config = {}) {
        if (config.consumerSecret) consumerSecret = config.consumerSecret;
        else if (!consumerSecret) throw new Error('consumerSecret missing on Twitter webhook middleware config');

        if (config.consumerKey) consumerKey = config.consumerKey;
        else if (!consumerKey) throw new Error('consumerKey missing on Twitter webhook middleware config');

        if (config.serverUrl) serverUrl = config.serverUrl.endsWith('/') ? config.serverUrl.slice(0, -1) : config.serverUrl;
        if (config.route) route = config.route || '/';

        environment = config.environment || 'env-beta';

        if (config.serverUrl || config.route) callbackUrl = serverUrl + (!route.startsWith('/') ? '/' + route : route);

        if (config.accessToken) accessToken = config.accessToken;

        if (config.accessTokenSecret) accessTokenSecret = config.accessTokenSecret;

        if (config.app) config.app.use(route, middleware);
    };

    Object.defineProperty(middleware, 'accessToken', {
        get: function () { return accessToken; },
        set: function (accessToken) { this.config({accessToken}); }
    });

    Object.defineProperty(middleware, 'accessTokenSecret', {
        get: function () { return accessTokenSecret; },
        set: function (accessTokenSecret) { this.config({accessTokenSecret}); }
    });

    Object.defineProperty(middleware, 'consumerKey', {
        get: function () { return consumerKey; },
        set: function (consumerKey) { this.config({consumerKey}); }
    });

    Object.defineProperty(middleware, 'consumerSecret', {
        get: function () { return consumerSecret; },
        set: function (consumerSecret) { this.config({consumerSecret}); }
    });

    Object.defineProperty(middleware, 'environment', {
        get: function () { return environment; },
        set: function (environment) { this.config({environment}); }
    });

    Object.defineProperty(middleware, 'route', {
        get: function () { return route; },
        set: function (route) { this.config({route}); }
    });

    Object.defineProperty(middleware, 'serverUrl', {
        get: function () { return serverUrl; },
        set: function (serverUrl) { this.config({serverUrl}); }
    });

    Object.defineProperty(middleware, 'callbackUrl', {
        get: function () { return callbackUrl; }
    });

    Object.assign(middleware, new EventEmitter());
    Object.assign(middleware, EventEmitter.prototype);

    middleware.config(config);

    return middleware;
};