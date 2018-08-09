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
    environment: '[your-env]' //default : 'env-beta'
    app
});

//Register your webhook url - just needed once per URL
userActivityWebhook.register();

//Subscribe for a particular user activity
userActivityWebhook.subscribe({
    userId: '[TWITTER USER ID]'
    accessToken: '[TWITTER USER ACCESS TOKEN]',
    accessTokenSecret: '[TWITTER USER ACCESS TOKEN SECRET]'
})
.then(function (userActivity) {
    userActivity
    .on('favorite', (data) => console.log (userActivity.id + ' - favorite'))
    .on ('tweet_create' (data) => console.log (userActivity.id + ' - tweet_create'))
    .on ('follow' (data) => console.log (userActivity.id + ' - follow'))
    .on ('mute' (data) => console.log (userActivity.id + ' - mute'))
    .on ('revoke' (data) => console.log (userActivity.id + ' - revoke'))
    .on ('direct_message' (data) => console.log (userActivity.id + ' - direct_message'))
    .on ('direct_message_indicate_typing' (data) => console.log (userActivity.id + ' - direct_message_indicate_typing'))
    .on ('direct_message_mark_read' (data) => console.log (userActivity.id + ' - direct_message_mark_read'))
    .on ('tweet_delete' (data) => console.log (userActivity.id + ' - tweet_delete'))
});

//listen to any user activity
userActivityWebhook.on ('event', (event, userId, data) => console.log (userId + ' - favorite');

//listen to unknown payload (in case of api new features)
userActivityWebhook.on ('unknown-event', (rawData) => console.log (rawData);

```

### Reference

UserActivityWebhook

- getWebook(options)
    - options.env

- getWebooks(options)
    - options.env
        
- register(options)
    - options.env
    
- subscribe(options)
    - options.accessToken
    - options.accessTokenSecret
    - options.userId
    - options.env

- unregister(options)
    - options.env

- unsubscribe(options)
    - options.accessToken
    - options.accessTokenSecret
    - options.userId
    - options.env
    
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


