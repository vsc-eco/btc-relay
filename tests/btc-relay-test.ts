import { firstTenBTCBlocks, headers0to100, headers100to200, headers200to250 } from "../test-data/BTCBlocks"
import { assert, expect } from "chai";
import { contract, finalizeTransaction, reset, setContractImport, stateCache, tmpState } from "@vsc.eco/contract-testing-utils";
import { initializeAtSpecificBlock } from '../build/debug';
import { retargetAlgorithmVector } from "@@/test-data/retargetAlgoVector";

const beforeAll = globalThis.beforeAll || globalThis.before;

const contractImport = import("../build/debug");

beforeAll(() => setContractImport(contractImport));

beforeEach(reset);

const BLOCK_ZERO_HEADER_HASH = "0100000000000000000000000000000000000000000000000000000000000000000000003ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a29ab5f49ffff001d1dac2b7c";

describe("general processHeaders tests", () => {
  it("should process and verify BTC headers", () => {
    // arrange
    const testHeaders = [
      BLOCK_ZERO_HEADER_HASH,
      "010000006fe28c0ab6f1b372c1a6a246ae63f74f931e8365e15a089c68d6190000000000982051fd1e4ba744bbbe680e1fee14677ba1a3c3540bf7b1cdb606e857233e0e61bc6649ffff001d01e36299",
      "010000004860eb18bf1b1620e37e9490fc8a427514416fd75159ab86688e9a8300000000d5fdcc541e25de1c7a5addedf24858b8bb665c9f36ef744ee42c316022c90f9bb0bc6649ffff001d08d2bd61",
      "01000000bddd99ccfda39da1b108ce1a5d70038d0a967bacb68b6b63065f626a0000000044f672226090d85db9a9f2fbfe5f0f9609b387af7be5b7fbb7a1767c831c9e995dbe6649ffff001d05e0ed6d",
      "010000004944469562ae1c2c74d9a535e00b6f3e40ffbad4f2fda3895501b582000000007a06ea98cd40ba2e3288262b28638cec5337c1456aaf5eedc8e9e5a20f062bdf8cc16649ffff001d2bfee0a9",
      "0100000085144a84488ea88d221c8bd6c059da090e88f8a2c99690ee55dbba4e00000000e11c48fecdd9e72510ca84f023370c9a38bf91ac5cae88019bee94d24528526344c36649ffff001d1d03e477",
      "01000000fc33f596f822a0a1951ffdbf2a897b095636ad871707bf5d3162729b00000000379dfb96a5ea8c81700ea4ac6b97ae9a9312b2d4301a29580e924ee6761a2520adc46649ffff001d189c4c97",
      "010000008d778fdc15a2d3fb76b7122a3b5582bea4f21f5a0c693537e7a03130000000003f674005103b42f984169c7d008370967e91920a6a5d64fd51282f75bc73a68af1c66649ffff001d39a59c86",
      "010000004494c8cf4154bdcc0720cd4a59d9c9b285e4b146d45f061d2b6c967100000000e3855ed886605b6d4a99d5fa2ef2e9b0b164e63df3c4136bebf2d0dac0f1f7a667c86649ffff001d1c4b5666",
      "01000000c60ddef1b7618ca2348a46e868afc26e3efc68226c78aa47f8488c4000000000c997a5e56e104102fa209c6a852dd90660a20b2d9c352423edce25857fcd37047fca6649ffff001d28404f53",
    ]

    // act
    executeProcessHeaders(contract, testHeaders);

    // assert
    const updatedPreheaders = stateCache.get("pre-headers/main");
    const updatedHeaders = stateCache.get("headers/0-100");
    expect(updatedPreheaders).to.deep.equal({ ...firstTenBTCBlocks[8], ...firstTenBTCBlocks[9] });
    expect(Object.keys(updatedHeaders).length).to.deep.equal(9);
  });

  it("should process and verify BTC headers incrementally", () => {
    // arrange
    const testHeadersArrange = [
      BLOCK_ZERO_HEADER_HASH,
      "010000006fe28c0ab6f1b372c1a6a246ae63f74f931e8365e15a089c68d6190000000000982051fd1e4ba744bbbe680e1fee14677ba1a3c3540bf7b1cdb606e857233e0e61bc6649ffff001d01e36299",
      "010000004860eb18bf1b1620e37e9490fc8a427514416fd75159ab86688e9a8300000000d5fdcc541e25de1c7a5addedf24858b8bb665c9f36ef744ee42c316022c90f9bb0bc6649ffff001d08d2bd61",
      "01000000bddd99ccfda39da1b108ce1a5d70038d0a967bacb68b6b63065f626a0000000044f672226090d85db9a9f2fbfe5f0f9609b387af7be5b7fbb7a1767c831c9e995dbe6649ffff001d05e0ed6d",
      "010000004944469562ae1c2c74d9a535e00b6f3e40ffbad4f2fda3895501b582000000007a06ea98cd40ba2e3288262b28638cec5337c1456aaf5eedc8e9e5a20f062bdf8cc16649ffff001d2bfee0a9",
    ]
    const testHeadersTest = [
      "010000004944469562ae1c2c74d9a535e00b6f3e40ffbad4f2fda3895501b582000000007a06ea98cd40ba2e3288262b28638cec5337c1456aaf5eedc8e9e5a20f062bdf8cc16649ffff001d2bfee0a9",
      "0100000085144a84488ea88d221c8bd6c059da090e88f8a2c99690ee55dbba4e00000000e11c48fecdd9e72510ca84f023370c9a38bf91ac5cae88019bee94d24528526344c36649ffff001d1d03e477",
      "01000000fc33f596f822a0a1951ffdbf2a897b095636ad871707bf5d3162729b00000000379dfb96a5ea8c81700ea4ac6b97ae9a9312b2d4301a29580e924ee6761a2520adc46649ffff001d189c4c97",
      "010000008d778fdc15a2d3fb76b7122a3b5582bea4f21f5a0c693537e7a03130000000003f674005103b42f984169c7d008370967e91920a6a5d64fd51282f75bc73a68af1c66649ffff001d39a59c86",
      "010000004494c8cf4154bdcc0720cd4a59d9c9b285e4b146d45f061d2b6c967100000000e3855ed886605b6d4a99d5fa2ef2e9b0b164e63df3c4136bebf2d0dac0f1f7a667c86649ffff001d1c4b5666",
      "01000000c60ddef1b7618ca2348a46e868afc26e3efc68226c78aa47f8488c4000000000c997a5e56e104102fa209c6a852dd90660a20b2d9c352423edce25857fcd37047fca6649ffff001d28404f53",
    ]

    // act
    executeProcessHeaders(contract, testHeadersArrange);
    executeProcessHeaders(contract, testHeadersTest);

    // assert
    const updatedPreheaders = stateCache.get("pre-headers/main");
    const updatedHeaders = stateCache.get("headers/0-100");
    expect(updatedPreheaders).to.deep.equal({ ...firstTenBTCBlocks[8], ...firstTenBTCBlocks[9] });
    expect(Object.keys(updatedHeaders).length).to.deep.equal(9);
  });

  it("should process and verify BTC headers with default validity depth", () => {
    // arrange
    const testHeaders = [
      BLOCK_ZERO_HEADER_HASH,
      "010000006fe28c0ab6f1b372c1a6a246ae63f74f931e8365e15a089c68d6190000000000982051fd1e4ba744bbbe680e1fee14677ba1a3c3540bf7b1cdb606e857233e0e61bc6649ffff001d01e36299",
      "010000004860eb18bf1b1620e37e9490fc8a427514416fd75159ab86688e9a8300000000d5fdcc541e25de1c7a5addedf24858b8bb665c9f36ef744ee42c316022c90f9bb0bc6649ffff001d08d2bd61",
      "01000000bddd99ccfda39da1b108ce1a5d70038d0a967bacb68b6b63065f626a0000000044f672226090d85db9a9f2fbfe5f0f9609b387af7be5b7fbb7a1767c831c9e995dbe6649ffff001d05e0ed6d",
      "010000004944469562ae1c2c74d9a535e00b6f3e40ffbad4f2fda3895501b582000000007a06ea98cd40ba2e3288262b28638cec5337c1456aaf5eedc8e9e5a20f062bdf8cc16649ffff001d2bfee0a9",
      "0100000085144a84488ea88d221c8bd6c059da090e88f8a2c99690ee55dbba4e00000000e11c48fecdd9e72510ca84f023370c9a38bf91ac5cae88019bee94d24528526344c36649ffff001d1d03e477",
      "01000000fc33f596f822a0a1951ffdbf2a897b095636ad871707bf5d3162729b00000000379dfb96a5ea8c81700ea4ac6b97ae9a9312b2d4301a29580e924ee6761a2520adc46649ffff001d189c4c97",
      "010000008d778fdc15a2d3fb76b7122a3b5582bea4f21f5a0c693537e7a03130000000003f674005103b42f984169c7d008370967e91920a6a5d64fd51282f75bc73a68af1c66649ffff001d39a59c86",
      "010000004494c8cf4154bdcc0720cd4a59d9c9b285e4b146d45f061d2b6c967100000000e3855ed886605b6d4a99d5fa2ef2e9b0b164e63df3c4136bebf2d0dac0f1f7a667c86649ffff001d1c4b5666",
      "01000000c60ddef1b7618ca2348a46e868afc26e3efc68226c78aa47f8488c4000000000c997a5e56e104102fa209c6a852dd90660a20b2d9c352423edce25857fcd37047fca6649ffff001d28404f53",
      "010000000508085c47cc849eb80ea905cc7800a3be674ffc57263cf210c59d8d00000000112ba175a1e04b14ba9e7ea5f76ab640affeef5ec98173ac9799a852fa39add320cd6649ffff001d1e2de565",
    ]

    // act
    const testHeadersString = JSON.stringify({
      headers: testHeaders
    });
    contract.processHeaders(testHeadersString);
    finalizeTransaction()

    // assert
    const updatedPreheaders = stateCache.get("headers/0-100");
    expect(Object.keys(updatedPreheaders).length).to.deep.equal(5);
  });
});

describe("clear preheader test", () => {
  it("clear preheader after insertion and continue reinsertion", () => {
    // arrange
    const testHeaders1 = [
      BLOCK_ZERO_HEADER_HASH,
      "010000006fe28c0ab6f1b372c1a6a246ae63f74f931e8365e15a089c68d6190000000000982051fd1e4ba744bbbe680e1fee14677ba1a3c3540bf7b1cdb606e857233e0e61bc6649ffff001d01e36299",
      "010000004860eb18bf1b1620e37e9490fc8a427514416fd75159ab86688e9a8300000000d5fdcc541e25de1c7a5addedf24858b8bb665c9f36ef744ee42c316022c90f9bb0bc6649ffff001d08d2bd61",
      "01000000bddd99ccfda39da1b108ce1a5d70038d0a967bacb68b6b63065f626a0000000044f672226090d85db9a9f2fbfe5f0f9609b387af7be5b7fbb7a1767c831c9e995dbe6649ffff001d05e0ed6d",
      "010000004944469562ae1c2c74d9a535e00b6f3e40ffbad4f2fda3895501b582000000007a06ea98cd40ba2e3288262b28638cec5337c1456aaf5eedc8e9e5a20f062bdf8cc16649ffff001d2bfee0a9",
      "0100000085144a84488ea88d221c8bd6c059da090e88f8a2c99690ee55dbba4e00000000e11c48fecdd9e72510ca84f023370c9a38bf91ac5cae88019bee94d24528526344c36649ffff001d1d03e477",
      "01000000fc33f596f822a0a1951ffdbf2a897b095636ad871707bf5d3162729b00000000379dfb96a5ea8c81700ea4ac6b97ae9a9312b2d4301a29580e924ee6761a2520adc46649ffff001d189c4c97",
      "010000008d778fdc15a2d3fb76b7122a3b5582bea4f21f5a0c693537e7a03130000000003f674005103b42f984169c7d008370967e91920a6a5d64fd51282f75bc73a68af1c66649ffff001d39a59c86",
    ]

    const testHeaders2 = [
      "010000008d778fdc15a2d3fb76b7122a3b5582bea4f21f5a0c693537e7a03130000000003f674005103b42f984169c7d008370967e91920a6a5d64fd51282f75bc73a68af1c66649ffff001d39a59c86",
      "010000004494c8cf4154bdcc0720cd4a59d9c9b285e4b146d45f061d2b6c967100000000e3855ed886605b6d4a99d5fa2ef2e9b0b164e63df3c4136bebf2d0dac0f1f7a667c86649ffff001d1c4b5666",
      "01000000c60ddef1b7618ca2348a46e868afc26e3efc68226c78aa47f8488c4000000000c997a5e56e104102fa209c6a852dd90660a20b2d9c352423edce25857fcd37047fca6649ffff001d28404f53",
    ]

    // act
    executeProcessHeaders(contract, testHeaders1);

    contract.clearPreHeaders();
    finalizeTransaction()

    contract.processHeaders(JSON.stringify({ headers: testHeaders2 }));
    finalizeTransaction()

    // assert
    const updatedPreheaders = stateCache.get("pre-headers/main");
    const updatedHeaders = stateCache.get("headers/0-100");
    expect(updatedPreheaders).to.deep.equal({ ...firstTenBTCBlocks[8], ...firstTenBTCBlocks[9] });
    expect(Object.keys(updatedHeaders).length).to.equal(9);
  });
});

describe("test processHeaders without existing data", () => {
  it("headers in wrong order, should only process block 0", () => {
    // arrange
    const testHeaders = [
      // header 0
      BLOCK_ZERO_HEADER_HASH,
      // header 2
      "010000004860eb18bf1b1620e37e9490fc8a427514416fd75159ab86688e9a8300000000d5fdcc541e25de1c7a5addedf24858b8bb665c9f36ef744ee42c316022c90f9bb0bc6649ffff001d08d2bd61",
      // header 1
      "010000006fe28c0ab6f1b372c1a6a246ae63f74f931e8365e15a089c68d6190000000000982051fd1e4ba744bbbe680e1fee14677ba1a3c3540bf7b1cdb606e857233e0e61bc6649ffff001d01e36299",
    ]

    // act
    // validity depth 1 to verify that the headers are processed in the correct order
    executeProcessHeaders(contract, testHeaders, 0, 0, 1);

    // assert
    const createdCache = stateCache.get("headers/0-100");
    expect(Object.keys(createdCache).length === 1).to.be.true;
    expect(createdCache["0"]).to.not.be.undefined;
    expect(createdCache["1"]).to.be.undefined;
  });

  it("mixed header ordering, should process blocks 5, 0, 1, 2", () => {
    // arrange
    const testHeaders = [
      // block 5
      "0100000085144a84488ea88d221c8bd6c059da090e88f8a2c99690ee55dbba4e00000000e11c48fecdd9e72510ca84f023370c9a38bf91ac5cae88019bee94d24528526344c36649ffff001d1d03e477",
      // block 0
      BLOCK_ZERO_HEADER_HASH,
      // block 8
      "010000004494c8cf4154bdcc0720cd4a59d9c9b285e4b146d45f061d2b6c967100000000e3855ed886605b6d4a99d5fa2ef2e9b0b164e63df3c4136bebf2d0dac0f1f7a667c86649ffff001d1c4b5666",
      // block 1
      "010000006fe28c0ab6f1b372c1a6a246ae63f74f931e8365e15a089c68d6190000000000982051fd1e4ba744bbbe680e1fee14677ba1a3c3540bf7b1cdb606e857233e0e61bc6649ffff001d01e36299",
      // block 10
      "010000000508085c47cc849eb80ea905cc7800a3be674ffc57263cf210c59d8d00000000112ba175a1e04b14ba9e7ea5f76ab640affeef5ec98173ac9799a852fa39add320cd6649ffff001d1e2de565",
      // block 2
      "010000004860eb18bf1b1620e37e9490fc8a427514416fd75159ab86688e9a8300000000d5fdcc541e25de1c7a5addedf24858b8bb665c9f36ef744ee42c316022c90f9bb0bc6649ffff001d08d2bd61",
    ]

    // act
    executeProcessHeaders(contract, testHeaders, 5, 5, 0);

    // assert
    const createdCache = stateCache.get("headers/0-100");
    expect(Object.keys(createdCache).length === 4).to.be.true;
  });
});

// pla: the behavior of the contract is that it will also in some cases include the faulty header
// but because the blocks are cryptographically related, it is not possible to add any valid headers afterwards
// the state is basically corrupted
describe("test processHeaders faulty headers", () => {
  const header0 = BLOCK_ZERO_HEADER_HASH
  const header2 = "010000004860eb18bf1b1620e37e9490fc8a427514416fd75159ab86688e9a8300000000d5fdcc541e25de1c7a5addedf24858b8bb665c9f36ef744ee42c316022c90f9bb0bc6649ffff001d08d2bd61"

  // pla: header to be manipulated
  const header1 = "010000006fe28c0ab6f1b372c1a6a246ae63f74f931e8365e15a089c68d6190000000000982051fd1e4ba744bbbe680e1fee14677ba1a3c3540bf7b1cdb606e857233e0e61bc6649ffff001d01e36299"
  const faultyHeaders = []

  for (let i = 0; i < 160; i += 10) {
    const adjustedFaultyHeader = header1.slice(0, i) + "AAAAAAAAAA" + header1.slice(i + 10)

    faultyHeaders.push(adjustedFaultyHeader)
  }

  for (let i = 0; i < 16; i++) {
    const faultyHeader = faultyHeaders[i];

    if (i == 15) {
      // pla: changing the raw data at this index messes with a power operation that tries to power to a negative number
      // something that is not supported in the big int library
      // 'Error: BigInt does not support negative exponentiation'
      it(`should throw an error`, () => {
        expect(() => executeProcessHeaders(contract, [header1, faultyHeader, header2])).to.throw(Error);
      });
    } else {
      it(`should only process the good headers`, () => {
        executeProcessHeaders(contract, [header0, faultyHeader, header2], 0, 0, 1);
        const createdCache = stateCache.get("headers/0-100");

        // expect only header0 to be included, corrupted headers in the first half of the raw data will not be processed
        expect(Object.keys(createdCache).length === 1).to.be.true;
        expect(createdCache["0"]).to.be.string(BLOCK_ZERO_HEADER_HASH);
      });
    }
  }
});

describe("test processHeaders with many headers", () => {
  it("should process and verify BTC headers", () => {
    // arrange
    const allHeaders = { ...headers0to100, ...headers100to200, ...headers200to250 }
    const sortedKeys = Object.keys(allHeaders).sort((a, b) => parseInt(a) - parseInt(b));
    const testHeaders = sortedKeys.map(key => allHeaders[key]);

    // act
    executeProcessHeaders(contract, testHeaders);

    // assert
    const updatedHeaders0To100 = stateCache.get("headers/0-100");
    const updatedHeaders100To200 = stateCache.get("headers/100-200");
    expect(updatedHeaders0To100).to.deep.equal(headers0to100);
    expect(updatedHeaders100To200).to.deep.equal(headers100to200);
  });

  it("should not process headers, because block zero wasnt provided", () => {
    // arrange
    const allHeaders = { ...headers100to200 }

    // act/ assert
    const processData = JSON.stringify({
      headers: allHeaders
    });

    expect(() => contract.processHeaders(processData)).to.throw(Error);
  });
});

describe("test processHeaders with existing state", () => {
  it("should be able to process headers that dont start at block zero via existing state", () => {
    // arrange
    const preheaders5to7 = {
      "000000009b7262315dbf071787ad3656097b892abffd1f95a1a022f896f533fc": {
        "prevBlock": "000000004ebadb55ee9096c9a2f8880e09da59c0d68b1c228da88e48844a1485",
        "timestamp": "2009-01-09T03:23:48.000Z",
        "merkleRoot": "63522845d294ee9b0188ae5cac91bf389a0c3723f084ca1025e7d9cdfe481ce1",
        "diff": "1",
        "totalDiff": "6",
        "height": 5,
        "raw": "0100000085144a84488ea88d221c8bd6c059da090e88f8a2c99690ee55dbba4e00000000e11c48fecdd9e72510ca84f023370c9a38bf91ac5cae88019bee94d24528526344c36649ffff001d1d03e477"
      },
      "000000003031a0e73735690c5a1ff2a4be82553b2a12b776fbd3a215dc8f778d": {
        "prevBlock": "000000009b7262315dbf071787ad3656097b892abffd1f95a1a022f896f533fc",
        "timestamp": "2009-01-09T03:29:49.000Z",
        "merkleRoot": "20251a76e64e920e58291a30d4b212939aae976baca40e70818ceaa596fb9d37",
        "diff": "1",
        "totalDiff": "7",
        "height": 6,
        "raw": "01000000fc33f596f822a0a1951ffdbf2a897b095636ad871707bf5d3162729b00000000379dfb96a5ea8c81700ea4ac6b97ae9a9312b2d4301a29580e924ee6761a2520adc46649ffff001d189c4c97"
      },
      "0000000071966c2b1d065fd446b1e485b2c9d9594acd2007ccbd5441cfc89444": {
        "prevBlock": "000000003031a0e73735690c5a1ff2a4be82553b2a12b776fbd3a215dc8f778d",
        "timestamp": "2009-01-09T03:39:29.000Z",
        "merkleRoot": "8aa673bc752f2851fd645d6a0a92917e967083007d9c1684f9423b100540673f",
        "diff": "1",
        "totalDiff": "8",
        "height": 7,
        "raw": "010000008d778fdc15a2d3fb76b7122a3b5582bea4f21f5a0c693537e7a03130000000003f674005103b42f984169c7d008370967e91920a6a5d64fd51282f75bc73a68af1c66649ffff001d39a59c86"
      }
    }

    const headers5to7 = {
      "7": "010000008d778fdc15a2d3fb76b7122a3b5582bea4f21f5a0c693537e7a03130000000003f674005103b42f984169c7d008370967e91920a6a5d64fd51282f75bc73a68af1c66649ffff001d39a59c86",
      "6": "01000000fc33f596f822a0a1951ffdbf2a897b095636ad871707bf5d3162729b00000000379dfb96a5ea8c81700ea4ac6b97ae9a9312b2d4301a29580e924ee6761a2520adc46649ffff001d189c4c97",
      "5": "0100000085144a84488ea88d221c8bd6c059da090e88f8a2c99690ee55dbba4e00000000e11c48fecdd9e72510ca84f023370c9a38bf91ac5cae88019bee94d24528526344c36649ffff001d1d03e477",
    }
    stateCache.set("pre-headers/main", preheaders5to7);
    stateCache.set("headers/0-100", headers5to7);
    stateCache.set("validity_depth", { validity_depth: "0" });
    const difficultyParams = {
      startTimestamp: 1349226660, // TIMESTAMP OF BLOCK 0
      endTimestamp: 0,
      difficulty: "26959535291011309493156476344723991336010898738574164086137773096960"
    }
    stateCache.set("last_difficulty_period_params", difficultyParams)

    // headers 8 and 9
    const testheaders = [
      "010000004494c8cf4154bdcc0720cd4a59d9c9b285e4b146d45f061d2b6c967100000000e3855ed886605b6d4a99d5fa2ef2e9b0b164e63df3c4136bebf2d0dac0f1f7a667c86649ffff001d1c4b5666",
      "01000000c60ddef1b7618ca2348a46e868afc26e3efc68226c78aa47f8488c4000000000c997a5e56e104102fa209c6a852dd90660a20b2d9c352423edce25857fcd37047fca6649ffff001d28404f53"
    ]

    // act
    const processData = JSON.stringify({
      headers: testheaders
    });

    contract.processHeaders(processData)
    finalizeTransaction()

    // assert
    const updatedCache = stateCache.get("headers/0-100")
    expect("8" in updatedCache).to.be.true
    expect("9" in updatedCache).to.be.true
    expect("10" in updatedCache).to.be.false
  });

  it("should be able to process headers that dont start at block zero, by the use of the initialize function", () => {
    // header 7
    const startHeader = "010000008d778fdc15a2d3fb76b7122a3b5582bea4f21f5a0c693537e7a03130000000003f674005103b42f984169c7d008370967e91920a6a5d64fd51282f75bc73a68af1c66649ffff001d39a59c86"
    // headers 8 and 9
    const testheaders = [
      "010000004494c8cf4154bdcc0720cd4a59d9c9b285e4b146d45f061d2b6c967100000000e3855ed886605b6d4a99d5fa2ef2e9b0b164e63df3c4136bebf2d0dac0f1f7a667c86649ffff001d1c4b5666",
      "01000000c60ddef1b7618ca2348a46e868afc26e3efc68226c78aa47f8488c4000000000c997a5e56e104102fa209c6a852dd90660a20b2d9c352423edce25857fcd37047fca6649ffff001d28404f53"
    ]
    const initData = JSON.stringify({
      startHeader: startHeader,
      height: 7,
      previousDifficulty: "7",
      validityDepth: 1,
      lastDifficultyPeriodRetargetBlock: BLOCK_ZERO_HEADER_HASH
    });

    // act
    contract.initializeAtSpecificBlock(initData);
    finalizeTransaction()
    contract.processHeaders(JSON.stringify({ headers: testheaders }))
    finalizeTransaction()

    // assert
    const updatedCache = stateCache.get("headers/0-100")
    expect("8" in updatedCache).to.be.true
    expect("9" in updatedCache).to.be.false
    expect("10" in updatedCache).to.be.false
  });

  it("should not be able to process headers that dont start at block zero, because the initialize function was not called first", () => {
    const blockZero = [
      BLOCK_ZERO_HEADER_HASH,
    ]
    // header 7
    const startHeader = "010000008d778fdc15a2d3fb76b7122a3b5582bea4f21f5a0c693537e7a03130000000003f674005103b42f984169c7d008370967e91920a6a5d64fd51282f75bc73a68af1c66649ffff001d39a59c86"
    // headers 8 and 9
    const testheaders = [
      "010000004494c8cf4154bdcc0720cd4a59d9c9b285e4b146d45f061d2b6c967100000000e3855ed886605b6d4a99d5fa2ef2e9b0b164e63df3c4136bebf2d0dac0f1f7a667c86649ffff001d1c4b5666",
      "01000000c60ddef1b7618ca2348a46e868afc26e3efc68226c78aa47f8488c4000000000c997a5e56e104102fa209c6a852dd90660a20b2d9c352423edce25857fcd37047fca6649ffff001d28404f53"
    ]
    const initData = JSON.stringify({
      startHeader: startHeader,
      height: 7,
      previousDifficulty: "7",
      validityDepth: 1,
      lastDifficultyPeriodRetargetBlock: BLOCK_ZERO_HEADER_HASH
    });

    // act
    contract.processHeaders(JSON.stringify({ headers: blockZero }))
    finalizeTransaction()
    contract.initializeAtSpecificBlock(initData);
    finalizeTransaction()
    contract.processHeaders(JSON.stringify({ headers: testheaders }))
    finalizeTransaction()

    // assert
    const updatedPreheaders = stateCache.get("pre-headers/main");
    expect(updatedPreheaders).to.deep.equal(firstTenBTCBlocks[0]);
    expect(stateCache.get("headers/0-100")).to.be.undefined
  });
});

describe("test processHeaders at a difficulty retarget height", () => {
  it("should process headers at first difficulty retarget height", () => {
    // headers 2015, 2016, 2017
    const testheaders = [
      "01000000e25509cde707c3d02a693e4fe9e7cdd57c38a0d2c8d6341f20dae84b000000000c113df1185e162ee92d031fe21d1400ff7d705a3e9b9c860eea855313cd8ca26c087f49ffff001d30b73231",
      "010000006397bb6abd4fc521c0d3f6071b5650389f0b4551bc40b4e6b067306900000000ace470aecda9c8818c8fe57688cd2a772b5a57954a00df0420a7dd546b6d2c576b0e7f49ffff001d33f0192f",
      "01000000efdd7b6c4ce1dcbb370690558d7a556e431c3011f2546c896a2141a100000000d65bbd7472491e067d4562f38fc5420bdcd1335b4cb0cf1e90aefe828fef88cbcd137f49ffff001d34a93051"
    ]

    // act
    executeProcessHeaders(contract, testheaders, 2015, 2015, 0)

    // assert
    const updatedCache = stateCache.get("headers/2000-2100")
    expect("2015" in updatedCache).to.be.true
    expect("2016" in updatedCache).to.be.true
    expect("2017" in updatedCache).to.be.true
  });

  it("should process headers at arbitrary difficulty retarget height", () => {
    // headers 201598, 201599, 201600, 201601
    const testheaders = [
      "02000000b9985b54b29f5244d2884e497a68523a6f8a3874dadc1db26804000000000000f3689bc987a63f3d9db84913a4521691b6292d46be11166412a1bb561159098f238e6b508bdb051a6ffb0277",
      "0200000090750e6782a6a91bf18823869519802e76ee462f462e8fb2cc0000000000000052db8ced4268ec157c6f202c4052c829408d986da5f06300293e32ff8ac2c00d0d926b508bdb051a3ee3ff66",
      "010000009d6f4e09d579c93015a83e9081fee83a5c8b1ba3c86516b61f0400000000000025399317bb5c7c4daefe8fe2c4dfac0cea7e4e85913cd667030377240cadfe93a4906b50087e051a84297df7",
      "01000000d09acdf9c9959a1754da9dae916e70bef9f131ad30ef8be2a50300000000000019381ca69a6a9274670e7bc35c2bf40997b502643a780e4c076572d0844daf8281946b50087e051acaf7bf51"
    ]
    const initData = JSON.stringify({
      startHeader: testheaders[0],
      height: 201598,
      previousDifficulty: "2864140",
      validityDepth: 0,
      lastDifficultyPeriodRetargetBlock: "01000000f13005722c25ba4e6313a22f3177fe5f1c24acf483f50b7604030000000000003c797183997d7752732979a0a6e33238cd6b0af4c40ec4607acaf8903d95914db3435a508bdb051a00e7e734"
    });
    const processData = JSON.stringify({
      headers: testheaders.slice(1)
    });

    // act
    contract.initializeAtSpecificBlock(initData);
    finalizeTransaction()
    contract.processHeaders(processData); 
    finalizeTransaction()

    // assert
    const updatedCache500to600 = stateCache.get("headers/201500-201600")
    const updatedCache600To700 = stateCache.get("headers/201600-201700")
    expect("201598" in updatedCache500to600).to.be.true
    expect("201599" in updatedCache500to600).to.be.true
    expect("201600" in updatedCache600To700).to.be.true
    expect("201601" in updatedCache600To700).to.be.true

    const updatedDifficultyParams = stateCache.get("last_difficulty_period_params")
    const expectedDifficultyParams = {
      startTimestamp: 1349226660, // TIMESTAMP OF BLOCK 201600
      endTimestamp: 0,
      difficulty: "8825807680257895657479991196220989276506275995152177228848553"
    }
    expect(updatedDifficultyParams).to.deep.equal(expectedDifficultyParams)
  });
});

// initializing contract with the supplied header(s), but setting the validity depth to 1 for less boilerplate/ easier testing
// note: validityDepth 0 does not work and yields an error after the second processHeaders call
function executeProcessHeaders(contract: any, headers: Array<string>, startHeight: number = 0, previousDifficulty: number = 1, validityDepth = 1) {
  const initData = JSON.stringify({
    startHeader: headers[0],
    height: startHeight,
    previousDifficulty: previousDifficulty,
    validityDepth: validityDepth,
    lastDifficultyPeriodRetargetBlock: BLOCK_ZERO_HEADER_HASH
  });

  contract.initializeAtSpecificBlock(initData);
  finalizeTransaction()

  const processData = JSON.stringify({
    headers: headers.slice(1)
  });
  contract.processHeaders(processData);
  finalizeTransaction()
}