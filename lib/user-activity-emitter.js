const EventEmitter = require('events');

class UserActivityEmitter extends EventEmitter
{
    constructor(args, middleware)
    {
        super();
        this.id = args.userId;
        this.unsubscribe = () =>
        {
            return middleware.unsubscribe(args);
        }
    }
}

module.exports = UserActivityEmitter;