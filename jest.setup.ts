import { initializeLogger, reset, setContractImport } from "@vsc.eco/contract-testing-utils";

const uniqueLogDirIdentifier = Date.now();

beforeEach(async () => { 
  const { currentTestName } = expect.getState();
  await initializeLogger(currentTestName, uniqueLogDirIdentifier.toString());
});

const beforeAll = globalThis.beforeAll || globalThis.before;

const contractImport = import("./build/debug");

beforeAll(() => setContractImport(contractImport));

beforeEach(reset);