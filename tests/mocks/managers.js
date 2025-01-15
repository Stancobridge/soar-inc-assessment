const mockResponseTransformer = {
    successTransformer: ({ message, data, code }) => ({
        message,
        data,
        code,
    }),
    errorTransformer: ({ message, error, code }) => ({
        message,
        errors: error,
        code,
    }),
};

module.exports = {
    mockResponseTransformer,
};