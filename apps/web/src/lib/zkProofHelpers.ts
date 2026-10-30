import * as snarkjs from 'snarkjs';

export type ClaimType = 'vaccination' | 'vitals' | 'age';

const WASM_PATHS: Record<ClaimType, string> = {
  vaccination: '/circuits/vaccination_range/vaccination_range.wasm',
  vitals:      '/circuits/vitals_range/vitals_range.wasm',
  age:         '/circuits/age_threshold/age_threshold.wasm',
};

const ZKEY_PATHS: Record<ClaimType, string> = {
  vaccination: '/circuits/vaccination_range/vaccination_range_final.zkey',
  vitals:      '/circuits/vitals_range/vitals_range_final.zkey',
  age:         '/circuits/age_threshold/age_threshold_final.zkey',
};

const VKEY_PATHS: Record<ClaimType, string> = {
  vaccination: '/circuits/vaccination_range/verification_key.json',
  vitals:      '/circuits/vitals_range/verification_key.json',
  age:         '/circuits/age_threshold/verification_key.json',
};

/**
 * Generate a Groth16 ZK proof entirely in the browser.
 * Private inputs (actual health values) never leave the client.
 */
export async function generateHealthProof(
  claimType: ClaimType,
  inputs: Record<string, number | string | bigint>,
  onProgress?: (pct: number) => void
): Promise<{ proof: any; publicSignals: string[] }> {
  onProgress?.(10);
  const result = await snarkjs.groth16.fullProve(
    inputs,
    WASM_PATHS[claimType],
    ZKEY_PATHS[claimType]
  );
  onProgress?.(90);
  return result;
}

/** Verify a Groth16 proof locally using the verification key JSON. */
export async function verifyProofLocally(
  claimType: ClaimType,
  proof: any,
  publicSignals: string[]
): Promise<boolean> {
  const res = await fetch(VKEY_PATHS[claimType]);
  const vkey = await res.json();
  return snarkjs.groth16.verify(vkey, publicSignals, proof);
}

/** Format proof as Solidity calldata for HealthProver.verifyHealthClaim() */
export async function formatProofForChain(proof: any, publicSignals: string[]) {
  const rawCalldata = await snarkjs.groth16.exportSolidityCallData(proof, publicSignals);
  const argv = JSON.parse(`[${rawCalldata}]`);
  return {
    pA: argv[0] as [string, string],
    pB: argv[1] as [[string, string], [string, string]],
    pC: argv[2] as [string, string],
    pubSignals: argv[3] as string[],
  };
}

export const formatProofForSolidity = formatProofForChain;

