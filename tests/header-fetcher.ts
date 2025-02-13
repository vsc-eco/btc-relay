import * as path from 'path';
import axios from "axios";

const module = await import("fs");
const fs = module.promises;

// Configuration
const CACHE_DIR = './cache/headers'; // cache directory
const CHUNK_SIZE = 5000;                        // number of headers per JSON file
const MAX_REQUEST_RETRIES = 5; // how many times we retry a btc rpc request
const DELAY_BETWEEN_FAILED_CALLS = 600; // how much time at minimum we wait between btc rpc calls
const MAX_REQUEST_FAIL_COUNTER = 10; // how often we can fail a btc rpc  request before we stop the program
const BTC_RPC = 'https://bitcoin-mainnet.public.blastapi.io'
const ENABLE_INFO_LOGS = true

// Dummy sleep function
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Given a block height, computes the cache file path.
 * Each file covers a chunk of CHUNK_SIZE headers.
 */
function getCacheFilePath(height) {
    const chunkStart = Math.floor(height / CHUNK_SIZE) * CHUNK_SIZE;
    const chunkEnd = chunkStart + CHUNK_SIZE - 1;
    return path.join(CACHE_DIR, `headers_${chunkStart}-${chunkEnd}.json`);
}

/**
 * Retrieves the block header for a given height.
 * If the header exists in the cache, it is returned immediately.
 * Otherwise, it is fetched via fetchBlockRaw, saved into the cache, and then returned.
 */
export async function getBlockHeader(height): Promise<[header: any, cacheHit :boolean]> {
    const filePath = getCacheFilePath(height);

    // Ensure the cache directory exists
    await fs.mkdir(CACHE_DIR, { recursive: true });

    // Try to load the cache file (if it exists)
    let cacheData = {};
    try {
        const fileContent = await fs.readFile(filePath, 'utf8');
        cacheData = JSON.parse(fileContent);
    } catch (err) {
        // File does not exist or could not be read – start with an empty cache object.
        cacheData = {};
    }

    // If the header is already cached, return it.
    if (cacheData.hasOwnProperty(height)) {
        if (ENABLE_INFO_LOGS) {
            console.log(`Cache hit for block ${height}`);
        }
        return [cacheData[height], true];
    }

    // Otherwise, fetch the header and update the cache.
    if (ENABLE_INFO_LOGS) {
        console.log(`Cache miss for block ${height}. Fetching...`);
    }
    const header = await fetchBlockRaw(height);
    cacheData[height] = header;

    // Write the updated cache data back to the file.
    await fs.writeFile(filePath, JSON.stringify(cacheData, null, 2));
    return [header, false];
}

let failCounter = 0;
const failedRequests: { name: string, params: any }[] = [];

async function rpcBitcoinCall(name: string, params: any) {
    let retries = 0;
    let waitTime = DELAY_BETWEEN_FAILED_CALLS;

    while (retries < MAX_REQUEST_RETRIES) {
        try {
            const data = await axios.post(BTC_RPC, {
                "jsonrpc": "1.0", "id": "curltest", "method": name, "params": params
            });
            return data.data;
        } catch (error: any) {
            if (error.response && error.response.status === 429) {
                await sleep(waitTime);
                waitTime *= 1.5;
            } else {
                retries++;
                if (retries >= MAX_REQUEST_RETRIES) {
                    failCounter++;
                    failedRequests.push({ name, params });
                    if (failCounter >= MAX_REQUEST_FAIL_COUNTER) {
                        console.error("Maximum fail counter reached. Aborting program.");
                        process.exit(1);
                    }
                }
            }
        }
    }

    throw new Error(`Failed to execute ${name} after ${MAX_REQUEST_RETRIES} retries`);
}

async function fetchBlockRaw(height: number) {
    const blockHash = (await rpcBitcoinCall('getblockhash', [height])).result
    const blockDataRaw = (await rpcBitcoinCall('getblockheader', [blockHash, false])).result

    return blockDataRaw
}

export interface Block {
    [key: string]: string;
}