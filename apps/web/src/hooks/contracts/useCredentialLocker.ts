import { useWriteContract, useReadContract, useWatchContractEvent } from 'wagmi';
import { CredentialLockerAbi } from '@/lib/abis';

export const CREDENTIAL_LOCKER_ADDRESS = (process.env.NEXT_PUBLIC_CREDENTIAL_LOCKER_ADDRESS ||
  '0xca7075c1150f3Db3cd6Fa9546Bf38aE18ff18DD3') as `0x${string}`;

export function useSetTriagePayload() {
  return useWriteContract();
}

export function useBreakGlassAsGuardian() {
  return useWriteContract();
}

export function useBreakGlassAsMedic() {
  return useWriteContract();
}

export function useGetAuditLog(patient?: `0x${string}`) {
  return useReadContract({
    address: CREDENTIAL_LOCKER_ADDRESS,
    abi: CredentialLockerAbi,
    functionName: 'getAuditLog',
    args: patient ? [patient] : undefined,
  });
}

export function useWatchBreakGlassAccessed(onLog?: (log: any) => void) {
  return useWatchContractEvent({
    address: CREDENTIAL_LOCKER_ADDRESS,
    abi: CredentialLockerAbi,
    eventName: 'BreakGlassAccessed',
    onLogs: onLog,
  });
}
