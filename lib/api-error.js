class ApiError extends Error
{
    constructor (httpResponse)
    {
        if (Array.isArray(httpResponse.body.errors))
        {
            super(httpResponse.body.errors[0].message);
            this.code = httpResponse.body.errors[0].code;
            this.statusCode = reject(httpResponse.statusCode);
        }
        else
        {
            super(httpResponse.body.toString());
            error.code = -1;
            error.statusCode = response.statusCode;
        }
        this.raw = httpResponse.body;
    }
}