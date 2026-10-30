import { useWriteContract, useReadContract, useWatchContractEvent } from 'wagmi';
import { AdherenceLoggerAbi } from '@/lib/abis';

export const ADHERENCE_LOGGER_ADDRESS = (process.env.NEXT_PUBLIC_ADHERENCE_LOGGER_ADDRESS ||
  '0x47F894105De0c6cBffeFE297Ce60Bcd771235Cad') as `0x${string}`;

export function useLogDosage() {
  return useWriteContract();
}

export function useComputeComplianceScore(patient?: `0x${string}`, fromTime?: bigint, toTime?: bigint) {
  return useReadContract({
    address: ADHERENCE_LOGGER_ADDRESS,
    abi: AdherenceLoggerAbi,
    functionName: 'computeComplianceScore',
    args: patient && fromTime !== undefined && toTime !== undefined ? [patient, fromTime, toTime] : undefined,
  });
}

export function useWatchDosageConfirmed(onLog?: (log: any) => void) {
  return useWatchContractEvent({
    address: ADHERENCE_LOGGER_ADDRESS,
    abi: AdherenceLoggerAbi,
    eventName: 'DosageConfirmed',
    onLogs: onLog,
  });
}
