# Twitter Webhooks
This module provide a simple way to implement twitter webhooks with ExpressJs.

*This module is very new and is currently being tested to be used in production soon. The documentation is not finished yet. Feel free to make requests or to give some feedbacks in the github issues.*

### Requirements

- This is an ExpressJS middleware so Express must be installed with your app
- body-parser JSON middleware must be added mount on your Express app
- Your server must be reachable with https because twitter doesn't accept unsecured webhooks.

### Install

`npm i -s twitter-webhooks`

### Usage

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

### Reference

*  **twitterWebhooks.userActivity(*config*)** - `return UserActivity`
    * **config.serverUrl** - `string`: The server URL were twitter can reach the webhook app (eg: 'https://my.aweso.me/service')
    * **config.route** - `string`: the route of the middleware in the app (eg: '/user-activity-webhook')
    * **config.consumerKey** - `string`: Your Twitter app consumerKey
    * **config.consumerSecret** - `string`: Your Twitter app consumerSecret
    * **config.accessToken** - `string`: Your Twitter app accessToken
    * **config.accessTokenSecret** - `string`: Your Twitter app accessTokenSecret
    * **config.environment** - `string`: The environment name of the webhook. You can find it in your [twitter dashboard](https://developer.twitter.com/en/dashboard)
    * **config.app** - `Express App` *(optional)*: The express app on which mount the middleware. If not provided don't forget to mount the middleware (eg : `app.use(userActivity.route, userActivity)` )
    
    This method construct a ready to use userActivity middleware.  

#### UserActivity middleware

* **getSubscriptionsCount()**  - `return Promise<Integer>`  
    Get the subscriptions count of your Twitter app. 

    ```json
    //response
    {
        "subscriptions_count_all": "2",
        "subscriptions_count_direct_messages": "1"
    }
    ```
* **getWebook()**  - `return Promise<Object>`   
Get informations about the current registered webhooks of an environment. 
    > Warning : This method will certainly be modified.

    ```json
    //response
    [
      {
        "id": "1234567890",
        "url": "https://my.aweso.me/service/user-activity-webhook",
        "valid": true,
        "created_at": "2016-06-02T23:54:02Z"
      }
    ]
    ```

* **getWebooks()** - `return Promise<Object>`   
Get informations about webhooks for all the environments of your twitter app. [Read Twitter's doc](https://developer.twitter.com/en/docs/accounts-and-users/subscribe-account-activity/api-reference/aaa-premium#get-account-activity-all-webhooks)

* **isSubscribed()** - `return Promise<Boolean>`   
    * **options.accessToken** - `string` : The twitter account accessToken
    * **options.accessTokenSecret** - `string` : The twitter account accessTokenSecret
    * **options.userId** - `string` : The twitter account Id
    
   Check if a subscription exists for a twitter account. The returned promise resolve to `true` if the subscription exists and to `false` if it does'nt.

* **register()** - `return Promise<Object>`  
Registers the webhook with the parameters given in the config of the middleware constructor. [Read Twitter's doc](https://developer.twitter.com/en/docs/accounts-and-users/subscribe-account-activity/api-reference/aaa-premium#post-account-activity-all-env-name-webhooks)
    ```json
    //response
    {
      "id": "1234567890",
      "url": "https://my.aweso.me/service/user-activity-webhook",
      "valid": true,
      "created_at": "2016-06-02T23:54:02Z"
    }
    ```

* **subscribe(options)** - `return Promise<UserActivityEmitter>`
    * **options.accessToken** - `string` : The twitter account accessToken
    * **options.accessTokenSecret** - `string` : The twitter account accessTokenSecret
    * **options.userId** - `string` : The twitter account Id
    
    Subscribes to all events of a twitter account. The success value of the returned promise is an UserActivityEmitter object that will emit all the events received for this account on the webhook.

* **triggerChallengeResponseCheck(options)**
    * **options.webhookId** - `string` : The webhook id
    
    manually trigger a CRC request on the webhook. [Read Twitter's doc](https://developer.twitter.com/en/docs/accounts-and-users/subscribe-account-activity/api-reference/aaa-premium#put-account-activity-all-env-name-webhooks-webhook-id)
    
* **unregister()** - `return Promise`  
    Unregisters the webhook with the parameters given in the config of the middleware constructor. [Read Twitter's doc](Registers the webhook with the parameters given in the config of the middleware constructor. [Read Twitter's doc](https://developer.twitter.com/en/docs/accounts-and-users/subscribe-account-activity/api-reference/aaa-premium#post-account-activity-all-env-name-webhooks)

* **unsubscribe(options)** - `return Promise<>`
    * **options.accessToken** - `string` : The twitter account accessToken
    * **options.accessTokenSecret** - `string` : The twitter account accessTokenSecret
    * **options.userId** - `string` : The twitter account Id
    
    Deletes a subscription.
    
#### UserActivityEmitter 
*You can refer to the example above until this part of the documentation is done* 
    
# TODO
    - [ ] Finish documentation
    - [ ] Add some automation helpers like auto-delete subscription on user revoke event 
          or auto check url callback on webhook registration.
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


