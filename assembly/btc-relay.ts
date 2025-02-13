import { db, Arrays, SystemAPI, Crypto, reverseEndianness, console } from '@vsc.eco/sdk/assembly';
import { JSON, JSONEncoder } from "assemblyscript-json/assembly";
import { BigInt } from "as-bigint/assembly"
import { Value } from 'assemblyscript-json/assembly/JSON';

// maximum preheaders we allow to cache, vsc network cant by design handle too large single keys ('pre-headers')
const MAX_PREHEADER_SIZE = 1200;

const DIFF_ONE_TARGET = BigInt.fromString('0x00000000FFFF0000000000000000000000000000000000000000000000000000', 16);

const FIRST_DIFFICULTY_PERIOD_HEADER = "0100000000000000000000000000000000000000000000000000000000000000000000003ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a29ab5f49ffff001d1dac2b7c";

const DEFAULT_VALIDITY_DEPTH = 6;

const RETARGET_PERIOD = BigInt.from(1209600);

const RETARGET_PERIOD_BLOCKS = 2016;

// allow retarget calculation to be slightly off by truncating digits
const RETARGET_VALIDATION_PRECISION: u32 = 4; // e.g. round up to the nearest 10^3

const headersState: Map<string, Map<i64, string>> = new Map<string, Map<i64, string>>();

const debugMode = true;

class DifficultyPeriodParams {
    startTimestamp: BigInt;
    endTimestamp: BigInt;
    target: BigInt;
    difficultyHumanReadable: string;

    constructor(difficulty: BigInt, startTimestamp: BigInt, endTimestamp: BigInt = BigInt.from(0), difficultyHumanReadable: string = "") {
        this.startTimestamp = startTimestamp;
        this.endTimestamp = endTimestamp;
        this.target = difficulty;
        this.difficultyHumanReadable = difficultyHumanReadable;
    }
}

class HighestValidatedHeader {
    height: i32;
    blockHeader: string;

    constructor(height: i32, blockHeader: string) {
        this.height = height;
        this.blockHeader = blockHeader;
    }
}

class RetargetAlgorithmResult {
    lastDifficultyPeriodParams: DifficultyPeriodParams;
    difficultyPeriodParamsChanged: boolean;
    blockPasses: boolean;

    constructor(lastDifficultyPeriodParams: DifficultyPeriodParams, retargeted: boolean, blockPassesRetargetProcess: boolean) {
        this.lastDifficultyPeriodParams = lastDifficultyPeriodParams;
        this.difficultyPeriodParamsChanged = retargeted;
        this.blockPasses = blockPassesRetargetProcess;
    }
}

// pla: for serialization and storage in the db, we convert BigInt to string and Uint8Array to hex string
class Header {
    prevBlock: Uint8Array;
    timestamp: BigInt;
    merkleRoot: Uint8Array;
    target: BigInt;
    targetUnformatted: BigInt;
    height: i32;
    raw: string;

    constructor(
        prevBlock: Uint8Array,
        timestamp: BigInt,
        merkleRoot: Uint8Array,
        target: BigInt,
        targetUnformatted: BigInt,
        height: i32,
        raw: string
    ) {
        this.prevBlock = prevBlock;
        this.timestamp = timestamp;
        this.merkleRoot = merkleRoot;
        this.target = target;
        this.targetUnformatted = targetUnformatted;
        this.height = height;
        this.raw = raw;
    }

    stringify(encoder: JSONEncoder, key: string | null = null): JSONEncoder {
        encoder.pushObject(key);
        encoder.setString("prevBlock", Arrays.toHexString(this.prevBlock));
        encoder.setString("timestamp", this.timestamp.toString());
        encoder.setString("merkleRoot", Arrays.toHexString(this.merkleRoot));
        encoder.setString("target", this.target.toString());
        encoder.setString("targetUnformatted", this.targetUnformatted.toString());
        encoder.setInteger("height", this.height);
        encoder.setString("raw", this.raw);
        return encoder;
    }
}

class InitData {
    startHeader: string;
    height: i32;
    previousDifficulty: BigInt;
    lastDifficultyPeriodRetargetBlock: string | null = null;
    // pla: directs how many blocks to skip from the end of the chain, 0 no blocks are skipped
    // default validity depth is 6 blocks, this means we skip the last 6 blocks from the end of the chain, because we cant assume that they are final yet
    validityDepth: i32 = DEFAULT_VALIDITY_DEPTH;

    constructor(startHeader: string, height: i32, previousDifficulty: BigInt) {
        this.startHeader = startHeader;
        this.height = height;
        this.previousDifficulty = previousDifficulty;
    }
}

class ProcessData {
    headers: Array<string>;

    constructor(headers: Array<string>) {
        this.headers = headers;
    }
}

export function calcKey(height: i32): string {
    const cs: i32 = 100;
    // pla: is math.floor needed?
    // const keyA: i32 = Mathf.floor(height / cs) * cs;
    const keyA: i32 = (height / cs) * cs;

    return keyA.toString() + "-" + (keyA + cs).toString();
}

export function getHeaders(key: string): Map<i64, string> {
    const pulledHeaders: Map<i64, string> = new Map<i64, string>();
    const fetchedHeaderState = db.getObject(`headers/${key}`);
    if (fetchedHeaderState !== "null") {
        const parsed = <JSON.Obj>JSON.parse(fetchedHeaderState);
        for (let i = 0; i < parsed.keys.length; ++i) {
            let key = parsed.keys[i];
            let blockRaw = getStringFromJSON(<JSON.Obj>parsed, key);
            let height = parseInt(key) as i64;
            pulledHeaders.set(height, blockRaw);
        }
    }

    return pulledHeaders;
}

export function getStringFromJSON(jsonObject: JSON.Obj, key: string): string {
    let extractedValue: JSON.Str | null = jsonObject.getString(key);
    if (extractedValue != null) {
        return extractedValue.valueOf();
    }

    return "";
}

export function extractPrevBlockLE(header: Uint8Array): Uint8Array {
    return header.slice(4, 36);
}

export function extractMerkleRootLE(header: Uint8Array): Uint8Array {
    return header.slice(36, 68);
}

// Implements bitcoin's hash256 (double sha2)
export function hash256(preImage: Uint8Array): Uint8Array {
    return sha256(sha256(preImage));
}

export function sha256(param: Uint8Array): Uint8Array {
    const arg0Value: string = Arrays.toHexString(param, false);

    const obj = new JSON.Obj()
    obj.set('arg0', arg0Value)

    const result = <JSON.Obj>JSON.parse(SystemAPI.call('crypto.sha256', obj.stringify()))
    if (result.getString('result')!.isString) {
        return Arrays.fromHexString(result.getString('result')!.valueOf())
    } else {
        //Never should happen
        throw new Error('Crypto - incorrect binding response')
    }
}

export function getIntFromJSON(jsonObject: JSON.Obj, key: string): i64 {
    let extractedValue: JSON.Integer | null = jsonObject.getInteger(key);
    if (extractedValue != null) {
        return extractedValue.valueOf();
    }

    return 0;
}

export function getPreheaders(): Map<string, Header> {
    const fetchedPreHeaders = db.getObject(`pre-headers/main`);
    const preheaders: Map<string, Header> = new Map<string, Header>();

    if (fetchedPreHeaders !== "null") {
        let parsed = <JSON.Obj>JSON.parse(fetchedPreHeaders);
        for (let i = 0; i < parsed.keys.length; ++i) {
            let key = parsed.keys[i];
            let obj = parsed.get(key);
            if (obj instanceof JSON.Obj) {
                let preheader = new Header(
                    Arrays.fromHexString(getStringFromJSON(<JSON.Obj>obj, "prevBlock")),
                    BigInt.from(getStringFromJSON(<JSON.Obj>obj, "timestamp")),
                    Arrays.fromHexString(getStringFromJSON(<JSON.Obj>obj, "merkleRoot")),
                    BigInt.from(getStringFromJSON(<JSON.Obj>obj, "target")),
                    BigInt.from(getStringFromJSON(<JSON.Obj>obj, "targetUnformatted")),
                    getIntFromJSON(<JSON.Obj>obj, "height") as i32,
                    getStringFromJSON(<JSON.Obj>obj, "raw")
                );
                preheaders.set(key, preheader);
            }
        }
    }

    return preheaders;
}

export function saveString(key: string, value: string): void {
    let encoder = new JSONEncoder();
    encoder.pushObject(null);
    encoder.setString(key, value);
    encoder.popObject();
    db.setObject(key, encoder.toString());
}

export function retrieveString(key: string): string {
    const value = db.getObject(key);
    if (value === "null") {
        return value;
    }
    const parsed = <JSON.Obj>JSON.parse(value)
    return parsed.getString(key)!.valueOf();
}

export function parseProcessData(headerString: string): ProcessData {
    const parsed = <JSON.Obj>JSON.parse(headerString);

    const headers = parsed.getArr('headers')!.valueOf().map<string>((value: Value, index: i32, array: Value[]) => {
        return value.toString();
    });

    return new ProcessData(headers);
}

export function parseInitData(initDataString: string): InitData {
    const parsed = <JSON.Obj>JSON.parse(initDataString);
    const initData = new InitData(
        getStringFromJSON(parsed, 'startHeader'),
        getIntFromJSON(parsed, 'height') as i32,
        BigInt.fromString(getStringFromJSON(parsed, 'previousDifficulty')),
    );

    let validityDepthJSON: JSON.Integer | null = parsed.getInteger('validityDepth');
    if (validityDepthJSON != null) {
        initData.validityDepth = validityDepthJSON.valueOf() as i32
    }

    let lastDifficultyPeriodRetargetBlockJSON: JSON.Str | null = parsed.getString('lastDifficultyPeriodRetargetBlock');
    if (lastDifficultyPeriodRetargetBlockJSON != null) {
        initData.lastDifficultyPeriodRetargetBlock = lastDifficultyPeriodRetargetBlockJSON.valueOf();
    }

    return initData;
}

export function validateHeaderPrevHashLE(header: Uint8Array, prevHeaderDigest: Uint8Array): boolean {
    // Extract prevHash of current header
    const prevHashLE = extractPrevBlockLE(header);

    // Compare prevHash of current header to previous header's digest
    if (!typedArraysAreEqual(prevHashLE, prevHeaderDigest)) {
        return false;
    }

    return true;
}

export function bytesToUintLE(uint8Arr: Uint8Array): BigInt {
    let total = BigInt.from(0);
    let base = BigInt.from(1);
    for (let i = 0; i < uint8Arr.length; i++) {
      // current byte:
      let val = BigInt.from(uint8Arr[i]);
      // add (val * base) to total
      total = total.add(val.mul(base));
      // multiply base by 256
      base = base.mul(BigInt.from(256));
    }
    return total;
}

export function bytesToUintBE(uint8Arr: Uint8Array): BigInt {
    let total = BigInt.from(0);
    for (let i = 0; i < uint8Arr.length; i++) {
        total = total.mul(BigInt.from(256));  // Shift left by 8 bits
        total = total.add(BigInt.from(uint8Arr[i]));
    }
    return total;
}

// Extract Bitcoin's Compact Bits Target as a 256-bit BigInt
export function extractTarget(header: Uint8Array): BigInt {
    const mantissaBytes: Uint8Array = header.slice(72, 75);  // 3-byte mantissa
    const exponent: i8 = header[75];  // 1-byte exponent

    // Convert mantissa correctly (it is **little-endian**, so we now reverse it)
    const mantissa: BigInt = bytesToUintLE(mantissaBytes);

    // Calculate full target: mantissa * 256^(exponent - 3)
    const shift: i8 = exponent - 3;

    const power: BigInt = BigInt.from(256).pow(shift);
    const target: BigInt = mantissa.mul(power);

    return target;
}

export function validateHeaderWork(digest: Uint8Array, target: BigInt): boolean {
    // Ensure the hash is not zero (invalid block)
    if (typedArraysAreEqual(digest, new Uint8Array(32))) {
        return false;
    }

    // Convert the 32-byte hash into a 256-bit BigInt
    const hashValue: BigInt = bytesToUintLE(digest);  // Ensure LE format

    // Validate PoW: block_hash <= target
    return hashValue.lte(target);
}

export function typedArraysAreEqual(a: Uint8Array, b: Uint8Array): boolean {
    if (!(a instanceof Uint8Array) || !(b instanceof Uint8Array)) {
        throw new Error('Arrays must be of type Uint8Array');
    }

    if (a.byteLength !== b.byteLength) return false;
    for (let i = 0; i < a.byteLength; i += 1) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

export function calculateDifficulty(target: BigInt): BigInt {
    return DIFF_ONE_TARGET.div(target);
}

export function validateHeaderChain(headers: Uint8Array): BigInt {
    if (headers.length % 80 !== 0) {
        throw new Error('Header bytes not multiple of 80.');
    }

    let digest: Uint8Array = new Uint8Array(0);
    let totalDifficulty: BigInt = BigInt.from(0);

    for (let i = 0; i < headers.length / 80; i += 1) {
        // ith header start index and ith header
        const start = i * 80;
        const header = headers.slice(start, start + 80);

        // After the first header, check that headers are in a chain
        if (i !== 0) {
            if (!validateHeaderPrevHashLE(header, digest)) {
                throw new Error('Header bytes not a valid chain.');
            }
        }

        // ith header target
        const target = extractTarget(header);

        // Require that the header has sufficient work
        digest = hash256(header);
        if (!validateHeaderWork(digest, target)) {
            throw new Error('Header does not meet its own difficulty target.');
        }

        totalDifficulty = totalDifficulty.add(calculateDifficulty(target));
    }

    return totalDifficulty;
}

export function extractTimestampLE(header: Uint8Array): Uint8Array {
    return header.slice(68, 72);
}

export function extractTimestamp(header: Uint8Array): BigInt {
    return bytesToUintBE(reverseEndianness(extractTimestampLE(header)));
}

export function isZeroFilled(block: Uint8Array): bool {
    for (let i = 0, k = block.length; i < k; ++i) {
        if (block[i] !== 0) return false;
    }
    return true;
}

export function sortPreheadersByHeight(preheaders: Map<string, Header>): Array<Map<string, Header>> {
    // Convert Map to an Array of values with their keys
    let entries: Array<Map<string, Header>> = new Array<Map<string, Header>>();
    let keys = preheaders.keys();
    for (let i = 0, k = keys.length; i < k; ++i) {
        let key = unchecked(keys[i]);
        let value = preheaders.get(key);
        if (value) {
            let entry = new Map<string, Header>();
            entry.set(key, value);
            entries.push(entry);
        }
    }

    // Sort the array using comparator function
    entries.sort((a: Map<string, Header>, b: Map<string, Header>): i32 => {
        if (a.values()[0].height > b.values()[0].height) return 1;
        if (a.values()[0].height < b.values()[0].height) return -1;
        return 0;
    });

    return entries;
}

export function serializePreHeaders(preheaders: Map<string, Header>): string {
    let encoder = new JSONEncoder();
    encoder.pushObject(null);

    let keys = preheaders.keys();
    for (let i = 0, k = keys.length; i < k; ++i) {
        let key = unchecked(keys[i]);
        let value = preheaders.get(key);
        if (value !== null) {
            value.stringify(encoder, key);
            encoder.popObject();
        }
    }
    encoder.popObject();
    return encoder.toString();
}

export function serializeHeaderState(headerState: Map<i64, string>): string {
    let encoder = new JSONEncoder();
    encoder.pushObject(null);

    let keys = headerState.keys();
    for (let i = 0, k = keys.length; i < k; ++i) {
        let key = unchecked(keys[i]);
        let value = headerState.get(key);
        if (value !== null) {
            encoder.setString(key.toString(), value);
        }
    }
    encoder.popObject();

    return encoder.toString();
}

export function getValidityDepth(defaultValue: i32): i32 {
    const valDepthString = retrieveString('validity_depth');
    if (valDepthString !== "null") {
        return parseInt(valDepthString) as i32;
    } else {
        saveString(`validity_depth`, defaultValue.toString());
        return defaultValue;
    }
}

export function formatBigIntWithScale(value: BigInt, scale: i32): string {
    let str = value.toString();

    // If scale is 0, return as is (integer format)
    if (scale == 0) return str;

    // If the number is smaller than the scale (e.g., 123 with scale 4 -> 0.0123)
    if (str.length <= scale) {
        return "0." + "0".repeat(scale - str.length) + str;
    }

    // Insert decimal point at the correct position
    let integerPart = str.slice(0, str.length - scale);
    let fractionalPart = str.slice(str.length - scale);

    return integerPart + "." + fractionalPart;
}

export function targetToDifficulty(currentTarget: BigInt): string {
    // amount of decimal precision
    let scale = 8;
    
    let scaledResult = DIFF_ONE_TARGET.mul(BigInt.from(10).pow(scale)).div(currentTarget);

    return formatBigIntWithScale(scaledResult, scale);
}

export function setLastDifficultyPeriodParams(defaultValue: DifficultyPeriodParams): void {
    let encoder = new JSONEncoder();
    encoder.pushObject(null);
    encoder.setString("startTimestamp", defaultValue.startTimestamp.toString());
    encoder.setString("endTimestamp", defaultValue.endTimestamp.toString());
    encoder.setString("difficulty", defaultValue.target.toString());
    encoder.setString("difficultyHumanReadable", targetToDifficulty(defaultValue.target));
    encoder.popObject();
    db.setObject(`last_difficulty_period_params`, encoder.toString());
}

export function getLastDifficultyPeriodParams(): DifficultyPeriodParams {
    const valDepthString = db.getObject(`last_difficulty_period_params`);
    if (valDepthString !== "null") {
        const parsed = <JSON.Obj>JSON.parse(valDepthString);
        const difficultyPeriodParams = new DifficultyPeriodParams(
            BigInt.fromString(getStringFromJSON(parsed, 'difficulty')),
            BigInt.fromString(getStringFromJSON(parsed, 'startTimestamp')),
            BigInt.fromString(getStringFromJSON(parsed, 'endTimestamp')),
            getStringFromJSON(parsed, 'difficultyHumanReadable')
        );
        return difficultyPeriodParams;
    }
    throw new Error('When starting from a block other than 0 you need to provide the lastDifficultyPeriodRetargetBlock');
}

// retarget algo implementation of https://github.com/bitcoin/bitcoin/blob/master/src/pow.cpp#L49
export function retargetAlgorithm(
    previousTarget: BigInt,  // This is the current target (e.g., DIFF_ONE_TARGET for difficulty 1)
    firstTimestamp: BigInt,
    secondTimestamp: BigInt
  ): BigInt {
    // Define bounds for elapsed time
    const lowerBound: BigInt = RETARGET_PERIOD.div(BigInt.from(4));
    const upperBound: BigInt = RETARGET_PERIOD.mul(BigInt.from(4));
  
    // Calculate elapsed time in seconds
    let elapsedTime: BigInt = secondTimestamp.sub(firstTimestamp);
  
    // Clamp elapsed time within bounds
    if (elapsedTime.lt(lowerBound)) {
      elapsedTime = lowerBound;
    }
    if (elapsedTime.gt(upperBound)) {
      elapsedTime = upperBound;
    }
  
    // Correct calculation:
    // new_target = previousTarget * (actual elapsed time / expected time)
    let retargetedDiff: BigInt = previousTarget.mul(elapsedTime).div(RETARGET_PERIOD);
  
    // Ensure the new target doesn't exceed the maximum target (DIFF_ONE_TARGET)
    if (retargetedDiff.gt(DIFF_ONE_TARGET)) {
      retargetedDiff = DIFF_ONE_TARGET;
    }
  
    return retargetedDiff;
  }

export function convertHeaderToDifficultyPeriodParams(header: string): DifficultyPeriodParams {
    const decodeHex = Arrays.fromHexString(header);
    const timestamp = extractTimestamp(decodeHex);
    const targetUnformatted = extractTarget(decodeHex);

    return new DifficultyPeriodParams(targetUnformatted, timestamp);
}

export function setHighestValidatedHeader(highestHeight: i32, highestBlockHeader: string): void {
    const blockHeaderHash = Arrays.toHexString(reverseEndianness(hash256(Arrays.fromHexString(highestBlockHeader))))
    let encoder = new JSONEncoder();
    encoder.pushObject(null);
    encoder.setInteger("height", highestHeight);
    encoder.setString("blockHeader", blockHeaderHash);
    encoder.popObject();
    db.setObject(`highest_validated_header`, encoder.toString());
}

export function getHighestValidatedHeader(): HighestValidatedHeader | null {
    const highestValidatedHeader = db.getObject(`highest_validated_header`);
    if (highestValidatedHeader !== "null") {
        const parsed = <JSON.Obj>JSON.parse(highestValidatedHeader);
        return new HighestValidatedHeader(
            getIntFromJSON(parsed, 'height') as i32,
            getStringFromJSON(parsed, 'blockHeader')
        );
    }
    return null;
}

/**
 * Rounds up the given value to the nearest multiple of 10^(precision).
 * For example, if value = 123456 and precision = 3, the result is 124000.
 */
function roundUpDifficulty(value: BigInt, precision: u32): BigInt {
  // Compute factor = 10^precision using a loop
  let factor: BigInt = BigInt.from(1);
  for (let i: u32 = 0; i < precision; i++) {
    factor = factor.mul(BigInt.from(10));
  }

  // Define one using BigInt.from()
  let one: BigInt = BigInt.from(1);

  // Calculate the numerator: value + factor - one
  let numerator: BigInt = value.add(factor).sub(one);

  // Perform ceiling division: quotient = (value + factor - one) / factor
  let quotient: BigInt = numerator.div(factor);

  // Multiply the quotient by factor to get the rounded result
  let rounded: BigInt = quotient.mul(factor);

  return rounded;
}

export function passesRetargetProcess(block: Header, lastDifficultyPeriodParams: DifficultyPeriodParams): RetargetAlgorithmResult {
    let difficultyParamsChanged: boolean = false;

    if (block.height !== 0) {
        if (block.height % RETARGET_PERIOD_BLOCKS === RETARGET_PERIOD_BLOCKS - 1) {
            lastDifficultyPeriodParams.endTimestamp = block.timestamp;
            difficultyParamsChanged = true;
            debugLog('Valdating block before next retarget period (2016-1 block), timestamp ' + lastDifficultyPeriodParams.endTimestamp.toString())
        }

        if (block.height % RETARGET_PERIOD_BLOCKS === 0) {            
            let retargetedDiff = retargetAlgorithm(lastDifficultyPeriodParams.target, lastDifficultyPeriodParams.startTimestamp, lastDifficultyPeriodParams.endTimestamp);
            lastDifficultyPeriodParams = new DifficultyPeriodParams(retargetedDiff, block.timestamp, BigInt.from(0))
            difficultyParamsChanged = true;
            debugLog('Validating block at next retarget period (2016 block), timestamp ' + lastDifficultyPeriodParams.startTimestamp.toString() + ' calculated difficulty ' + retargetedDiff.toString());            
        }
    }
    
    let calculatedRounded: BigInt = roundUpDifficultyToLeftDigits(lastDifficultyPeriodParams.target)
    if (calculatedRounded.gt(block.targetUnformatted)){
        return new RetargetAlgorithmResult(lastDifficultyPeriodParams, difficultyParamsChanged, true);
    }

    return new RetargetAlgorithmResult(lastDifficultyPeriodParams, false, false);
}

export function roundUpDifficultyToLeftDigits(target: BigInt): BigInt {
    let precision = target.toString().length - RETARGET_VALIDATION_PRECISION;

    return roundUpDifficulty(target, precision);    
}

export function debugLog(message: string): void {
    if (debugMode) {
        console.logToFile(message);
    }
}

// pla: processHeaders only works when you start at block zero, with this function you can start at any arbitrary height, 
// there probably more optimal ways to do this without initializing the preheaders with a block, but this should be sufficient for now
export function initializeAtSpecificBlock(initDataString: string): void {
    const initData = parseInitData(initDataString);

    if (db.getObject(`pre-headers/main`) === "null") {
        getValidityDepth(initData.validityDepth);
        let lastDifficultyPeriodRetargetBlock: string;
        if (initData.lastDifficultyPeriodRetargetBlock !== null) {
            lastDifficultyPeriodRetargetBlock = initData.lastDifficultyPeriodRetargetBlock!;
        } else {
            if (initData.height < RETARGET_PERIOD_BLOCKS) {
                lastDifficultyPeriodRetargetBlock = FIRST_DIFFICULTY_PERIOD_HEADER;
            } else {
                throw new Error('Please supply lastDifficultyPeriodRetargetBlock when you start with a block height higher than the first retarget period');
            }
        }
        setLastDifficultyPeriodParams(convertHeaderToDifficultyPeriodParams(lastDifficultyPeriodRetargetBlock))

        const decodeHex = Arrays.fromHexString(initData.startHeader);
        const prevBlockLE = extractPrevBlockLE(decodeHex);
        const prevBlock = reverseEndianness(prevBlockLE);
        const timestamp = extractTimestamp(decodeHex);
        // pla: maybe merkleRoot does not need to be reversed, came to that conclusion because the library we use for validating proofs for example takes it in the other way
        const merkleRoot = reverseEndianness(extractMerkleRootLE(decodeHex));
        const headerHash = hash256(decodeHex);
        const target = validateHeaderChain(decodeHex);
        const targetUnformatted = extractTarget(decodeHex);

        const decodedHeader = new Header(
            prevBlock,
            timestamp,
            merkleRoot,
            target,
            targetUnformatted,
            initData.height,
            initData.startHeader
        );

        const preheaders: Map<string, Header> = new Map<string, Header>();
        preheaders.set(Arrays.toHexString(reverseEndianness(headerHash)), decodedHeader);
        db.setObject(`pre-headers/main`, serializePreHeaders(preheaders));

        let key = calcKey(decodedHeader.height);
        let stateForKey = new Map<i64, string>();
        stateForKey.set(decodedHeader.height, initData.startHeader);
        headersState.set(key, stateForKey);

        db.setObject(`headers/${key}`, serializeHeaderState(stateForKey));
    }
}

export function clearPreHeaders(): void {
    db.setObject(`pre-headers/main`, "{}");
}

export function processHeaders(processDataString: string): void {
    const processData = parseProcessData(processDataString);
    const headers: Array<string> = processData.headers;
    const preheaders = getPreheaders();

    // if processData and preheaders in sum are more than X, we should clear the preheaders
    if (headers.length + preheaders.size > MAX_PREHEADER_SIZE) {
        debugLog('Too many headers in memory. Preheaders need to be cleared.');
        throw new Error('Too many headers in memory, please clear preheaders');
    }

    const highestValidatedHeader = getHighestValidatedHeader();
    const validityDepth = getValidityDepth(DEFAULT_VALIDITY_DEPTH);

    for (let i = 0; i < headers.length; ++i) {
        debugLog('Processing preheader index: ' + i.toString());
        let rawBH = headers[i];
        const decodeHex = Arrays.fromHexString(rawBH);
        const prevBlockLE = extractPrevBlockLE(decodeHex);
        const prevBlock = reverseEndianness(prevBlockLE);
        const timestamp = extractTimestamp(decodeHex);
        // pla: maybe merkleRoot does not need to be reversed, come to the conclusion because the library we use for validating proofs for example takes it in the other way
        const merkleRoot = reverseEndianness(extractMerkleRootLE(decodeHex));
        const headerHash = hash256(decodeHex);
        const target = validateHeaderChain(decodeHex);
        const targetUnformatted = extractTarget(decodeHex);
        
        let prevHeight: i32 = 0;

        const prevBlockStr = Arrays.toHexString(prevBlock)
        let continueLoop: bool = true;

        if (prevBlockStr === '0000000000000000000000000000000000000000000000000000000000000000') {
            prevHeight = -1;
            setLastDifficultyPeriodParams(new DifficultyPeriodParams(targetUnformatted, timestamp));
        } else if (preheaders.has(prevBlockStr)) {
            let blockInfo = preheaders.get(prevBlockStr);
            if (blockInfo) {
                prevHeight = blockInfo.height as i32;
            } else {
                // pla: because assemblyscript doesnt support 'continue;'
                continueLoop = false;
            }
        } else if (highestValidatedHeader && prevBlockStr === highestValidatedHeader.blockHeader) {
            prevHeight = highestValidatedHeader.height;
        } else {
            // pla: because assemblyscript doesnt support 'continue;'
            continueLoop = false;
        }

        const currentHeight = prevHeight + 1;

        if (continueLoop) {
            debugLog('Successfully added preheader height:' + currentHeight.toString() + ', insert index ' + i.toString() + ' to preheaders');
            const decodedHeader = new Header(
                prevBlock,
                timestamp,
                merkleRoot,
                target,
                targetUnformatted,
                currentHeight,
                rawBH
            );

            preheaders.set(Arrays.toHexString(reverseEndianness(headerHash)), decodedHeader);
        }
    }

    let sortedPreheaders: Array<Map<string, Header>> = sortPreheadersByHeight(preheaders);
    const topHeader: Uint8Array = Arrays.fromHexString(sortedPreheaders[sortedPreheaders.length - 1].keys()[0]);
    let blocksToPush: Array<Header> = [];
    let curDepth: i32 = 1;
    let prevBlock: Uint8Array | null = null;

    debugLog('Verifying the chain of blocks by previous block header');
    while (true) {
        if (!prevBlock) {
            prevBlock = topHeader;
        }

        let prevBlockStr = Arrays.toHexString(prevBlock);

        if (preheaders.has(prevBlockStr)) {
            let currentHeader = preheaders.get(prevBlockStr);
            // pla: skipping last x blocks below validity_depth            
            if (curDepth >= validityDepth) {
                debugLog('Verified block ' + currentHeader.height.toString() + ' passes validity depth');
                blocksToPush.push(currentHeader);
            } else {
                curDepth = curDepth + 1;
            }
            prevBlock = currentHeader.prevBlock;
        } else if (blocksToPush.length == preheaders.keys().length + 1 - validityDepth) {
            debugLog('Added all preheaders allowed for specified validity depth')
            break;
        } else {
            debugLog('Could not find preheader for block ' + curDepth.toString() + '. This message should not occur in normal operation');
            break;
        }
    }

    let lastDifficultyPeriodParams: DifficultyPeriodParams = getLastDifficultyPeriodParams();
    if (lastDifficultyPeriodParams.startTimestamp.eq(0)) {
        debugLog('lastDifficultyPeriodParams.startTimestamp is not set. This error should never happen.');
        throw new Error('lastDifficultyPeriodParams.startTimestamp is not set. This error should never happen.');
    }

    let highestHeight = highestValidatedHeader !== null ? highestValidatedHeader.height: 0;
    let highestBlockHeader: string = "";
    debugLog('Verifying the chain of blocks by height and target difficulty');
    for (let i = blocksToPush.length - 1; i > 0; i--) {
        let block = blocksToPush[i];
        let key = calcKey(block.height);
        debugLog('Processing block ' + block.height.toString());

        //Get headers in memory if not available
        if (!headersState.has(key)) {
            debugLog('Pulling confirmed headers into memory ' + key)
            const pulledHeaders = getHeaders(key);
            headersState.set(key, pulledHeaders);
        }

        if (highestHeight < block.height) {
            let retargetProcessResult = passesRetargetProcess(block, lastDifficultyPeriodParams);

            if (retargetProcessResult.blockPasses) {
                if (retargetProcessResult.difficultyPeriodParamsChanged) {
                    lastDifficultyPeriodParams = retargetProcessResult.lastDifficultyPeriodParams;
                    setLastDifficultyPeriodParams(lastDifficultyPeriodParams);
                    debugLog('Difficulty period params changed ' + lastDifficultyPeriodParams.difficultyHumanReadable);
                }

                debugLog('Block ' + block.height.toString() + ' passes retarget process|' + ' blocks difficulty: ' + targetToDifficulty(block.targetUnformatted) + ' target of period: ' + targetToDifficulty(lastDifficultyPeriodParams.target));
                highestHeight = block.height;
                highestBlockHeader = block.raw;

                // Add validated header if retarget passes
                let stateForKey = headersState.get(key);

                if (stateForKey && !stateForKey.has(block.height)) {
                    stateForKey.set(block.height, block.raw);
                } else {
                    throw new Error('Block already added, this error should not occur')
                }
            } else {
                // theres a problem..
                debugLog('Block ' + block.height.toString() + ' does NOT pass retarget process:')
                debugLog('Long decimal format | blocks difficulty: ' + block.targetUnformatted.toString() + ' target of period: ' + lastDifficultyPeriodParams.target.toString() + ' target of period rounded: ' + roundUpDifficultyToLeftDigits(lastDifficultyPeriodParams.target).toString());
                debugLog('Block explorer format | blocks difficulty: ' + targetToDifficulty(block.targetUnformatted) + ' target of period: ' + targetToDifficulty(lastDifficultyPeriodParams.target) + ' target of period rounded: ' + targetToDifficulty(roundUpDifficultyToLeftDigits(lastDifficultyPeriodParams.target)));                
                debugLog('Aborting validation as we only want blocks to be processed in order')
                break;
            }
        }
    }

    if (highestBlockHeader !== "") {
        debugLog('New highest validated block found| height: ' + highestHeight.toString() + ' header: ' + highestBlockHeader);
        setHighestValidatedHeader(highestHeight, highestBlockHeader);
    }

    if (highestHeight > validityDepth) {
        let preHeaderKeys = preheaders.keys();
    
        for (let i = 0; i < preHeaderKeys.length; ++i) {        
            let key = unchecked(preHeaderKeys[i]);
            let value = preheaders.get(key);
            if (highestHeight >= value.height) {
                debugLog('Deleting preheader ' + value.height.toString());
                preheaders.delete(unchecked(key));
            }
        }
    } 

    let headerStateKeys = headersState.keys();
    for (let i = 0; i < headerStateKeys.length; ++i) {
        let key = unchecked(headerStateKeys[i]);
        if (headersState.has(key)) {
            debugLog('Adding headers to db for key ' + key);
            let val = headersState.get(key);
            const serializedHeaderState = serializeHeaderState(val);
            db.setObject(`headers/${key}`, serializedHeaderState);
        }
    }
    db.setObject(`pre-headers/main`, serializePreHeaders(preheaders));
    debugLog('----------------------- Finished execution -----------------------');
}

