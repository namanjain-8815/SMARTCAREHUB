import { useWriteContract, useReadContract, useWatchContractEvent } from 'wagmi';
import { RecordRegistryAbi } from '@/lib/abis';

export const RECORD_REGISTRY_ADDRESS = (process.env.NEXT_PUBLIC_RECORD_REGISTRY_ADDRESS ||
  '0x712A6c93B844102113FEc1B65f63B718a3ED60D1') as `0x${string}`;

export function useAnchorRecord() {
  return useWriteContract();
}

export function useGetMyRecords() {
  return useReadContract({
    address: RECORD_REGISTRY_ADDRESS,
    abi: RecordRegistryAbi,
    functionName: 'getMyRecords',
  });
}

export function useGetRecordsOf(owner?: `0x${string}`) {
  return useReadContract({
    address: RECORD_REGISTRY_ADDRESS,
    abi: RecordRegistryAbi,
    functionName: 'getRecordsOf',
    args: owner ? [owner] : undefined,
  });
}

export function useWatchRecordAnchored(onLog?: (log: any) => void) {
  return useWatchContractEvent({
    address: RECORD_REGISTRY_ADDRESS,
    abi: RecordRegistryAbi,
    eventName: 'RecordAnchored',
    onLogs: onLog,
  });
}
