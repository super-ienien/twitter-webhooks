const request = require('request');

module.exports = {

    sendApiRequest (options) {
        return new Promise((resolve, reject) => {
            request(options, (error, response, json) => {
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
                    reject(error);
                }
            });
        });
    }
};