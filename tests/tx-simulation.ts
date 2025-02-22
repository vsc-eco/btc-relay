import { contract, reset, setContractImport, simulateLiveTx } from "@vsc.eco/contract-testing-utils";

xdescribe("tx simulation test", () => {
  // only works in the next version of the contract-testing-utils
  it('fetches the tx and simulates it locally', async () => {
    const inputTxId = 'bafyreifirtwm7i4xhxj2iq2dq33lsie2hrfnklekhlahmzouuieeb6seya';
    await simulateLiveTx(inputTxId)
  });
});

