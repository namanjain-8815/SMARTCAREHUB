import { useWriteContract, useReadContract, useWatchContractEvent } from 'wagmi';
import { DelegationManagerAbi } from '@/lib/abis';

export const DELEGATION_MANAGER_ADDRESS = (process.env.NEXT_PUBLIC_DELEGATION_MANAGER_ADDRESS ||
  '0xCc8a8408203d25581ad3055753cD46D8EA56E832') as `0x${string}`;

export function useGrantDelegation() {
  return useWriteContract();
}

export function useRevokeDelegation() {
  return useWriteContract();
}

export function useHasValidAccess(grantor?: `0x${string}`, delegate?: `0x${string}`) {
  return useReadContract({
    address: DELEGATION_MANAGER_ADDRESS,
    abi: DelegationManagerAbi,
    functionName: 'hasValidAccess',
    args: grantor && delegate ? [grantor, delegate] : undefined,
  });
}

export function useWatchDelegationGranted(onLog?: (log: any) => void) {
  return useWatchContractEvent({
    address: DELEGATION_MANAGER_ADDRESS,
    abi: DelegationManagerAbi,
    eventName: 'DelegationGranted',
    onLogs: onLog,
  });
}
