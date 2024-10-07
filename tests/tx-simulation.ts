import { assert, expect } from "chai";
import { contract, initializationState, reset, setContractImport, stateCache } from "@vsc.eco/contract-testing-utils";
import { retargetAlgorithmVector } from "@@/test-data/retargetAlgoVector";
import * as IPFS from 'kubo-rpc-client'
import Axios from 'axios'

const beforeAll = globalThis.beforeAll || globalThis.before;

const contractImport = import("../build/debug");

beforeAll(() => setContractImport(contractImport));

beforeEach(reset);

describe("tx simulation test", () => {
  // only works in the next version of the contract-testing-utils
  // it('fetches the tx and simulates it locally', async () => {
  //   const inputTxId = 'bafyreie3xeb2bykfhth7fjrcamn3j5pne7pdubrsfedrgnx62ch5gpuhpi';
  //   // const VSC_API = 'http://100.91.44.45:1337'
  //   const VSC_API = 'http://192.168.2.101:1337'
  //   await simulateLiveTx(inputTxId, VSC_API)
  // });
});