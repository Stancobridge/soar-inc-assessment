const useragent         = require('useragent');
const HTTP_STATUS       = require('../managers/api/_common/HttpStatus');

module.exports = ({ managers }) => {
    return async ({ req, res, next }) => {

        const authToken = req.headers['authorization']?.split(' ')[1];

        if (!authToken) {
            console.log('authorization token required but not found');
            return managers.responseDispatcher.dispatch(res, { ok: false, code: HTTP_STATUS.UNAUTHORIZED, message: 'Unauthorized' });
        }

        let decoded = null;
        try {
            decoded = managers.token.verifyShortToken({ token: authToken });

            if (!decoded) {
                return managers.responseDispatcher.dispatch(res, { ok: false, code: HTTP_STATUS.UNAUTHORIZED, message: 'Unauthorized' });
            }

            // Confirm user exists in the database
            const user = await managers.user.getUser({ userId: decoded.userId });

            if (!user) {
                return managers.responseDispatcher.dispatch(res, { ok: false, code: HTTP_STATUS.UNAUTHORIZED, message: 'Unauthorized' });
            }


            next(user);
        } catch (err) {
            console.log('token verification failed', err);
            return managers.responseDispatcher.dispatch(res, { ok: false, code: HTTP_STATUS.UNAUTHORIZED, message: 'Unauthorized' });
        }

    }
}