import { assert, expect } from "chai";
import { contract, reset, setContractImport, stateCache } from "@vsc.eco/contract-testing-utils";
import { retargetAlgorithmVector } from "@@/test-data/retargetAlgoVector";
import * as IPFS from 'kubo-rpc-client'
import Axios from 'axios'

const beforeAll = globalThis.beforeAll || globalThis.before;

const contractImport = import("../build/debug");

beforeAll(() => setContractImport(contractImport));

beforeEach(reset);

describe("tx simulation test", () => {
  it('aafetches the tx and simulates it locally', async () => {
    console.log('aaa')
  })
  it('fetches the tx and simulates it locally', async () => {
    const outputTxId = 'bafyreig6vo2zi7rbhc5pendq42ruagf2toby2nnbjwkrs4b4ctbmxbrdmi';
    const VSC_API = 'http://192.168.2.101:1338'
    const STATE_GQL = `
        query MyQuery($contractId: String) {
          contractState(id: $contractId){
            state
          }
        }
    `

    const { data } = await Axios.post(`${VSC_API}/api/v1/graphql`, {
        query: STATE_GQL,
        variables: {
            contractId: outputTxId
        },
    })
    const state = data.data.contractState.state

    for (let key in state) {
      stateCache[key] = state[key]
    }

    // impl something in api to get this working
    
    // const callTxId = IPFS.CID.parse('bafyreifq5ga5xnnmnqcsgfp4vf55uv6putupqeopbiukmuciq2i2wh2vai');
    // const ipfs = IPFS.create({ url: process.env.IPFS_HOST || 'http://192.168.2.100:5001' })
    // const result = await ipfs.dag.get(callTxId)
    // const inputData = JSON.stringify(result.value.tx.payload)

    // contract.processHeaders(inputData)
  });
});