import { assert, expect } from "chai";
import { contract, reset, setContractImport, stateCache } from "@vsc.eco/contract-testing-utils";
import { retargetAlgorithmVector } from "@@/test-data/retargetAlgoVector";

describe("unit test retargetAlgorithm", () => {
  it('calculates consensus-correct retargets', () => {

    let firstTimestamp;
    let secondTimestamp;
    let previousTarget;
    let expectedNewTarget;
    let res;
    for (let i = 0; i < retargetAlgorithmVector.length; i += 1) {
      firstTimestamp = retargetAlgorithmVector[i].input[0].timestamp;
      secondTimestamp = retargetAlgorithmVector[i].input[1].timestamp;
      previousTarget = BigInt(contract.wrapperExtractTarget(
        retargetAlgorithmVector[i].input[1].hex
      ));
      expectedNewTarget = BigInt(contract.wrapperExtractTarget(
        retargetAlgorithmVector[i].input[2].hex
      ));
      
      res = BigInt(contract.wrapperRetargetAlgorithm(previousTarget.toString(), firstTimestamp.toString(), secondTimestamp.toString()));
      assert.strictEqual(res & expectedNewTarget, expectedNewTarget);

      secondTimestamp = firstTimestamp + 5 * 2016 * 10 * 60; // longer than 4x
      res = BigInt(contract.wrapperRetargetAlgorithm(previousTarget.toString(), firstTimestamp.toString(), secondTimestamp.toString()));
      assert.strictEqual(res / BigInt(4) & previousTarget, previousTarget);

      secondTimestamp = firstTimestamp + 2016 * 10 * 14; // shorter than 1/4x
      res = BigInt(contract.wrapperRetargetAlgorithm(previousTarget.toString(), firstTimestamp.toString(), secondTimestamp.toString()));
      assert.strictEqual(res * BigInt(4) & previousTarget, previousTarget);
    }
  });
});