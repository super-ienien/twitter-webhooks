const request = require('request');

const percentTwentiesRefExp = /%20/g;
const encodeUriToRfc3986RegExp = /[!'()*]/g;

module.exports = {

    rfc1738 (str) {
        return encodeURIComponent(str)
        .replace(encodeUriToRfc3986RegExp, function (c) {
            return '%' + c.charCodeAt(0).toString(16);
        })
        .replace(percentTwentiesRefExp, '+');
    },

    sendApiRequest (options) {
        return new Promise((resolve, reject) => {
            const r = request(options, (error, response, json) => {
                // console.log(response.headers);
                if (!isNaN(parseInt(response.headers['x-rate-limit-limit']))) {
                    response.rateLimit = {
                        limit: parseInt(response.headers['x-rate-limit-limit']),
                        remaining: parseInt(response.headers['x-rate-limit-remaining']),
                        reset: parseInt(response.headers['x-rate-limit-reset'])
                    };
                }
                if (error) {
                    error.statusCode = -1;
                    return reject(error);
                }
                if (response.statusCode >= 200 && response.statusCode < 300) {
                    resolve(response);
                } else {
                    if (Array.isArray(json.errors)) {
                        error = new Error(json.errors[0].message);
                        error.code = json.errors[0].code;
                    } else {
                        error = new Error(response.statusMessage);
                        error.code = -1;
                    }
                    error.statusCode = response.statusCode;
                    error.body = json;
                    if (response.rateLimit) error.rateLimit = response.rateLimit;
                    reject(error);
                }
            });

            console.log(r.headers);
            console.log(r);
        });
    }
};
