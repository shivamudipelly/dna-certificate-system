export default {
    transform: {},
    testEnvironment: 'node',
    coverageProvider: 'v8',
    testMatch: ["**/tests/**/*.js"],
    collectCoverageFrom: [
        "src/**/*.js",
        "!src/server.js",
        "!src/app_test.js",
        "!src/config/index.js",
        "!src/utils/logger.js"
    ],
    coverageThreshold: {
        global: {
            statements: 70,
            branches: 70,
            functions: 70,
            lines: 70
        }
    }
};
