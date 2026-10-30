import { useWriteContract, useWatchContractEvent } from 'wagmi';
import { HealthProverAbi } from '@/lib/abis';

export const HEALTH_PROVER_ADDRESS = (process.env.NEXT_PUBLIC_HEALTH_PROVER_ADDRESS ||
  '0x4444444444444444444444444444444444444444') as `0x${string}`;

export function useVerifyHealthClaim() {
  return useWriteContract();
}

export function useWatchProofVerified(onLog?: (log: any) => void) {
  return useWatchContractEvent({
    address: HEALTH_PROVER_ADDRESS,
    abi: HealthProverAbi,
    eventName: 'ProofVerified',
    onLogs: onLog,
  });
}
