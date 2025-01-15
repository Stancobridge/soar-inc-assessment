const bcrypt            = require('bcrypt');
const HTTP_STATUS = require('../api/_common/HttpStatus');
const { nanoid }        = require('nanoid');
const md5               = require('md5');

module.exports = class AuthManager {
   constructor({ config, managers, mongomodels, validators }){
        this.config              = config;
        this.managers            = managers;
        this.mongomodels         = mongomodels;
        this.validators          = validators;
        this.httpExposed = [
            'login',
            'index',
            'get=index',
            // 'get=index:id',
            // 'get=main',
        ];
    }


    async index({ __device, __params }) {
        console.log({ __params })
        return {ok: true, message: 'Auth module is running'};
    }

    async main({ __device, __params }) {
        return {ok: true, message: 'Auth module is running for main'};
    }

    async login({ username, password, __device }) {

        let result = await this.validators.auth.login({ username, password });

        if(result) return this.managers.responseTransformer.errorTransformer({
            message: "Invalid login data", error: result, code: HTTP_STATUS.UNPROCESSABLE_ENTITY
        });

        const user = await this.mongomodels.User.findOne({ username });

        if (!user) {
            return this.managers.responseTransformer.errorTransformer({
                message: "Invalid login credentials", code: HTTP_STATUS.UNPROCESSABLE_ENTITY
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if(!isPasswordValid) {
            return this.managers.responseTransformer.errorTransformer({
                message: "Invalid login credentials", code: HTTP_STATUS.UNPROCESSABLE_ENTITY
            });
        }

        const authToken = await this.managers.token.genShortToken({
            userId: user._id.toString(),
            userKey: user.username,
            deviceId: md5(__device),
            sessionId: nanoid()
        });



        return {user : {username: user.username, email: user.email, first_name: user.first_name, last_name: user.last_name}, authToken};
    }
}