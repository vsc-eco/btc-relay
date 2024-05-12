import { contract, reset, setContractImport, stateCache } from "@vsc.eco/contract-testing-utils";
import { assert, expect } from "chai";
import { validateTxProof } from '../assembly/btc-relay-validation';
import { invalidProof, validProof } from "@@/test-data/proofs";

const contractImport = import("../build/debug");

beforeAll(() => setContractImport(contractImport));

beforeEach(reset);

xdescribe("test validateTxProof with various proofs", () => {
    it("should return true on valid proof", () => {
        stateCache.set("headers/592900-593000", JSON.stringify({
            "592920": "0000c020c238b601308b7297346ab2ed59942d7d7ecea8d23a1001000000000000000000b61ac92842abc82aa93644b190fc18ad46c6738337e78bc0c69ab21c5d5ee2ddd6376d5d3e211a17d8706a84"
        }));

        const result = contract.validateTxProof(JSON.stringify(validProof));

        expect(result).to.equal(true);
    });

    it("should return false on invalid proof", () => {
        stateCache.set("headers/592900-593000", JSON.stringify({
            "592920": "0000c020c238b601308b7297346ab2ed59942d7d7ecea8d23a1001000000000000000000b61ac92842abc82aa93644b190fc18ad46c6738337e78bc0c69ab21c5d5ee2ddd6376d5d3e211a17d8706a84"
        }));

        const result = contract.validateTxProof(JSON.stringify(invalidProof));

        expect(result).to.equal(false);
    });
});