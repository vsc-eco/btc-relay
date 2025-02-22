import { reset, setContractImport } from "@vsc.eco/contract-testing-utils";

const tests = import.meta.glob("./**/*.ts");
// const tests = import.meta.glob("./**/tx-simulation.ts");
// const tests = import.meta.glob("./**/long-term-test.ts");
// const tests = import.meta.glob("./**/btc-relay-test.ts");
const ignoreFiles = ["./debug.ts", "./vite-env.d.ts",];

const beforeAll = globalThis.beforeAll || globalThis.before;

const contractImport = import("../build/debug");

beforeAll(() => setContractImport(contractImport));

beforeEach(reset);

await Promise.all(
  Object.entries(tests).map(async ([path, module]) => {
    if (ignoreFiles.includes(path)) {
      return;
    }
    await module();
  })
);

export {};
