import { contract, finalizeTransaction, initializationState, reset, stateCache, tmpState } from "@vsc.eco/contract-testing-utils";
import { BLOCK_ZERO_HEADER_HASH, firstTenBTCBlocks } from "@@/test-data/BTCBlocks";
import { assert, expect } from "chai";
import { Block, getBlockHeader, sleep } from "./header-fetcher";
const module = await import("fs");
const fs = module.promises;

const SUBMIT_AMOUNT = 90;
const DELAY_BETWEEN_BTC_RPC_CALLS = 100; // how much time at minimum we wait between btc rpc calls

xdescribe("Long running tests stateless", () => {
    it("should fetch headers 0-6050 and process them", async () => {
        const START_HEIGHT = 1;
        const END_HEIGHT = 6050;
        const VALIDITY_DEPTH = 1;
        const PREVIOUS_DIFFICULTY = 1;

        const headersIngestQueue: Array<Block> = []

        const initData = JSON.stringify({
            startHeader: BLOCK_ZERO_HEADER_HASH,
            height: START_HEIGHT,
            previousDifficulty: PREVIOUS_DIFFICULTY,
            validityDepth: VALIDITY_DEPTH,
            lastDifficultyPeriodRetargetBlock: BLOCK_ZERO_HEADER_HASH
        });
        contract.initializeAtSpecificBlock(initData);
        finalizeTransaction()

        for (let i = START_HEIGHT; i <= END_HEIGHT; i++) {
            const [blockRaw, cacheHit] = await getBlockHeader(i);
            headersIngestQueue.push({ [i]: blockRaw })

            if (i % SUBMIT_AMOUNT === 0) {
                const processData = JSON.stringify({
                    headers: headersIngestQueue.map((header) => Object.values(header)[0]),
                });
                console.log(processData)
                // contract.processHeaders(processData);
                // finalizeTransaction()
                // headersIngestQueue.length = 0;
            }
            if (cacheHit) {
                await sleep(DELAY_BETWEEN_BTC_RPC_CALLS)
            }
        }
        expect(true).to.be.true;
    });

});

describe("long running tests with cache", () => {
    const CACHE_PREFIX = 'stateCache-';
    const CACHE_EXTENSION = '.json';
    const CACHE_DIR = './cache/test-state/';

    async function saveStateCache(stateCache: any, newCacheIndex: number) {        
        // save the current state to a new cache file
        const newCacheFileName = `${CACHE_PREFIX}${newCacheIndex}${CACHE_EXTENSION}`;
        await fs.writeFile(
            CACHE_DIR + newCacheFileName,
            JSON.stringify(Object.fromEntries(stateCache), null, 2)
        );
    }

    function findHeighestConfirmedHeaderKey(stateCache) {
        return Object.keys(Object.fromEntries(stateCache))
        .filter(key => key.startsWith("headers/")) // Filter keys that start with "headers/"
        .sort((a, b) => {
            const numA = parseInt(a.split("/")[1].split("-")[0], 10);
            const numB = parseInt(b.split("/")[1].split("-")[0], 10);
            return numB - numA; // Sort descending
        })[0];
    }

    function findHighestValidatedHeight(stateCache: any) {
        // find highest confirmed header
        let highestConfirmedHeaderKey = findHeighestConfirmedHeaderKey(stateCache)
        const highestConfirmedHeader = Math.max(...Object.keys(Object.fromEntries(stateCache)[highestConfirmedHeaderKey]).map(Number));

        return highestConfirmedHeader;
    }

    function truncateStateCacheHeaders(stateCache: Map<string, object>) {
        // Removes all header/X-X entries from the stateCache except for the last one
        const highestValidated = findHeighestConfirmedHeaderKey(stateCache);
        const headerRegex = /^headers\/\d+\-\d+/;

        // Copy over entries, keeping only non-header entries and the highest validated header
        for (const [key, value] of stateCache) {
            if (headerRegex.test(key) && key !== highestValidated) {
                stateCache.delete(key);
            }
        }

    }    

    function cloneMap<K, V>(currentMap: Map<K, V>, newMap: Map<K, V>): void {
        // Clear all keys from the current map
        currentMap.clear();
      
        // Add all entries from the new map to the current map
        for (const [key, value] of newMap) {
          currentMap.set(key, value);
        }
    }

    function objectToMap<K extends string, V>(obj: Record<K, V>): Map<K, V> {
        return new Map<K, V>(Object.entries(obj) as [K, V][]);
    }

    async function handleContractStateFinalization(stateCache: any) {
        truncateStateCacheHeaders(stateCache)
        const tmpStateCache: Map<string, object> = new Map<string, object>();
        cloneMap(tmpStateCache, stateCache);
        reset()
        cloneMap(stateCache, tmpStateCache);
        tmpStateCache.clear();        
    }

    it("continue from cache if exists till END_HEIGHT", async () => {
        const isNode = typeof window === "undefined";
        if (!isNode) {
            throw new Error('this test is only available locally');
        }

        const END_HEIGHT = 40000;
        const headersIngestQueue: Array<Block> = []
    
        // Ensure the cache directory exists (or create it)
        await fs.mkdir(CACHE_DIR, { recursive: true });
    
        // Read the directory’s contents
        let files = [];
        try {
            files = await fs.readdir(CACHE_DIR);
        } catch (err) {
            console.error("Error reading cache directory", err);
        }
    
        // Filter to find cache files that match our naming pattern
        const cacheFiles = files.filter(
            file => file.startsWith(CACHE_PREFIX) && file.endsWith(CACHE_EXTENSION)
        );
    
        // Determine the file with the highest number (if any)
        let latestCacheFile = null;
        let newCacheIndex = 1; // default starting index if none exist
        if (cacheFiles.length > 0) {
            let maxNumber = 0;
            for (const file of cacheFiles) {
                // The file name should be in the format: stateCache-<number>.json
                const match = file.match(new RegExp(`^${CACHE_PREFIX}(\\d+)${CACHE_EXTENSION}$`));
                if (match) {
                    const num = parseInt(match[1], 10);
                    if (num > maxNumber) {
                        maxNumber = num;
                        latestCacheFile = file;
                    }
                }
            }
            // For the new cache file, continue with the next number
            newCacheIndex = maxNumber + 1;
        }
    
        if (latestCacheFile) {
            // A cache file exists: read its contents and continue from that state.
            console.log(`Found cache file: ${latestCacheFile}`);
            const cacheData = JSON.parse(await fs.readFile(CACHE_DIR + latestCacheFile, "utf8"));
            cloneMap(stateCache, objectToMap(cacheData));
        } else {
            // No cache files exist, so initialize everything from scratch.
            console.log("No cache file found – reinitializing state");
            const startHeight = 0;
            const validityDepth = 3;
            const previousDifficulty = 1;
            const initData = JSON.stringify({
                startHeader: BLOCK_ZERO_HEADER_HASH,
                height: startHeight,
                previousDifficulty: previousDifficulty,
                validityDepth: validityDepth,
                lastDifficultyPeriodRetargetBlock: BLOCK_ZERO_HEADER_HASH
            });
            contract.initializeAtSpecificBlock(initData);
            finalizeTransaction();
            await saveStateCache(stateCache, newCacheIndex);
            newCacheIndex++;
        }
    
        const startHeight = findHighestValidatedHeight(stateCache);
    
        for (let i = startHeight; i <= END_HEIGHT; i++) {
            const [blockRaw, cacheHit] = await getBlockHeader(i);
            headersIngestQueue.push({ [i]: blockRaw });
    
            if (headersIngestQueue.length % SUBMIT_AMOUNT === 0) {
                const processData = JSON.stringify({
                    headers: headersIngestQueue.map((header) => Object.values(header)[0]),
                });
                contract.processHeaders(processData);
                finalizeTransaction();
                headersIngestQueue.length = 0;
                
                handleContractStateFinalization(stateCache)
                await saveStateCache(stateCache, newCacheIndex);
                newCacheIndex++
            }
            if (!cacheHit) {
                await sleep(DELAY_BETWEEN_BTC_RPC_CALLS)
            }
        }
    });
});