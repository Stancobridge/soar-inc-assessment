const HTTP_STATUS = require("../api/_common/HttpStatus");

module.exports = class ResponseDispatcher {
    constructor(){
        this.key = "responseDispatcher";
    }
    dispatch(res, {ok, data, code, errors, message, msg}){
        let statusCode = code? code: (ok==true)? HTTP_STATUS.OK: HTTP_STATUS.BAD_REQUEST;
        return res.status(statusCode).send({
            message: msg || message ||'',
            ok: ok || false,
            data: data || {},
            errors: errors || [],
        });
    }
}