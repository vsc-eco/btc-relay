import {
  logs,
  contract,
  reset,
  stateCache,
  contractEnv,
  setContractImport,
  finalizeTransaction,
} from "@vsc.eco/contract-testing-utils";

// import { beforeEach, describe, it } from "mocha";
import { expect } from "chai";

const contractImport = import("../build/debug");

beforeAll(() => setContractImport(contractImport));

beforeEach(reset);

describe("hello-world", () => {
  it("should pass when `to` is 'test2'", () => {
    expect(contract.testJSON(JSON.stringify({ to: "test2" }))).to.equal(
      "Count: 1"
    );
    finalizeTransaction();
    expect(logs).to.deep.equal([
      '{"to":"test2"}',
      "to",
      "to",
      "to value: test2 false",
      "assert code: test2",
      "test val",
      '{"to":"test2"}',
    ]);
    expect(stateCache.get("key-1")).to.equal('{"to":"test2"}');
  });

  it("should fail when `to` is 'test1'", () => {
    let threw = false;
    try {
      contract.testJSON(JSON.stringify({ to: "test1" }));
    } catch {
      threw = true;
    }
    finalizeTransaction();
    expect(threw).to.equal(true);
    expect(logs).to.deep.equal([
      '{"to":"test1"}',
      "to",
      "to",
      "to value: test1 true",
      "assert code: test1",
      "I should throw error",
    ]);
  });
});
