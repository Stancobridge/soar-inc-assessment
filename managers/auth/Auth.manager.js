const bcrypt            = require('bcrypt');
const HTTP_STATUS = require('../api/_common/HttpStatus');
const { nanoid }        = require('nanoid');
const md5               = require('md5');

module.exports = class AuthManager {
   constructor({ managers, mongomodels, validators }){
        this.managers            = managers;
        this.mongomodels         = mongomodels;
        this.validators          = validators;
        this.httpExposed = [ 'login', 'register' ];
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

        const refreshToken = await this.managers['refresh-tokens'].createRefreshToken({
            userId: user._id.toString(),
            username: user.username,
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
                authToken,
                refreshToken,
            },
            code: HTTP_STATUS.CREATED
        });
    } catch (error) {
        console.log('error',error);
        return this.managers.responseTransformer.errorTransformer({
            message: 'Internal server error',
            error: [],
                code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            });
        }
    }

    async register({ username, password, confirm_password, email, first_name, last_name }) {
        let user;
        try {
            // Validate registration data
            let result = await this.validators.auth.register({
                username,
                password,
                confirm_password,
                email,
                first_name,
                last_name
            });

            if (result) return this.managers.responseTransformer.errorTransformer({
                message: "Invalid registration data",
                error: result,
                code: HTTP_STATUS.UNPROCESSABLE_ENTITY
            });

            if(password !== confirm_password) {
                return this.managers.responseTransformer.errorTransformer({
                    message: "Password and confirm password do not match",
                    code: HTTP_STATUS.UNPROCESSABLE_ENTITY
                });
            }

            // Check if username already exists
            const existingUser = await this.mongomodels.User.findOne({
                $or: [{ username }, { email }]
            });

            if (existingUser) {
                return this.managers.responseTransformer.errorTransformer({
                    message: "Username or email already taken",
                    code: HTTP_STATUS.CONFLICT
                });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create new user
            user = await this.mongomodels.User.create({
                username,
                password: hashedPassword,
                email,
                first_name,
                last_name
            });

            // Generate tokens
            const authToken = await this.managers.token.genShortToken({
                userId: user._id.toString(),
                userKey: user.username,
                deviceId: md5('default'), // Since __device isn't passed during registration
                sessionId: nanoid()
            });

            const refreshToken = await this.managers['refresh-tokens'].createRefreshToken({
                userId: user._id.toString(),
                username: user.username,
            });

            return this.managers.responseTransformer.successTransformer({
                message: 'Registration successful',
                data: {
                    user: {
                        username: user.username,
                        email: user.email,
                        first_name: user.first_name,
                        last_name: user.last_name,
                    },
                    authToken,
                    refreshToken,
                },
                code: HTTP_STATUS.CREATED
            });

        } catch (error) {
            console.log(error);
            if(user) {
                await user.deleteOne();
            }
            return this.managers.responseTransformer.errorTransformer({
                message: 'Internal server error',
                error: [],
                code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            });
        }
    }
}
