/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  testRegex: "tests/.*.ts$",
  testPathIgnorePatterns: [
    "/node_modules/",
    "/tests/mocks.ts",
    "/tests/debug.ts",
    "/tests/vite-env.d.ts",
    "/tests/btc-relay-test.ts",
    "/tests/retarget-algo-test.ts",
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
  testTimeout: 300000, // Set global timeout to 30 seconds
};
