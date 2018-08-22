# Twitter Webhooks
[![NPM](https://nodei.co/npm/twitter-webhooks.png)](https://nodei.co/npm/twitter-webhooks/)  
[![npm version](https://badge.fury.io/js/twitter-webhooks.svg)](https://badge.fury.io/js/twitter-webhooks) [![MIT License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://github.com/mironal/tw-activity/blob/master/LICENSE)

This module provide a simple way to implement twitter webhooks with ExpressJs.

*This module is very new, feel free to make requests or to give some feedbacks in the github issues.*

# Requirements

- [You need to create an app on the twitter's developer portal and apply for Account Activity API access](https://developer.twitter.com/en/docs/accounts-and-users/subscribe-account-activity/guides/getting-started-with-webhooks)
- Your server must be reachable with https because twitter doesn't accept unsecured webhooks.
- This is an ExpressJS middleware so Express must be installed with your app
- body-parser JSON middleware must be added mount on your Express app

# Install

`npm i -s twitter-webhooks`

# Usage

```javascript
const express = require ('express');
const bodyParser = require ('body-parser');
const twitterWebhooks = require('twitter-webhooks');

const app = express();
app.use(bodyParser.json());

const userActivityWebhook = twitterWebhooks.userActivity({
    serverUrl: 'https://yourdomain.com',
    route: '/your/webhook/route', //default : '/'
    consumerKey: '[YOUR CONSUMER KEY]',
    consumerSecret: '[YOUR CONSUMER SECRET]',
    accessToken: '[YOUR APP ACCESS TOKEN]',
    accessTokenSecret: '[YOUR APP ACCESS TOKEN SECRET]',
    environment: '[your-env]', //default : 'env-beta'
    app
});

//Register your webhook url - just needed once per URL
userActivityWebhook.register();

//Subscribe for a particular user activity
userActivityWebhook.subscribe({
    userId: '[TWITTER USER ID]',
    accessToken: '[TWITTER USER ACCESS TOKEN]',
    accessTokenSecret: '[TWITTER USER ACCESS TOKEN SECRET]'
})
.then(function (userActivity) {
    userActivity
    .on('favorite', (data) => console.log (userActivity.id + ' - favorite'))
    .on ('tweet_create', (data) => console.log (userActivity.id + ' - tweet_create'))
    .on ('follow', (data) => console.log (userActivity.id + ' - follow'))
    .on ('mute', (data) => console.log (userActivity.id + ' - mute'))
    .on ('revoke', (data) => console.log (userActivity.id + ' - revoke'))
    .on ('direct_message', (data) => console.log (userActivity.id + ' - direct_message'))
    .on ('direct_message_indicate_typing', (data) => console.log (userActivity.id + ' - direct_message_indicate_typing'))
    .on ('direct_message_mark_read', (data) => console.log (userActivity.id + ' - direct_message_mark_read'))
    .on ('tweet_delete', (data) => console.log (userActivity.id + ' - tweet_delete'))
});

//listen to any user activity
userActivityWebhook.on ('event', (event, userId, data) => console.log (userId + ' - favorite'));

//listen to unknown payload (in case of api new features)
userActivityWebhook.on ('unknown-event', (rawData) => console.log (rawData));

```  

# Reference

* [TwitterWebhooks](#twitterwebhooks)
    * [userActivity(config)](#useractivityconfig)

* [Middleware: UserActivity](#middleware-useractivity)
    * [Event: 'event'](#event-event)
    * [Event: 'unknown-event'](#event-unknown-event)
    * [getSubscriptionsCount()](#getsubscriptionscount)
    * [getWebhook()](#getWebhook)
    * [getWebhooks()](#getWebhooks)
    * [isSubscribed(options)](#issubscribedoptions)
    * [register()](#register)
    * [subscribe(options)](#subscribeoptions)
    * [triggerChallengeResponseCheck(options)](#triggerchallengeresponsecheckoptions)
    * [unregister()](#unregister)
    * [unsubscribe(options)](#unsubscribeoptions)

* [Class: UserActivityEmitter](#class-useractivityemitter)
    * [Event: 'block'](#event-block)
    * [Event: 'favorite'](#event-favorite)
    * [Event: 'follow'](#event-follow)
    * [Event: 'mute'](#event-mute)
    * [Event: 'tweet_create'](#event-tweet_create)
    * [Event: 'direct_message'](#event-direct_message)
    * [Event: 'direct_message_indicate_typing'](#event-direct_message_indicate_typing)
    * [Event: 'direct_message_mark_read'](#event-direct_message_mark_read)
    * [Event: 'tweet_delete'](#event-tweet_delete)
    * [Event: 'revoke'](#revoke)

* ## twitterWebhooks
    
    This is the root module when your require twitter-webhooks.
    ````javascript
    const twitterWebhooks = require ('twitter-webhooks');
    ````
    
    * ### userActivity(config)
        Create an [UserActivity](#middleware-useractivity) middleware and automatically mount it on an express app if `config.app` is provided.  
    
        #### arguments
        *  **config** - `Object`:
            * **config.serverUrl** - `string`: The server URL were twitter can reach the webhook app (eg: 'https://my.aweso.me/service')
            * **config.route** - `string`: the route of the middleware in the app (eg: '/user-activity-webhook')
            * **config.consumerKey** - `string`: Your Twitter app consumerKey
            * **config.consumerSecret** - `string`: Your Twitter app consumerSecret
            * **config.accessToken** - `string`: Your Twitter app accessToken
            * **config.accessTokenSecret** - `string`: Your Twitter app accessTokenSecret
            * **config.environment** - `string`: The environment name of the webhook. You can find it in your [twitter dashboard](https://developer.twitter.com/en/dashboard)
            * **config.app** - `Express App` *(optional)*: The express app on which mount the middleware. If not provided don't forget to mount the middleware (eg : `app.use(userActivity.route, userActivity)` )

         #### return value `UserActivity`
        This method returns a [UserActivity](#middleware-useractivity) middleware.  
            
* ## Middleware: UserActivity
    
    An UserActivity middleware is created using the [twitterWebhooks.userActivity(config)](#useractivityconfig) method. This middleware can be mount on an ExpressJs app. Each middleware is associated with one User Activity webhook. UserActivity middlewares have a set of methods that helps to configure the webhook by sending calls to the twitter API.
    
    The UserActivity middlewares implements [EventEmitters](https://nodejs.org/dist/latest-v10.x/docs/api/events.html#events_class_eventemitter).
    
    * ### Event: 'event':
        * **eventName** - `string` : The name of the event. This can be any event documented in [UserActivityEmitter](#class-useractivityemitter)
        * **userId** - `string` : The id of the user who triggered this event.
        
        This event is sent for each message received on the webhook.
    * ### Event: 'unknown-event':
        * **payload** - `Object` : The raw object sent by the Twitter API.  
        
        This event is sent for each unknown message received on the webhook. This is useful in case of Twitter's API change not implemented on this module.
    * ### getSubscriptionsCount()
        Get the subscriptions count of your Twitter app. 
    
        #### return value `Promise<Object>`  
        This method returns a promise that is resolved with a javascript Object provided by the Twitter API :
        ```json
        {
            "subscriptions_count_all": "2",
            "subscriptions_count_direct_messages": "1"
        }
        ```
    * ### getWebook()
        > Warning : This method will certainly be modified.
        
        Get informations about the current registered webhooks of an environment. 
        
        #### return value `Promise<Array>`
        This method returns a promise that is resolved with a javascript Array provided by the Twitter API.
        ```json
        [
          {
            "id": "1234567890",
            "url": "https://my.aweso.me/service/user-activity-webhook",
            "valid": true,
            "created_at": "2016-06-02T23:54:02Z"
          }
        ]
        ```
    
    * ### getWebooks()
        Get informations about webhooks for all the environments of your twitter app. 

        #### return value `return Promise<Array>`
        This method returns a promise that is resolved with a javascript Array provided by the Twitter API. For more information about the response, please [read Twitter's doc](https://developer.twitter.com/en/docs/accounts-and-users/subscribe-account-activity/api-reference/aaa-premium#get-account-activity-all-webhooks).
    
    * ### isSubscribed(options)
        Check if a subscription exists for a twitter account.  
        
        #### arguments
        * **options** - `Object`
            * **options.accessToken** - `string` : The twitter account accessToken
            * **options.accessTokenSecret** - `string` : The twitter account accessTokenSecret
            * **options.userId** - `string` : The twitter account Id
    
        #### return value `Promise<Boolean>`
        This method returns a promise that is resolved to `true` if the account is subscribed to this middleware's webhook otherwise the resolve value is `false`.
    
    * ### register()  
        Registers the webhook with the parameters given in the config of the middleware constructor. [Read Twitter's doc](https://developer.twitter.com/en/docs/accounts-and-users/subscribe-account-activity/api-reference/aaa-premium#post-account-activity-all-env-name-webhooks)

        #### return value `Promise<Object>`
        This method returns a promise that is resolved with a javascript Object provided by the Twitter API :
        ```json
        {
          "id": "1234567890",
          "url": "https://my.aweso.me/service/user-activity-webhook",
          "valid": true,
          "created_at": "2016-06-02T23:54:02Z"
        }
        ```
    
    * ### subscribe(options)
        Subscribes to all events of a twitter account.
        
        #### arguments
        * **options** - `Object`
            * **options.accessToken** - `string` : The twitter account accessToken
            * **options.accessTokenSecret** - `string` : The twitter account accessTokenSecret
            * **options.userId** - `string` : The twitter account Id
    
        #### return value `Promise<UserActivityEmitter>`  
        This method returns a promise that is resolved an [UserActivityEmitter](#class-useractivityemitter) instance that will emit all the events received for this account on the webhook.
        
    * ### triggerChallengeResponseCheck(options)
        Manually trigger a CRC request on the webhook. [Read Twitter's doc](https://developer.twitter.com/en/docs/accounts-and-users/subscribe-account-activity/api-reference/aaa-premium#put-account-activity-all-env-name-webhooks-webhook-id)

        #### arguments
        * **options.webhookId** - `string` : The webhook id
    
    * ### unregister()
        Unregisters the webhook with the parameters given in the config of the middleware constructor. [Read Twitter's doc](https://developer.twitter.com/en/docs/accounts-and-users/subscribe-account-activity/api-reference/aaa-premium#post-account-activity-all-env-name-webhooks)
    
      #### return value `Promise`
      The promise is resolved if the webhook was unregistered with success and is rejected if not.

    * ### unsubscribe(options)**
        Deletes a subscription for a particular account.
        
        #### arguments
        * **options** `Object`:
            * **options.accessToken** - `string` : The twitter account accessToken
            * **options.accessTokenSecret** - `string` : The twitter account accessTokenSecret
            * **options.userId** - `string` : The twitter account Id

        #### return value `Promise`
        The promise is resolved if the subscription was deleted with success and is rejected if not.
        
    ## Class: UserActivityEmitter 
    
    Instances of the UserActivityEmitter class are [EventEmitters](https://nodejs.org/dist/latest-v10.x/docs/api/events.html#events_class_eventemitter) that represent activity of one twitter account.
    You can get an instance of UserActivityEmitter by using the **[subscribe](#subscribeoptions)** method of an UserActivity middleware.
    
    * ### Event: 'block'
        * blockEvent - `Object` : 
            * id - `string` : ID of the event
            * created_timestamp - `string`: Timestamp of when the event happened
            * target - `<Tweet Object>`: The blocked User. For more details on User Objects : [Read Twitter's doc](https://developer.twitter.com/en/docs/tweets/data-dictionary/overview/tweet-object)
            * source - `<User Object>`: The blocking User. For more details on User Objects : [Read Twitter's doc](https://developer.twitter.com/en/docs/tweets/data-dictionary/overview/user-object) 

        ```json
        {
            "type": "follow",
            "created_timestamp": "1517588749178",
            "target": "<User Object>",
            "source": "<User Object>"
        }
        ```
        
    * ### Event: 'favorite'
        * favoriteEvent - `Object` : 
            * id - `string` : ID of the event
            * created_at - `string` : Date string of when the event happened
            * timestamp_ms - `number`: Timestamp of when the event happened
            * favorited_status - `<Tweet Object>`: The favorited tweet object. For more details on Tweet Objects : [Read Twitter's doc](https://developer.twitter.com/en/docs/tweets/data-dictionary/overview/tweet-object)
            * user - `<User Object>`: The user object of the account who favorited the tweet. For more details on User Objects : [Read Twitter's doc](https://developer.twitter.com/en/docs/tweets/data-dictionary/overview/user-object)
        ```json
        {
            "id": "a7ba59eab0bfcba386f7acedac279542",
            "created_at": "Mon Mar 26 16:33:26 +0000 2018",
            "timestamp_ms": 1522082006140,
            "favorited_status": "<Tweet Object>",
            "user": "<User Object>"
        }
        ```
    * ### Event: 'follow'
        * followEvent - `Object` : 
            * id - `string` : ID of the event
            * created_timestamp - `string`: Timestamp of when the event happened
            * target - `<Tweet Object>`: The followed User. For more details on User Objects : [Read Twitter's doc](https://developer.twitter.com/en/docs/tweets/data-dictionary/overview/tweet-object)
            * source - `<User Object>`: The following User. For more details on User Objects : [Read Twitter's doc](https://developer.twitter.com/en/docs/tweets/data-dictionary/overview/user-object)
        ```json
        {
            "type": "follow",
            "created_timestamp": "1517588749178",
            "target": "<User Object>",
            "source": "<User Object>"
        }
        ```
    * ### Event: 'mute'
        * muteEvent - `Object` : 
            * id - `string` : ID of the event
            * created_timestamp - `string`: Timestamp of when the event happened
            * target - `<Tweet Object>`: The muted User. For more details on User Objects : [Read Twitter's doc](https://developer.twitter.com/en/docs/tweets/data-dictionary/overview/tweet-object)
            * source - `<User Object>`: The muting User. For more details on User Objects : [Read Twitter's doc](https://developer.twitter.com/en/docs/tweets/data-dictionary/overview/user-object)
        ```json
        {
            "type": "follow",
            "created_timestamp": "1517588749178",
            "target": "<User Object>",
            "source": "<User Object>"
        }
        ```
    * ### Event: 'direct_message'
        > Not tested yet, please provide feedbacks if you are using this.
    * ### Event: 'direct_message_indicate_typing'
        > Not tested yet, please provide feedbacks if you are using this.
    * ### Event: 'direct_message_mark_read'
        > Not tested yet, please provide feedbacks if you are using this.
    * ### Event: 'revoke'
        * userId - `string` : Id of the user who revoked the subscription. This is the same id as the UserActivityEmitter instance id.  
    
        Emitted when the user revokes the subscription.
    * ### Event: 'tweet_create'
      * tweet - `<Tweet Object>` : The created tweet object. For more details on Tweet Objects : [Read Twitter's doc](https://developer.twitter.com/en/docs/tweets/data-dictionary/overview/tweet-object)
    * ### Event: 'tweet_delete'
        * tweetDeleteEvent - `Object`: 
            * status - `object`:
                * id - `string`: id of the deleted tweet
                * user_id - `string`: id of the user who deleted tweet
            * timestamp_ms - `string`: Timestamp of when the event happened
        ```json
        {
            "status": {
                "id": "601430178305220608",
                "user_id": "3198576760"
            },
            "timestamp_ms": "1432228155593"
        }
        ```      
      
    For more details on each event : [Read Twitter's doc](https://developer.twitter.com/en/docs/accounts-and-users/subscribe-account-activity/guides/account-activity-data-objects)

# TODO
- [x] Finish documentation
- [ ] Improve direct message events the emitted data object is incomplete
- [ ] Add tests
- [ ] Add a working example
    
# LICENSE    
    MIT License
    
    Copyright (c) 2018 Vivien Anglesio
    
    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:
    
    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.
    
    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.


