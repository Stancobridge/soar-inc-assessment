const HTTP_STATUS = require('../managers/api/_common/HttpStatus');


module.exports = ({ managers }) => {
    return async ({req, res, next}) => {

        const authToken = req.headers['authorization']?.split(' ')[1];

        if (!authToken) {
            return managers.responseDispatcher.dispatch(res,
                { ok: false, code: HTTP_STATUS.UNAUTHORIZED, message: 'Unauthorized' }
            );
        }

        const decoded = managers.token.verifyShortToken({ token: authToken });

        if (!decoded) {
            return managers.responseDispatcher.dispatch(res, { ok: false, code: HTTP_STATUS.UNAUTHORIZED, message: 'Unauthorized' });
        }

        const roles = await managers.user.getUserRoles({ userId: decoded.userId });


        const isSuperAdmin = roles.some(role => role === 'school-administrator');

        if (!isSuperAdmin) {
            return managers.responseDispatcher.dispatch(res, { ok: false, code: HTTP_STATUS.FORBIDDEN, message: 'Forbidden Resource' });
        }

        next();
    }
}