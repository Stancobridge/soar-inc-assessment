module.exports = class ResponseTransformer {
    errorTransformer({message, error, code }){
        const errorResponse = { message, code };

        if (Array.isArray(error)) {

            errorResponse.errors = error.map(err => {
                if(typeof err === 'string') return {message: err};
                if(err.message) return err;
                return {message: err.message};
            });
        } else if (error) {
            if(typeof error === 'string') errorResponse.errors = [{message: error}];
            if(error.message) errorResponse.errors = [{message: error.message}];
            else errorResponse.errors = [{message: error}];
        } else {
            errorResponse.errors = [{message: message}];
        }


        return errorResponse;
    }

    successTransformer({message, data, code}){
        return {
            message,
            data,
            code,
        }
    }
}