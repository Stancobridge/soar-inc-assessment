const getParamNames = require('./_common/getParamNames');
const HTTP_STATUS = require('./_common/HttpStatus');
/**
 * scans all managers for exposed methods
 * and makes them available through a handler middleware
 */

module.exports = class ApiHandler {

    /**
     * @param {object} containing instance of all managers
     * @param {string} prop with key to scan for exposed methods
     */

    constructor({config, cortex, cache, managers, mwsRepo, prop}){
        this.config        = config;
        this.cache         = cache;
        this.cortex        = cortex;
        this.managers      = managers;
        this.mwsRepo       = mwsRepo;
        this.mwsExec       = this.managers.mwsExec;
        this.prop          = prop
        this.exposed       = {};
        this.methodMatrix  = {};
        this.auth          = {};
        this.fileUpload    = {};
        this.mwsStack      = {};
        this.mw            = this.mw.bind(this);

        /** filter only the modules that have interceptors */
        // console.log(`# Http API`);
        Object.keys(this.managers).forEach(mk=>{
            if(this.managers[mk][this.prop]){
                // console.log('managers - mk ', this.managers[mk])
                this.methodMatrix[mk]={};
                // console.log(`## ${mk}`);
                this.managers[mk][this.prop].forEach(i=>{
                    /** creating the method matrix */
                    let method = 'post';
                    let fnName = i;
                    if (i.includes('=')) {
                        let frags = i.split('=');
                        method = frags[0];
                        fnName = frags[1];
                    }
                    if (!this.methodMatrix[mk][method]) {
                        this.methodMatrix[mk][method] = [];
                    }

                    if (fnName.includes(':')) {

                        const splittedFnName = fnName.split(':');
                        fnName = splittedFnName[0];
                        const param = splittedFnName[1];

                        if (!this.methodMatrix[mk]['routesWithParams']?.[method] ) {

                            if(!this.methodMatrix[mk]['routesWithParams']){
                                this.methodMatrix[mk]['routesWithParams'] = {};
                            }

                            this.methodMatrix[mk]['routesWithParams'][method] =
                                {
                                    param,
                                    fnName,
                                };
                        } else {
                            throw Error(`Module ${mk} already parametrized for ${method} method`);
                        }

                    }
                    else if (fnName.includes('index.')) {
                        const splittedFnName = fnName.split('.');

                        fnName = splittedFnName[1];


                        if (!this.methodMatrix[mk]['indexedRoute']?.[method]) {

                            if(!this.methodMatrix[mk]['indexedRoute']){
                                this.methodMatrix[mk]['indexedRoute'] = {};
                            }

                            this.methodMatrix[mk]['indexedRoute'][method] = fnName;
                        } else {
                            throw Error(
                                `Module ${mk} already parametrized for ${method} method`
                            );
                        }

                    }
                    else {
                        this.methodMatrix[mk][method].push(fnName);
                    }


                    let params = getParamNames(
                        this.managers[mk][fnName],
                        fnName,
                        mk
                    );
                    params = params.split(',').map((i) => {
                        i = i.trim();
                        i = i.replace('{', '');
                        i = i.replace('}', '');
                        return i;
                    });
                    /** building middlewares stack */

                    params.forEach((param) => {
                        if (!this.mwsStack[`${mk}.${fnName}`]) {
                            this.mwsStack[`${mk}.${fnName}`] = [];
                        }
                        if (param.startsWith('__')) {
                            // this is a middleware identifier
                            // mws are executed in the same order they existed
                            /** check if middleware exists */
                            // console.log(this.mwsRepo);
                            if (!this.mwsRepo[param]) {
                                throw Error(
                                    `Unable to find middleware ${param}`
                                );
                            } else {
                                this.mwsStack[`${mk}.${fnName}`].push(param);
                            }
                        }
                    });

                    // console.log(`* ${i} :`, 'args=', params);
                });
            }
        });

        /** expose apis through cortex */
        Object.keys(this.managers).forEach(mk=>{
            if(this.managers[mk].interceptor){
                this.exposed[mk]=this.managers[mk];
                // console.log(`## ${mk}`);
                if(this.exposed[mk].cortexExposed){
                    this.exposed[mk].cortexExposed.forEach(i=>{
                        // console.log(`* ${i} :`,getParamNames(this.exposed[mk][i]));
                    })
                }
            }
        });

        /** expose apis through cortex */
        this.cortex.sub('*', (d, meta, cb) => {
            let [moduleName, fnName] = meta.event.split('.');
            let targetModule = this.exposed[moduleName];
            if (!targetModule) return cb({ error: `module ${moduleName} not found` });
            try {
                targetModule.interceptor({ data: d, meta, cb, fnName });
            } catch (err) {
                cb({ error: `failed to execute ${fnName}` });
            }
        });

    }


    async _exec({targetModule, fnName, cb, data}){
        let result = {};

            try {
                result = await targetModule[`${fnName}`](data);
            } catch (err){
                console.log(`error`, err);
                result.error = 'Internal server error';
                result.code = HTTP_STATUS.INTERNAL_SERVER_ERROR;
            }

        if(cb)cb(result);
        return result;
    }

     /** a middle for executing admin apis trough HTTP */
    async mw(req, res, next){
        let method = req.method.toLowerCase();
        let moduleName = req.params.moduleName;
        let context = req.params.context;
        let fnName = req.params.fnName || 'index';
        let moduleMatrix = this.methodMatrix[moduleName];

        if(!moduleMatrix) console.log(`module ${moduleName} not found`);

        if(!moduleMatrix?.[method]) console.log(`method ${method} not found for module ${moduleName}`);

        let indexedRoute;
        if (fnName === 'index' && !moduleMatrix?.[method]?.includes(fnName)) {
            indexedRoute = moduleMatrix?.['indexedRoute'];
        }

        const noneParametrizedRoute = moduleMatrix?.[method]?.includes(fnName);

        if(!noneParametrizedRoute) console.log(`function ${fnName} not in exposed methods of ${moduleName} module`);

        const parametrizedRoute = !indexedRoute ?
            this.methodMatrix[moduleName]?.['routesWithParams']?.[method] :
            undefined;

        if(!parametrizedRoute) console.log(`no parametrized route for ${method} method in ${moduleName} module`);

        const isDefaultIndexRouteExposed = noneParametrizedRoute && fnName === 'index';

        // if there is no none parametrized route and no parametrized route, return with error
        if (!noneParametrizedRoute && !parametrizedRoute && !indexedRoute && !isDefaultIndexRouteExposed) {
            return this.managers.responseDispatcher.dispatch(res, {
                ok: false,
                code: HTTP_STATUS.NOT_FOUND,
                message: `${method.toUpperCase()} request to ${req.path} not found`,
            });
        }


        if (indexedRoute) {
            fnName = indexedRoute[method];
        }

        // if there is a parametrized route, set the params and fnName
        if (parametrizedRoute) {
            req.params = {
                [parametrizedRoute.param]: fnName,
                fnName: parametrizedRoute.fnName,
            };
            fnName = parametrizedRoute.fnName;
        }

        let targetStack = this.mwsStack[`${moduleName}.${fnName}`];


        let hotBolt = this.mwsExec.createBolt({
            stack: targetStack,
            req,
            res,
            onDone: async ({ req, res, results }) => {
                /** executed after all middleware finished */

                let body = req.body || {};
                let result = await this._exec({
                    targetModule: this.managers[moduleName],
                    fnName,
                    data: {
                        ...body,
                        ...results,
                        res,
                    },
                });
                if (!result) result = {};

                if (result.selfHandleResponse) {
                    // do nothing if response handled
                } else if (result.errors || result.error) {
                        const errors = result.errors || result.error;
                        return this.managers.responseDispatcher.dispatch(res, {
                            ok: false,
                            errors,
                            message: result.message,
                            code: result.code,
                        });
                    } else if (result.data) {
                        return this.managers.responseDispatcher.dispatch(res, {
                            ok: true,
                            data: result.data,
                            code: result.code,
                            message: result.message,
                        });
                    } else {
                        console.log('Invalid response from', moduleName, fnName);
                        return this.managers.responseDispatcher.dispatch(res, {
                            ok: false,
                            errors: [],
                            code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
                            message: 'Internal server error',
                        });
                    }

            },
        });
        hotBolt.run();
    }
}