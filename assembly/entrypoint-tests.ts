import { Arrays, console } from '@vsc.eco/sdk/assembly';
import * as btcRelay from './btc-relay'
import { BigInt } from "as-bigint/assembly"
export * from './btc-relay'

export function wrapperExtractTarget(header: string) : string {
    const headerArray = Arrays.fromHexString(header)
    return btcRelay.extractTarget(headerArray).toString();
}

export function wrapperRetargetAlgorithm(previousTarget: string, firstTimestamp: number, secondTimestamp: number) : string {
    const prev = BigInt.fromString(previousTarget)
    const test = btcRelay.retargetAlgorithm(prev, firstTimestamp as i64, secondTimestamp as i64);
    return test.toString();
}