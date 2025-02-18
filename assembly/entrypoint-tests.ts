import { Arrays, console } from '@vsc.eco/sdk/assembly';
import * as btcRelay from './btc-relay'
import { BigInt } from "as-bigint/assembly"
export * from './btc-relay'

export function wrapperExtractTarget(header: string) : string {
    const headerArray = Arrays.fromHexString(header)
    return btcRelay.extractTarget(headerArray).toString();
}

export function wrapperRetargetAlgorithm(previousTarget: string, firstTimestamp: string, secondTimestamp: string) : string {
    const test = btcRelay.retargetAlgorithm(BigInt.fromString(previousTarget), BigInt.fromString(firstTimestamp), BigInt.fromString(secondTimestamp));
    return test.toString();
}