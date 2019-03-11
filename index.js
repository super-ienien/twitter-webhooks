const debug = require('util').debuglog('twitter-webhooks');
debug('DEBUG MODE ENABLED');
module.exports.userActivity = require('./lib/user-activity-webhook');
