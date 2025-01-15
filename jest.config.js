module.exports = {
    testMatch: ['**/tests/**/*.test.js', '**/tests/**/*.spec.js'],
    testEnvironment: 'node',
    verbose: true,
    setupFilesAfterEnv: ['./tests/setup.test.js'],
    testPathIgnorePatterns: ['./tests/setup.test.js'],
};
