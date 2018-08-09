const EventEmitter = require('events');

class UserActivityEmitter extends EventEmitter {

    constructor (args) {
        super();
        this.id = args.userId;
    }
}

module.exports = UserActivityEmitter;
