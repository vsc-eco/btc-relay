import { contract, reset, setContractImport, simulateLiveTx } from "@vsc.eco/contract-testing-utils";

const beforeAll = globalThis.beforeAll || globalThis.before;

const contractImport = import("../build/debug");

beforeAll(() => setContractImport(contractImport));

beforeEach(reset);

describe("tx simulation test", () => {
  // only works in the next version of the contract-testing-utils
  xit('fetches the tx and simulates it locally', async () => {
    const inputTxId = 'bafyreih45lbwjtarggjdghlqwe3n4rhcsqiwtlc4mooyulgvbicpaa4pom';
    await simulateLiveTx(inputTxId)
  });
});

