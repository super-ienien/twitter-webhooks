const axios = require('axios');

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

    async sendApiRequest (options) {
        try {
            return axios(options);
        } catch (e) {
            if (e.response) {
                let error;
                if (e.response.data && Array.isArray(e.response.data.errors)) {
                    error = new Error(e.response.data.errors[0].message);
                    error.code = e.response.data.errors[0].code;
                } else {
                    error = new Error(e.response.statusText);
                    error.code = -1;
                }
                error.statusCode = e.response.status;
                error.body = error.response.data;
                throw error;
            } else {
                e.statusCode = -1;
                throw e;
            }
        }
    }
};
