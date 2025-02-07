import { contract, reset, setContractImport, simulateLiveTx } from "@vsc.eco/contract-testing-utils";

xdescribe("tx simulation test", () => {
  // only works in the next version of the contract-testing-utils
  it('fetches the tx and simulates it locally', async () => {
    // last tx
    // const inputTxId = 'bafyreih45lbwjtarggjdghlqwe3n4rhcsqiwtlc4mooyulgvbicpaa4pom';

    // last successful tx
    // const inputTxId = 'bafyreidj7opdiwctwdzqrne3jl6nrdil32eztt23icyaxrvg3avzscfraq';

    // first failing tx
    const inputTxId = 'bafyreifirtwm7i4xhxj2iq2dq33lsie2hrfnklekhlahmzouuieeb6seya';
    await simulateLiveTx(inputTxId)
  });
});

