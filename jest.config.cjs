/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  testRegex: "tests/.*.ts$",
  // testRegex: ["tests/retarget-algo-test.ts"], // TMP
  // testRegex: ["tests/long-term-test.ts"], // TMP
  // testRegex: ["btc-relay-test.ts"], // TMP
  testPathIgnorePatterns: [
    "/node_modules/",
    "/tests/mocks.ts",
    "/tests/debug.ts",
    "/tests/vite-env.d.ts",
  ],
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  globals: {
    "ts-jest": {
      useESM: true,
    },
  },
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "^@@(.*)$": "<rootDir>$1",
  },
  transform: {
    "^.+\\.(t|j)s$": [
      "@swc/jest",
      {
        root: "../..",
      },
    ],
  },
  testTimeout: 999999999, // Set global timeout to 30 seconds
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
};
