export const DOSAGE_TYPES = {
    DosageEvent: [
        { name: 'medicationId', type: 'string' },
        { name: 'scheduledAt', type: 'uint256' },
        { name: 'confirmedAt', type: 'uint256' },
    ],
};
export function getDosageDomain(contractAddress, chainId = 11155111) {
    return {
        name: 'SmartCareHub.AdherenceLogger',
        version: '1',
        chainId,
        verifyingContract: contractAddress,
    };
}
/** Produces an EIP-712 signature for a dosage confirmation. */
export async function signDosageEvent(walletClient, contractAddress, payload, chainId = 11155111) {
    return walletClient.signTypedData({
        account: walletClient.account,
        domain: getDosageDomain(contractAddress, chainId),
        types: DOSAGE_TYPES,
        primaryType: 'DosageEvent',
        message: payload,
    });
}
