/**
 * jest.unit.config.js
 * Lightweight Jest configuration for pure unit tests (no native modules).
 * These tests run without Expo's preset, which requires a React Native env.
 *
 * Usage: npx jest --config jest.unit.config.js
 */
module.exports = {
  displayName: "unit",
  testEnvironment: "node",
  preset: "ts-jest",
  testMatch: [
    "**/__tests__/sentiment.test.ts",
    "**/__tests__/auth.test.ts",
  ],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          jsx: "react",
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          moduleResolution: "node",
        },
        diagnostics: false, // suppress TS errors in tests
      },
    ],
  },
  moduleNameMapper: {
    // Stub out native modules not used in unit tests
    "^expo.*$": "<rootDir>/__mocks__/expoStub.js",
    "^react-native$": "<rootDir>/__mocks__/reactNativeStub.js",
    "^@react-native.*$": "<rootDir>/__mocks__/expoStub.js",
  },
  transformIgnorePatterns: ["node_modules/(?!(ts-jest)/)"],
};
