export interface DosagePayload {
    medicationId: string;
    scheduledAt: bigint;
    confirmedAt: bigint;
}
export declare const DOSAGE_TYPES: {
    readonly DosageEvent: readonly [{
        readonly name: "medicationId";
        readonly type: "string";
    }, {
        readonly name: "scheduledAt";
        readonly type: "uint256";
    }, {
        readonly name: "confirmedAt";
        readonly type: "uint256";
    }];
};
export declare function getDosageDomain(contractAddress: `0x${string}`, chainId?: number): {
    readonly name: "SmartCareHub.AdherenceLogger";
    readonly version: "1";
    readonly chainId: number;
    readonly verifyingContract: `0x${string}`;
};
export interface ViemTypedDataSigner {
    account: {
        address: `0x${string}`;
    } | `0x${string}`;
    signTypedData: (params: {
        account: any;
        domain: any;
        types: any;
        primaryType: string;
        message: any;
    }) => Promise<`0x${string}`>;
}
/** Produces an EIP-712 signature for a dosage confirmation. */
export declare function signDosageEvent(walletClient: ViemTypedDataSigner, contractAddress: `0x${string}`, payload: DosagePayload, chainId?: number): Promise<`0x${string}`>;
