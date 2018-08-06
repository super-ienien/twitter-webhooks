const request = require ('request');

module.exports = {

    sendApiRequest (options)
    {
        return new Promise((resolve, reject) => {
            request (options, (error, response, json) =>
            {
                if (error) return reject(error);
                if (response.statusCode >= 200 && response.statusCode < 300)
                {
                    resolve(response);
                }
                else
                {
                    if (Array.isArray(json.errors))
                    {
                        error = new Error (json.errors[0].message);
                        error.code = json.errors[0].code;
                        error.raw = json.body;
                        reject(error);
                    }
                    else
                    {
                        error = new Error (response.body.toString());
                        error.code = -1;
                        error.raw = response.statusCode;
                        reject(error);
                    }
                }
            });
        });
    }

}