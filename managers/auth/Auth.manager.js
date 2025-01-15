const bcrypt            = require('bcrypt');
const HTTP_STATUS = require('../api/_common/HttpStatus');
const { nanoid }        = require('nanoid');
const md5               = require('md5');

module.exports = class AuthManager {
   constructor({ managers, mongomodels, validators }){
        this.managers            = managers;
        this.mongomodels         = mongomodels;
        this.validators          = validators;
        this.httpExposed = [ 'login' ];
    }

    async login({ username, password, __device }) {

        try {
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



        return this.managers.responseTransformer.successTransformer({
            message: 'Login successful',
            data: {
                user : {
                    username: user.username,
                    email: user.email,
                    first_name: user.first_name,
                    last_name: user.last_name,
                },
                authToken
            },
            code: HTTP_STATUS.CREATED
        });
    } catch (error) {
        return this.managers.responseTransformer.errorTransformer({
            message: 'Internal server error',
            error: [],
                code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            });
        }
    }
}