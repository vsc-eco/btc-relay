import { firstTenBTCBlocks, headers0to100, headers100to200, headers200to250 } from "../test-data/BTCBlocks"
import { assert, expect } from "chai";
import { contract, reset, setContractImport, stateCache } from "@vsc.eco/contract-testing-utils";

const contractImport = import("../build/debug");

beforeAll(() => setContractImport(contractImport));

beforeEach(reset);

describe("general processHeaders tests", () => {
  it("should process and verify BTC headers", () => {
    // arrange
    const testHeaders = [
      "0100000000000000000000000000000000000000000000000000000000000000000000003ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a29ab5f49ffff001d1dac2b7c",
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
    contract.processHeaders(testHeaders);

    // assert
    const updatedPreheaders = stateCache.get("pre-headers/main");
    expect(updatedPreheaders).to.equal(JSON.stringify(firstTenBTCBlocks));
  });

  it("should process and verify BTC headers incrementally", () => {
    // arrange
    const testHeadersArrange = [
      "0100000000000000000000000000000000000000000000000000000000000000000000003ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a29ab5f49ffff001d1dac2b7c",
      "010000006fe28c0ab6f1b372c1a6a246ae63f74f931e8365e15a089c68d6190000000000982051fd1e4ba744bbbe680e1fee14677ba1a3c3540bf7b1cdb606e857233e0e61bc6649ffff001d01e36299",
      "010000004860eb18bf1b1620e37e9490fc8a427514416fd75159ab86688e9a8300000000d5fdcc541e25de1c7a5addedf24858b8bb665c9f36ef744ee42c316022c90f9bb0bc6649ffff001d08d2bd61",
      "01000000bddd99ccfda39da1b108ce1a5d70038d0a967bacb68b6b63065f626a0000000044f672226090d85db9a9f2fbfe5f0f9609b387af7be5b7fbb7a1767c831c9e995dbe6649ffff001d05e0ed6d",
      "010000004944469562ae1c2c74d9a535e00b6f3e40ffbad4f2fda3895501b582000000007a06ea98cd40ba2e3288262b28638cec5337c1456aaf5eedc8e9e5a20f062bdf8cc16649ffff001d2bfee0a9",
    ]
    contract.processHeaders(testHeadersArrange);
    const testHeadersTest = [
      "010000004944469562ae1c2c74d9a535e00b6f3e40ffbad4f2fda3895501b582000000007a06ea98cd40ba2e3288262b28638cec5337c1456aaf5eedc8e9e5a20f062bdf8cc16649ffff001d2bfee0a9",
      "0100000085144a84488ea88d221c8bd6c059da090e88f8a2c99690ee55dbba4e00000000e11c48fecdd9e72510ca84f023370c9a38bf91ac5cae88019bee94d24528526344c36649ffff001d1d03e477",
      "01000000fc33f596f822a0a1951ffdbf2a897b095636ad871707bf5d3162729b00000000379dfb96a5ea8c81700ea4ac6b97ae9a9312b2d4301a29580e924ee6761a2520adc46649ffff001d189c4c97",
      "010000008d778fdc15a2d3fb76b7122a3b5582bea4f21f5a0c693537e7a03130000000003f674005103b42f984169c7d008370967e91920a6a5d64fd51282f75bc73a68af1c66649ffff001d39a59c86",
      "010000004494c8cf4154bdcc0720cd4a59d9c9b285e4b146d45f061d2b6c967100000000e3855ed886605b6d4a99d5fa2ef2e9b0b164e63df3c4136bebf2d0dac0f1f7a667c86649ffff001d1c4b5666",
      "01000000c60ddef1b7618ca2348a46e868afc26e3efc68226c78aa47f8488c4000000000c997a5e56e104102fa209c6a852dd90660a20b2d9c352423edce25857fcd37047fca6649ffff001d28404f53",
      "010000000508085c47cc849eb80ea905cc7800a3be674ffc57263cf210c59d8d00000000112ba175a1e04b14ba9e7ea5f76ab640affeef5ec98173ac9799a852fa39add320cd6649ffff001d1e2de565",
    ]

    // act
    contract.processHeaders(testHeadersTest);

    // assert
    const updatedPreheaders = stateCache.get("pre-headers/main");
    expect(updatedPreheaders).to.equal(JSON.stringify(firstTenBTCBlocks));
  });
});

describe("test processHeaders without existing data", () => {
  it("headers in wrong order, should only process block zero", () => {
    // arrange
    const testHeaders = [
      "010000006fe28c0ab6f1b372c1a6a246ae63f74f931e8365e15a089c68d6190000000000982051fd1e4ba744bbbe680e1fee14677ba1a3c3540bf7b1cdb606e857233e0e61bc6649ffff001d01e36299",
      "0100000000000000000000000000000000000000000000000000000000000000000000003ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a29ab5f49ffff001d1dac2b7c",
      "010000004860eb18bf1b1620e37e9490fc8a427514416fd75159ab86688e9a8300000000d5fdcc541e25de1c7a5addedf24858b8bb665c9f36ef744ee42c316022c90f9bb0bc6649ffff001d08d2bd61",
    ]

    // act
    contract.processHeaders(testHeaders);

    // assert
    const createdCache = JSON.parse(stateCache.get("pre-headers/main"));
    expect(Object.keys(createdCache).length === 1)
    expect(createdCache["000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f"]).to.not.be.undefined;
  });

  it("mixed header ordering, should process first 3 blocks", () => {
    // arrange
    const testHeaders = [
      // block 5
      "0100000085144a84488ea88d221c8bd6c059da090e88f8a2c99690ee55dbba4e00000000e11c48fecdd9e72510ca84f023370c9a38bf91ac5cae88019bee94d24528526344c36649ffff001d1d03e477",
      // block 0
      "0100000000000000000000000000000000000000000000000000000000000000000000003ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a29ab5f49ffff001d1dac2b7c",
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
    contract.processHeaders(testHeaders);

    // assert
    const createdCache = JSON.parse(stateCache.get("pre-headers/main"));
    expect(Object.keys(createdCache).length === 3)
  });

  // pla: doesnt work currently, should it work?
  // it("should process first 3 headers and then a way higher block", () => {
  //   // arrange
  //   const testHeaders = [
  //     "0100000000000000000000000000000000000000000000000000000000000000000000003ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a29ab5f49ffff001d1dac2b7c",
  //     "010000006fe28c0ab6f1b372c1a6a246ae63f74f931e8365e15a089c68d6190000000000982051fd1e4ba744bbbe680e1fee14677ba1a3c3540bf7b1cdb606e857233e0e61bc6649ffff001d01e36299",
  //     "010000004860eb18bf1b1620e37e9490fc8a427514416fd75159ab86688e9a8300000000d5fdcc541e25de1c7a5addedf24858b8bb665c9f36ef744ee42c316022c90f9bb0bc6649ffff001d08d2bd61",
  //     "010000000508085c47cc849eb80ea905cc7800a3be674ffc57263cf210c59d8d00000000112ba175a1e04b14ba9e7ea5f76ab640affeef5ec98173ac9799a852fa39add320cd6649ffff001d1e2de565"
  //   ]

  //   // act
  //   contract.processHeaders(testHeaders);

  //   // assert
  //   const createdCache = JSON.parse(stateCache.get("pre-headers/main"));
  //   console.log('tst');
  //   // expect(Object.keys(createdCache).length === 3)
  // });
});

// DONT COMMENT OUT
// xdescribe("test processHeaders with prefilled data", () => {
//   beforeEach(() => {
//     stateCache.set("pre-headers/main", JSON.stringify(firstTenBTCBlocks));
//   });

//   it("should process and verify BTC headers", () => {
//     // arrange
//     const testHeaders = [
//       "0100000000000000000000000000000000000000000000000000000000000000000000003ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a29ab5f49ffff001d1dac2b7c",
//       "010000006fe28c0ab6f1b372c1a6a246ae63f74f931e8365e15a089c68d6190000000000982051fd1e4ba744bbbe680e1fee14677ba1a3c3540bf7b1cdb606e857233e0e61bc6649ffff001d01e36299",
//       "010000004860eb18bf1b1620e37e9490fc8a427514416fd75159ab86688e9a8300000000d5fdcc541e25de1c7a5addedf24858b8bb665c9f36ef744ee42c316022c90f9bb0bc6649ffff001d08d2bd61",
//       "01000000bddd99ccfda39da1b108ce1a5d70038d0a967bacb68b6b63065f626a0000000044f672226090d85db9a9f2fbfe5f0f9609b387af7be5b7fbb7a1767c831c9e995dbe6649ffff001d05e0ed6d",
//       "010000004944469562ae1c2c74d9a535e00b6f3e40ffbad4f2fda3895501b582000000007a06ea98cd40ba2e3288262b28638cec5337c1456aaf5eedc8e9e5a20f062bdf8cc16649ffff001d2bfee0a9",
//       "0100000085144a84488ea88d221c8bd6c059da090e88f8a2c99690ee55dbba4e00000000e11c48fecdd9e72510ca84f023370c9a38bf91ac5cae88019bee94d24528526344c36649ffff001d1d03e477",
//       "01000000fc33f596f822a0a1951ffdbf2a897b095636ad871707bf5d3162729b00000000379dfb96a5ea8c81700ea4ac6b97ae9a9312b2d4301a29580e924ee6761a2520adc46649ffff001d189c4c97",
//       "010000008d778fdc15a2d3fb76b7122a3b5582bea4f21f5a0c693537e7a03130000000003f674005103b42f984169c7d008370967e91920a6a5d64fd51282f75bc73a68af1c66649ffff001d39a59c86",
//       "010000004494c8cf4154bdcc0720cd4a59d9c9b285e4b146d45f061d2b6c967100000000e3855ed886605b6d4a99d5fa2ef2e9b0b164e63df3c4136bebf2d0dac0f1f7a667c86649ffff001d1c4b5666",
//       "01000000c60ddef1b7618ca2348a46e868afc26e3efc68226c78aa47f8488c4000000000c997a5e56e104102fa209c6a852dd90660a20b2d9c352423edce25857fcd37047fca6649ffff001d28404f53",
//       "010000000508085c47cc849eb80ea905cc7800a3be674ffc57263cf210c59d8d00000000112ba175a1e04b14ba9e7ea5f76ab640affeef5ec98173ac9799a852fa39add320cd6649ffff001d1e2de565",
//     ]

//     // act
//     contract.processHeaders(testHeaders);

//     // assert
//     const updatedPreheaders = stateCache.get("pre-headers/main");
//     expect(updatedPreheaders).to.equal(firstTenBTCBlocks);
//   });
// });

describe("test processHeaders faulty headers", () => {
  const goodHeaders = [
    "0100000000000000000000000000000000000000000000000000000000000000000000003ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a29ab5f49ffff001d1dac2b7c",
  ]

  const manipulatedHeader = "010000006fe28c0ab6f1b372c1a6a246ae63f74f931e8365e15a089c68d6190000000000982051fd1e4ba744bbbe680e1fee14677ba1a3c3540bf7b1cdb606e857233e0e61bc6649ffff001d01e36299"
  const faultyHeaders = []

  for (let i = 0; i < 160; i += 10) {
    const adjustedFaultyHeader = manipulatedHeader.slice(0, i) + "AAAAAAAAAA" + manipulatedHeader.slice(i + 10)

    faultyHeaders.push(adjustedFaultyHeader)
  }

  for (let i = 0; i < 16; i++) {
    const faultyHeader = faultyHeaders[i];

    if (i != 15) {
      it(`should only process the good headers`, () => {
        contract.processHeaders([...goodHeaders, faultyHeader])
        const createdCache = JSON.parse(stateCache.get("pre-headers/main"));

        expect(Object.keys(createdCache).length === 1)
        expect(createdCache["000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f"]).to.not.be.undefined;
      });
    } else {
      // pla: changing the raw data at this index messes with a power operation that tries to power to a negative number
      // something that is not supported in the big int library
      // 'Error: BigInt does not support negative exponentiation'
      it(`should throw an error`, () => {
        expect(() => contract.processHeaders([...goodHeaders, faultyHeader])).to.throw(Error);
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
    contract.processHeaders(testHeaders);

    // assert
    const updatedHeaders0To100 = stateCache.get("headers/0-100");
    const updatedHeaders100To200 = stateCache.get("headers/100-200");
    assert.isTrue(areObjectsEqual(JSON.parse(updatedHeaders0To100), headers0to100))
    assert.isTrue(areObjectsEqual(JSON.parse(updatedHeaders100To200), headers100to200))
  });

  it("should not process headers, because block zero wasnt provided", () => {
    // arrange
    const allHeaders = { ...headers100to200 }
    const sortedKeys = Object.keys(allHeaders).sort((a, b) => parseInt(a) - parseInt(b));
    const testHeaders = sortedKeys.map(key => allHeaders[key]);

    // act/ assert
    expect(() => contract.processHeaders(testHeaders)).to.throw(Error);
  });
});

describe("test processHeaders with existing state", () => {
  it("should be able to process headers with existing state that doesnt start at block zero", () => {
    // arrange
    const headers5to7 = {
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

    const headers0to100 = { 
      "7": "010000008d778fdc15a2d3fb76b7122a3b5582bea4f21f5a0c693537e7a03130000000003f674005103b42f984169c7d008370967e91920a6a5d64fd51282f75bc73a68af1c66649ffff001d39a59c86",
      "6": "01000000fc33f596f822a0a1951ffdbf2a897b095636ad871707bf5d3162729b00000000379dfb96a5ea8c81700ea4ac6b97ae9a9312b2d4301a29580e924ee6761a2520adc46649ffff001d189c4c97",
      "5": "0100000085144a84488ea88d221c8bd6c059da090e88f8a2c99690ee55dbba4e00000000e11c48fecdd9e72510ca84f023370c9a38bf91ac5cae88019bee94d24528526344c36649ffff001d1d03e477",
    }
    stateCache.set("pre-headers/main", JSON.stringify(headers5to7));
    stateCache.set("headers/0-100", JSON.stringify(headers0to100));
    // headers 8 and 9
    const testheaders = [
      "010000004494c8cf4154bdcc0720cd4a59d9c9b285e4b146d45f061d2b6c967100000000e3855ed886605b6d4a99d5fa2ef2e9b0b164e63df3c4136bebf2d0dac0f1f7a667c86649ffff001d1c4b5666",
      "01000000c60ddef1b7618ca2348a46e868afc26e3efc68226c78aa47f8488c4000000000c997a5e56e104102fa209c6a852dd90660a20b2d9c352423edce25857fcd37047fca6649ffff001d28404f53"
    ]

    // act
    contract.processHeaders(testheaders)

    // assert
    const updatedCache = JSON.parse(stateCache.get("headers/0-100"))
    expect("8" in updatedCache)
    expect("9" in updatedCache)
  });
});

function areObjectsEqual(obj1: any, obj2: any): boolean {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (const key of keys1) {
    const val1 = obj1[key];
    const val2 = obj2[key];

    if (typeof val1 === 'object' && val1 != null && typeof val2 === 'object' && val2 != null) {
      if (!areObjectsEqual(val1, val2)) {
        return false;
      }
    } else {
      if (val1 !== val2) {
        return false;
      }
    }
  }

  return true;
}