import { BigInt } from "as-bigint/assembly";
import { db, Arrays, SystemAPI, Crypto, reverseEndianness } from '@vsc.eco/sdk/assembly';
import { calcKey, extractPrevBlockLE, getHeaders, extractMerkleRootLE, hash256, getStringFromJSON } from './btc-relay-utils';
import { JSON, JSONEncoder } from "assemblyscript-json/assembly";

class FullProof {
    confirming_header: ConfirmingHeader | null = null

    confirming_height: i64

    version: string
    vin: string
    vout: string
    locktime: string
    tx_id: string
    // pla: probably needs to be an array
    intermediate_nodes: string
    index: i64

    constructor(confirming_height: i64, version: string, vin: string, vout: string, locktime: string, tx_id: string, intermediate_nodes: string, index: i64) {
        this.confirming_height = confirming_height
        this.version = version
        this.vin = vin
        this.vout = vout
        this.locktime = locktime
        this.tx_id = tx_id
        this.intermediate_nodes = intermediate_nodes
        this.index = index
    }
}

class ConfirmingHeader {
    raw: string
    hash: string
    height: i64
    prevhash: string
    merkle_root: string

    constructor(raw: string, hash: string, height: i64, prevhash: string, merkle_root: string) {
        this.raw = raw
        this.hash = hash
        this.height = height
        this.prevhash = prevhash
        this.merkle_root = merkle_root
    }
}

function serializeConfirmingHeader(confirmingHeader: ConfirmingHeader, encoder: JSONEncoder): void {
    encoder.pushObject("confirming_header");

    encoder.setString('raw', confirmingHeader.raw);
    encoder.setString('hash', confirmingHeader.hash);
    encoder.setInteger('height', confirmingHeader.height);
    encoder.setString('prevhash', confirmingHeader.prevhash);
    encoder.setString('merkle_root', confirmingHeader.merkle_root);

    encoder.popObject();
}

function serializeProof(proof: FullProof, encoder: JSONEncoder): void {
    encoder.pushObject(null);

    if (proof.confirming_header) {
        serializeConfirmingHeader(proof.confirming_header!, encoder);
    }
    encoder.setString('confirming_height', proof.confirming_height.toString());
    encoder.setString('version', proof.version);
    encoder.setString('vin', proof.vin);
    encoder.setString('vout', proof.vout);
    encoder.setString('locktime', proof.locktime);
    encoder.setString('tx_id', proof.tx_id);
    encoder.setString('intermediate_nodes', proof.intermediate_nodes);
    encoder.setInteger('index', proof.index);

    encoder.popObject();
}

function deserializeProof(encoder: JSON.Obj): FullProof {
    const confirming_height = encoder.getInteger('confirming_height')!.valueOf() as i64;
    const version = getStringFromJSON(encoder, 'version');
    const vin = getStringFromJSON(encoder, 'vin');
    const vout = getStringFromJSON(encoder, 'vout');
    const locktime = getStringFromJSON(encoder, 'locktime');
    const tx_id = getStringFromJSON(encoder, 'tx_id');
    const intermediate_nodes = getStringFromJSON(encoder, 'intermediate_nodes');
    const index = encoder.getInteger('index')!.valueOf() as i64;

    return new FullProof(confirming_height, version, vin, vout, locktime, tx_id, intermediate_nodes, index);
}

export function validateTxProof(proofStringJSON: string): bool {
    const proofJSON = <JSON.Obj>JSON.parse(proofStringJSON);
    const proof = deserializeProof(proofJSON);

    const bundleHeaders: Map<i64, string> = getHeaders(calcKey(<i32>proof.confirming_height));
    const header = bundleHeaders.get(proof.confirming_height);
    const decodeHex = Arrays.fromHexString(header);
    const prevBlockLE = extractPrevBlockLE(decodeHex);
    const prevBlock = Arrays.toHexString(prevBlockLE, true);
    const merkleRoot = Arrays.toHexString(extractMerkleRootLE(decodeHex), true);
    const headerHash = Arrays.toHexString(hash256(decodeHex), true);

    proof.confirming_header = new ConfirmingHeader(header, headerHash, proof.confirming_height, prevBlock, merkleRoot);

    let encoder = new JSONEncoder();
    serializeProof(proof, encoder);
    const serializedProof = encoder.toString();
    const obj = new JSON.Obj()
    obj.set('arg0', serializedProof);
    const proofDTO = obj.stringify();
   
    const result = <JSON.Obj>JSON.parse(SystemAPI.call('bitcoin.validateSPVProof', proofDTO)) 

    if (result.has('result') && result.getBool('result')!.isBool) {
        const isValidProof = result.getBool('result')!.valueOf()
        // console.log('the proof is ' + (isValidProof ? 'valid': 'invalid'))
        return isValidProof;
    } else {
        //Never should happen
        throw new Error('Crypto - incorrect binding response')
    }
}