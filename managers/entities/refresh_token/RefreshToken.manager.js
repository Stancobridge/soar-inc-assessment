const bcrypt      = require('bcrypt');
const HTTP_STATUS = require('../../api/_common/HttpStatus');
const md5         = require('md5');
const { nanoid }  = require('nanoid');
module.exports = class RefreshTokenManager {
    constructor({ config, cache, managers, mongomodels, validators }) {
        this.config = config;
        this.cache = cache;
        this.managers = managers;
        this.mongomodels = mongomodels;
        this.validators = validators;
        this.httpExposed = ['post=index.refreshAuthenticationToken'];
    }

    async createRefreshToken({ userId, username }) {
        try {
            const refreshToken = this.managers.token.genLongToken({
                userId,
                userKey: username,
            });

            const salt = await bcrypt.genSalt(10);
            const validationKey = await bcrypt.hash(refreshToken, salt);

            const userRefreshToken = await this.mongomodels.RefreshToken.findOne({ userId });

            if (userRefreshToken) {
                userRefreshToken.validation_key = validationKey;
                userRefreshToken.is_used = false;
                await userRefreshToken.save();
            } else {
                await this.mongomodels.RefreshToken.create({
                    userId,
                    validation_key: validationKey,
                    is_used: false,
                });
            }

            return refreshToken;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async refreshAuthenticationToken({refreshToken, __device, __authentication}) {
        try {
            const validationResult = await this.validators.refresh_token.refreshAuthenticationToken({ refreshToken });

        if(validationResult) return this.managers.responseTransformer.errorTransformer({
            message: "Refresh token is required", error: validationResult, code: HTTP_STATUS.UNPROCESSABLE_ENTITY
        });

        const userRefreshToken = await this.mongomodels.RefreshToken.findOne({ userId: __authentication._id });



        if (!userRefreshToken) {
            return this.managers.responseTransformer.errorTransformer({
                message: 'Invalid refresh token',
                error: [],
                code: HTTP_STATUS.FORBIDDEN,
            });
        }

        if (userRefreshToken.is_used) {
            return this.managers.responseTransformer.errorTransformer({
                message: 'Refresh token already used',
                error: [],
                code: HTTP_STATUS.BAD_REQUEST,
            });
        }

        const isRefreshTokenValid = await bcrypt.compare(refreshToken, userRefreshToken.validation_key);
        if (!isRefreshTokenValid) {
            return this.managers.responseTransformer.errorTransformer({
                message: 'Invalid refresh token',
                error: [],
                code: HTTP_STATUS.BAD_REQUEST,
            });
        }

        userRefreshToken.is_used = true;
        await userRefreshToken.save();

        const decoded = this.managers.token.verifyLongToken({
            token: refreshToken,
        });

        if (!decoded) {
            return this.managers.responseTransformer.errorTransformer({
                message: 'Invalid refresh token',
                error: [],
                code: HTTP_STATUS.BAD_REQUEST,
            });
        }

         const authToken = await this.managers.token.genShortToken({
             userId: decoded.userId,
             userKey: decoded.userKey,
             deviceId: md5(__device),
            sessionId: nanoid(),
        });

        const newRefreshToken = await this.createRefreshToken({
            userId: decoded.userId,
            username: decoded.userKey,
        });

        return this.managers.responseTransformer.successTransformer({
                data: { authToken, refreshToken: newRefreshToken },
                message: 'Refresh token refreshed successfully',
                code: HTTP_STATUS.OK,
            });
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
};