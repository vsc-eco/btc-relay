import { Arrays, SystemAPI, db } from "@vsc.eco/sdk/assembly";
import { JSON } from "assemblyscript-json/assembly";

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
        return Arrays.fromHexString(result.getString('result')!.valueOf()!)
    } else {
        //Never should happen
        throw new Error('Crypto - incorrect binding response')
    }
}