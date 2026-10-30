export interface DosagePayload {
  medicationId: string;
  scheduledAt: bigint;
  confirmedAt: bigint;
}

export const DOSAGE_TYPES = {
  DosageEvent: [
    { name: 'medicationId', type: 'string' },
    { name: 'scheduledAt', type: 'uint256' },
    { name: 'confirmedAt', type: 'uint256' },
  ],
} as const;

export function getDosageDomain(contractAddress: `0x${string}`, chainId: number = 11155111) {
  return {
    name: 'SmartCareHub.AdherenceLogger',
    version: '1',
    chainId,
    verifyingContract: contractAddress,
  } as const;
}

export interface ViemTypedDataSigner {
  account: { address: `0x${string}` } | `0x${string}`;
  signTypedData: (params: {
    account: any;
    domain: any;
    types: any;
    primaryType: string;
    message: any;
  }) => Promise<`0x${string}`>;
}

/** Produces an EIP-712 signature for a dosage confirmation. */
export async function signDosageEvent(
  walletClient: ViemTypedDataSigner,
  contractAddress: `0x${string}`,
  payload: DosagePayload,
  chainId: number = 11155111
): Promise<`0x${string}`> {
  return walletClient.signTypedData({
    account: walletClient.account,
    domain: getDosageDomain(contractAddress, chainId),
    types: DOSAGE_TYPES,
    primaryType: 'DosageEvent',
    message: payload,
  });
}
