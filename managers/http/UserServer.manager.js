const http              = require('http');
const express           = require('express');
const cors              = require('cors');
const rateLimiter       = require('../../rate_limiter/rate.limiter');
const HTTP_STATUS       = require('../api/_common/HttpStatus');
const app               = express();
const helmet            = require('helmet');

module.exports = class UserServer {
    constructor({config, managers}){
        this.config        = config;
        this.userApi       = managers.userApi;
    }

    /** for injecting middlewares */
    use(args){
        app.use(args);
    }

    /** server configs */
    run(){
        app.use(cors({origin: '*'}));
        app.use(helmet());
        app.use(rateLimiter);
        app.use(express.json());
        app.use(express.urlencoded({ extended: true}));
        app.use('/static', express.static('public'));

        /** an error handler */
        app.use((err, req, res, next) => {
            if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
                // Handle JSON parsing errors
                return res.status(400).send({
                    message: 'Invalid JSON payload',
                    ok: false,
                    errors: [err.message],
                    code: HTTP_STATUS.BAD_REQUEST,
                });
            }

            // Handle other errors
            res.status(500).send({
                message: 'Internal server error',
                ok: false,
                errors: [],
                code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            });
        });

        /** a single middleware to handle all */
        app.all('/api/:moduleName/:fnName?', this.userApi.mw);

        let server = http.createServer(app);
        server.listen(this.config.dotEnv.USER_PORT, () => {
            console.log(`${(this.config.dotEnv.SERVICE_NAME).toUpperCase()} is running on port: ${this.config.dotEnv.USER_PORT}`);
        });
    }
}