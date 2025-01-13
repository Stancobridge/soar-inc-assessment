const bcrypt  = require('bcrypt');
const HTTP_STATUS_CODES = require('../api/_common/HttpStatus');
module.exports = class AuthManager {
   constructor({ config, managers, mongomodels, validators }){
        this.config              = config;
        this.managers            = managers;
        this.mongomodels         = mongomodels;
        this.validators          = validators;
        this.httpExposed         = ['login'];
    }

    async login({ username, password }){

        let result = await this.validators.auth.login({ username, password });

        if(result) return this.managers.responseTransformer.errorTransformer({
            message: "Invalid login data", error: result, code: HTTP_STATUS_CODES.UNPROCESSABLE_ENTITY
        });

        const user = await this.mongomodels.User.findOne({ username });

        if(!user) return this.managers.responseTransformer.errorTransformer({
            message: "Invalid login credentials", code: HTTP_STATUS_CODES.UNPROCESSABLE_ENTITY
        });

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if(!isPasswordValid) return this.managers.responseTransformer.errorTransformer({
            message: "Invalid login credentials", code: HTTP_STATUS_CODES.UNPROCESSABLE_ENTITY
        });

        const authToken = await this.managers.token.genLongToken({userId: user._id, userKey: user.username});

        return {user : {username: user.username, email: user.email, first_name: user.first_name, last_name: user.last_name}, authToken};
    }
}