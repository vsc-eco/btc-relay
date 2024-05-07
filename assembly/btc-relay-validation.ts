import { BigInt } from "as-bigint/assembly";
import { db, Arrays, SystemAPI, Crypto, reverseEndianness } from '@vsc.eco/sdk/assembly';
import { calcKey, extractPrevBlockLE, getHeaders, extractMerkleRootLE, hash256 } from './btc-relay-utils';
import { JSON, JSONEncoder } from "assemblyscript-json/assembly";

class FullProof {
    confirming_header: ConfirmingHeader

    confirming_height: i64

    version: string
    vin: string
    vout: string
    locktime: string
    tx_id: string
    // pla: probably needs to be an array
    intermediate_nodes: string
    index: i64

    constructor(confirming_header: ConfirmingHeader, confirming_height: i64, version: string, vin: string, vout: string, locktime: string, tx_id: string, intermediate_nodes: string, index: i64) {
        this.confirming_header = confirming_header
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

    serializeConfirmingHeader(proof.confirming_header, encoder);
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


// export function validateTxProof(proof: TxProof): boolean {
export function validateTxProof(): boolean {
    // DBG INVALID PROOF, COUPLE OF 
    const confirmingHeader = new ConfirmingHeader(
        "0x0000c020c238b601AA8b7297346ab2ed59942d7d7ecea8d23a1001000000000000000000b61acAA842abc82aa93644b190fc18ad46c6738337e78bc0c69ab21c5d5ee2ddd6376d5d3e211a17d8706a84",
        "0x4d0cfbf5aa3b2359e5cb7dcf3b286264bd22de883b6316000000000000000000",
        592920,
        "0xc238b601308b7297346ab2ed59942dAA7ecea8d23a1001000000000000000000",
        "0xb61ac9AA42abc82aa93644b190fc18ad46c6738337e78bc0c69ab21c5d5ee2dd"
    );

    const proof = new FullProof(
        confirmingHeader,
        592920,
        "0x01000000",
        "0x0101748906a5c7064550a594c468AAfc6d1ee25292b638c4328bb66403cfceb58a000000006a4730440220364301a77ee7ae34fa71768941a2aad5bd1fa8d3e30d4ce6424d8752e83f2c1b02203c9f8aafced701f59ffb7c151ff2523f3ed1586d29b674efb489e803e9bf93050121029b3008c0fa147fd9db5146e42b27eb0a77389497713d3aad083313d1b1b05ec0ffffffff",
        "0x0316312f0000000AA001976a91400cc8d95d6835252e0d95eb03b11691a21a7bac588ac220200000000000017a914e5034b9de4881d62480a2df81032ef0299dcdc32870000000000000000166a146f6d6e69000000000000001f0000000315e17900",
        "0x00000000",
        "0x5176f6b03b8bc29f4deafbb7384b673debde6ae712deab93f3b0c91fdcd6d674",
        "0x8d7a6d53ce27f7980AA31f1aae5f172c43d128b210ab4962d488c81c96136cfb75c95def872e878839bd93b42c04eb44da44c401a2d580ca343c3262e9c0a2819ed4bbfb9ea620280b31433f43b2512a893873b8c8c679f61e1a926c0ec80bcfc6225a15d72fbd1116f78b14663d8518236b02e765bf0a746a6a08840c122a02afa4df3ab6b9197a20f00495a404ee8e07da2b7554e94609e9ee1d5da0fb7857ea0332072568d0d53a9aedf851892580504a7fcabfbdde076242eb7f4e5f218a14d2a3f357d950b4f6a1dcf93f7c19c44d0fc122d00afa297b9503c1a6ad24cf36cb5f2835bcf490371db2e96047813a24176c3d3416f84b7ddfb7d8c915eb0c5ce7de089b5d9e700ecd12e09163f173b70bb4c9af33051b466b1f55abd66f3121216ad0ad9dfa898535e1d5e51dd07bd0a73d584daace7902f20ece4ba4f4f241c80cb31eda88a244a3c68d0f157c1049b4153d7addd6548aca0885acafbf98a1f8345c89914c24729ad095c7a0b9acd20232ccd90dbd359468fcc4eee7b67d",
        26
    );

    // DBG, VALID PROOF FROM SUMMA-TX
    // const confirmingHeader = new ConfirmingHeader(
    //     "0x0000c020c238b601308b7297346ab2ed59942d7d7ecea8d23a1001000000000000000000b61ac92842abc82aa93644b190fc18ad46c6738337e78bc0c69ab21c5d5ee2ddd6376d5d3e211a17d8706a84",
    //     "0x4d0cfbf5aa3b2359e5cb7dcf3b286264bd22de883b6316000000000000000000",
    //     592920,
    //     "0xc238b601308b7297346ab2ed59942d7d7ecea8d23a1001000000000000000000",
    //     "0xb61ac92842abc82aa93644b190fc18ad46c6738337e78bc0c69ab21c5d5ee2dd"
    // );

    // const proof = new FullProof(
    //     confirmingHeader,
    //     592920,
    //     "0x01000000",
    //     "0x0101748906a5c7064550a594c4683ffc6d1ee25292b638c4328bb66403cfceb58a000000006a4730440220364301a77ee7ae34fa71768941a2aad5bd1fa8d3e30d4ce6424d8752e83f2c1b02203c9f8aafced701f59ffb7c151ff2523f3ed1586d29b674efb489e803e9bf93050121029b3008c0fa147fd9db5146e42b27eb0a77389497713d3aad083313d1b1b05ec0ffffffff",
    //     "0x0316312f00000000001976a91400cc8d95d6835252e0d95eb03b11691a21a7bac588ac220200000000000017a914e5034b9de4881d62480a2df81032ef0299dcdc32870000000000000000166a146f6d6e69000000000000001f0000000315e17900",
    //     "0x00000000",
    //     "0x5176f6b03b8bc29f4deafbb7384b673debde6ae712deab93f3b0c91fdcd6d674",
    //     "0x8d7a6d53ce27f79802631f1aae5f172c43d128b210ab4962d488c81c96136cfb75c95def872e878839bd93b42c04eb44da44c401a2d580ca343c3262e9c0a2819ed4bbfb9ea620280b31433f43b2512a893873b8c8c679f61e1a926c0ec80bcfc6225a15d72fbd1116f78b14663d8518236b02e765bf0a746a6a08840c122a02afa4df3ab6b9197a20f00495a404ee8e07da2b7554e94609e9ee1d5da0fb7857ea0332072568d0d53a9aedf851892580504a7fcabfbdde076242eb7f4e5f218a14d2a3f357d950b4f6a1dcf93f7c19c44d0fc122d00afa297b9503c1a6ad24cf36cb5f2835bcf490371db2e96047813a24176c3d3416f84b7ddfb7d8c915eb0c5ce7de089b5d9e700ecd12e09163f173b70bb4c9af33051b466b1f55abd66f3121216ad0ad9dfa898535e1d5e51dd07bd0a73d584daace7902f20ece4ba4f4f241c80cb31eda88a244a3c68d0f157c1049b4153d7addd6548aca0885acafbf98a1f8345c89914c24729ad095c7a0b9acd20232ccd90dbd359468fcc4eee7b67d",
    //     26
    // );

    // ----------------

    const bundleHeaders: Map<i64, string> = getHeaders(calcKey(<i32>proof.confirming_height));
    const header = bundleHeaders.get(proof.confirming_height);
    const decodeHex = Arrays.fromHexString(header);
    const prevBlockLE = extractPrevBlockLE(decodeHex);
    const prevBlock = Arrays.toHexString(reverseEndianness(prevBlockLE));
    const merkleRoot = Arrays.toHexString(reverseEndianness(extractMerkleRootLE(decodeHex)));
    const headerHash = Arrays.toHexString(hash256(decodeHex));
    const confirming_header = new ConfirmingHeader(header, headerHash, proof.confirming_height, prevBlock, merkleRoot);

    // const proof = new FullProof(proof, confirming_header);
    let encoder = new JSONEncoder();
    serializeProof(proof, encoder);
    const serializedProof = encoder.toString();
    const obj = new JSON.Obj()
    obj.set('arg0', serializedProof);
    const proofDTO = obj.stringify();
   
    const result = <JSON.Obj>JSON.parse(SystemAPI.call('bitcoin.validateSPVProof', proofDTO)) 

    if (result.has('result') && result.getBool('result')!.isBool) {
        const test = result.getBool('result')!
        console.log('the proof is ' + (test ? 'valid': 'invalid'))
        return true;
    } else {
        //Never should happen
        throw new Error('Crypto - incorrect binding response')
    }
}