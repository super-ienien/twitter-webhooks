const {debuglog} = require('util')('twitter-webhooks');
debuglog('DEBUG MODE ENABLED');
module.exports.userActivity = require('./lib/user-activity-webhook');
