# SmartCareHub — Implementation Plan (Roadmap)

> **Patient-Centric Web3 Health Vault** · Strictly patient-owned · Privacy-preserving · Cryptographically verifiable
> Canonical living roadmap. Updates occur when task status, scope, dependencies, or acceptance criteria change.

---

## 1. Architectural Blueprint & Non-Negotiables

| Concern | Confirmed Architecture |
| :--- | :--- |
| **Framework** | Next.js 14+ (App Router), TypeScript (strict mode) |
| **Monorepo** | Turborepo (`apps/web`, `packages/contracts`, `packages/circuits`, `packages/crypto-core`) |
| **Styling** | Tailwind CSS v3 + Custom Design Tokens (Emerald, Teal, Cyan, Crimson, Amber) |
| **Web3** | Viem v2, Wagmi v2, RainbowKit v2 |
| **ZK Engine** | SnarkJS v0.7+, Circom v2.1+ (3 custom circuits: vaccination, vitals, age) |
| **Client Crypto** | Exclusively `window.crypto.subtle` and `@noble/ciphers` / `@noble/hashes` |
| **Zero-Node-Builtins** | `crypto`, `fs`, `buffer`, `path`, `stream` forbidden in `'use client'` files |
| **Off-Chain PHI** | AES-256-GCM client-encrypted blobs to IPFS (Helia / w3up); cleartext PHI NEVER leaves browser |
| **Smart Contracts** | Solidity ^0.8.24, Hardhat, OpenZeppelin v5, Sepolia testnet |
| **Dev Fallback** | IndexedDB mock store layer mirroring contract and IPFS data shapes |

---

## 2. Task Status Legend

- `[ ]` **Pending**: Not yet started
- `[~]` **In Progress**: Actively being implemented
- `[v]` **Implemented**: Code written, pending full test/workflow verification
- `[x]` **Verified Complete**: Implemented and verified via tests or actual workflows
- `[!]` **Blocked**: Blocked by external dependency or issue

---

## 3. Implementation Roadmap by Phase

### Phase 0 — Project Scaffolding & Design System

| ID | Task | Status | Target Files | Dependencies | Acceptance Criteria (DoD) |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **T0.1** | Bootstrap Turborepo Monorepo | `[x]` | `package.json`, `turbo.json`, `.gitignore`, `.env.example` | None | Root `npm install` clean; `turbo --version` runs (v2.11.10); `apps/`, `packages/` created |
| **T0.2** | Bootstrap Next.js App (`apps/web`) | `[x]` | `apps/web/package.json`, `next.config.mjs`, `tailwind.config.ts`, `src/app/globals.css`, `src/app/layout.tsx` | T0.1 | Next.js builds clean; Webpack fallback strips Node built-ins; SubtleCrypto confirmed ready; 0 console errors |
| **T0.3** | Bootstrap Hardhat Package (`packages/contracts`) | `[x]` | `packages/contracts/package.json`, `hardhat.config.ts` | T0.1 | `npx hardhat compile` succeeds (Solidity 0.8.24); OZ v5 installed; unit test passing |
| **T0.4** | Bootstrap Circuits Package (`packages/circuits`) | `[x]` | `packages/circuits/package.json`, directory structure | T0.1 | Circomlib configured; `snarkjs` v0.7.6 verified; cross-platform compilation script operational |

---

### Phase 1 — Smart Contract Suite (Solidity ^0.8.24, Hardhat, Sepolia)

| ID | Task | Status | Target Files | Dependencies | Acceptance Criteria (DoD) |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **T1.1** | `RecordRegistry.sol` (Feature 1) | `[x]` | `packages/contracts/contracts/RecordRegistry.sol`, tests | T0.3 | Register/update/revoke records; zero cleartext PHI; events emitted; 3/3 tests pass |
| **T1.2** | `DelegationManager.sol` (Feature 2) | `[x]` | `packages/contracts/contracts/DelegationManager.sol`, tests | T0.3 | Role-based delegation (`READ_ONLY`, `READ_WRITE`), expiry timestamp, revocation; 3/3 tests pass |
| **T1.3** | `AdherenceLogger.sol` (Feature 3) | `[x]` | `packages/contracts/contracts/AdherenceLogger.sol`, tests | T0.3 | EIP-712 dosage verification, daily compliance score calculation, anti-replay; 2/2 tests pass |
| **T1.4** | `HealthProver.sol` (Feature 4) | `[x]` | `packages/contracts/contracts/HealthProver.sol`, tests | T0.3 | Groth16 proof verification dispatch, nullifier/proofHash binding; 2/2 tests pass |
| **T1.5** | `CredentialLocker.sol` (Feature 5) | `[x]` | `packages/contracts/contracts/CredentialLocker.sol`, tests | T0.3 | ERC-721 soulbound credentials; dual-trigger break-glass (guardian + medic); audit trail; 3/3 tests pass |
| **T1.6** | Deployment Script & Sepolia Config | `[x]` | `packages/contracts/ignition/modules/SmartCareHub.ts`, `scripts/exportAbis.ts` | T1.1–T1.5 | Compiles without warnings; ignition module ready; ABIs exported to `apps/web/src/lib/abis/` |

---

### Phase 2 — Browser-Safe Cryptographic Core (`packages/crypto-core`)

| ID | Task | Status | Target Files | Dependencies | Acceptance Criteria (DoD) |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **T2.1** | Key Derivation (`keyDerivation.ts`) | `[x]` | `packages/crypto-core/src/keyDerivation.ts`, tests | T0.1 | EIP-191 signature + HKDF via `SubtleCrypto`; non-extractable; deterministic per wallet; tests pass |
| **T2.2** | Record Encryption (`recordEncryption.ts`) | `[x]` | `packages/crypto-core/src/recordEncryption.ts`, tests | T2.1 | AES-256-GCM browser encryption/decryption; auth tag validation; SHA-256 content hash; tests pass |
| **T2.3** | Delegation Key Re-Encryption (`delegationCrypto.ts`) | `[x]` | `packages/crypto-core/src/delegationCrypto.ts`, tests | T2.2 | ECDH P-256 + AES-KW key wrapping/unwrapping; Alice->Bob delegation; tests pass |
| **T2.4** | EIP-712 Dosage Signing (`adherenceSign.ts`) | `[x]` | `packages/crypto-core/src/adherenceSign.ts`, tests | T0.1 | Typed data struct (medicationId, scheduledAt, confirmedAt); 65-byte sig; tests pass |

---

### Phase 3 — Zero-Knowledge Proof Engine (`packages/circuits`)

| ID | Task | Status | Target Files | Dependencies | Acceptance Criteria (DoD) |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **T3.1** | Vaccination Range Circuit | `[x]` | `packages/circuits/circuits/vaccination_range.circom` | T0.4 | Proves vaccination within window without exposing vaccination date; bound to `record_hash`; unit test pass |
| **T3.2** | Vitals Range Circuit | `[x]` | `packages/circuits/circuits/vitals_range.circom` | T0.4 | Proves metric in `[min, max]` without disclosing numeric value; bound to `record_hash`; unit test pass |
| **T3.3** | Age Threshold Circuit | `[x]` | `packages/circuits/circuits/age_threshold.circom` | T0.4 | Proves age >= threshold without revealing exact DOB; bound to `record_hash`; unit test pass |
| **T3.4** | Trusted Setup & Key Generation | `[x]` | `packages/circuits/scripts/build_circuits.js`, `.zkey`, `.wasm`, Solidity verifiers | T3.1–T3.3 | Groth16 ceremony script; produces web artifacts in `apps/web/public/circuits/` & Solidity verifiers |
| **T3.5** | Browser ZK Proof Helper | `[x]` | `apps/web/src/lib/zkProofHelpers.ts` | T3.4 | In-browser snarkjs `groth16.fullProve` with progress callback; calldata generator for contracts |

---

### Phase 4 — Frontend Application (`apps/web`)

| ID | Task | Status | Target Files | Dependencies | Acceptance Criteria (DoD) |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **T4.1** | Web3 Provider & App Shell | `[x]` | `apps/web/src/providers/Web3Provider.tsx`, `AppNav.tsx`, `layout.tsx` | T0.2 | Wagmi v2 + RainbowKit v2 + QueryClient setup; Sepolia config; responsive navigation |
| **T4.2** | Shared Component Library | `[x]` | `apps/web/src/components/ui/*.tsx` | T0.2 | GlassmorphismCard, IntegrityChip, TxReceipt, ProofProgressRing, EmergencyBadge, WalletSignatureModal |
| **T4.3** | Landing Page (`/`) | `[x]` | `apps/web/src/app/page.tsx` | T4.1, T4.2 | Hero with Outfit font, interactive feature cards, architecture pipeline, responsive UI |
| **T4.4** | Medical Vault Dashboard (`/vault`) | `[x]` | `apps/web/src/app/vault/page.tsx` | T2.2, T4.2 | Client AES-256-GCM upload, encryption, inline decryption & IPFS CID display |
| **T4.5** | Family Health Circle (`/family`) | `[x]` | `apps/web/src/app/family/page.tsx` | T2.3, T4.2 | Grant delegation with role & expiry; ECDH key agreement; interactive QR code handshake |
| **T4.6** | Medicine Reminders (`/reminders`) | `[x]` | `apps/web/src/app/reminders/page.tsx` | T2.4, T4.2 | Regimen scheduler; log dose with EIP-712 signature; circular compliance score gauge |
| **T4.7** | ZK Health Prover (`/prove`) | `[x]` | `apps/web/src/app/prove/page.tsx` | T3.5, T4.2 | 3 claim tabs; browser SnarkJS Groth16 proof generation; on-chain verification format; QR sharing |
| **T4.8** | Credential Locker & Break-Glass (`/credentials`) | `[x]` | `apps/web/src/app/credentials/page.tsx` | T4.2 | Soulbound credentials grid; emergency triage payload form; crimson break-glass override flow |
| **T4.9** | Audit Trail (`/audit`) | `[x]` | `apps/web/src/app/audit/page.tsx` | T4.2 | Chronological immutable log of accesses, delegations, break-glass events with tx hashes & CSV export |
| **T4.10**| IndexedDB Mock Layer (Dev Fallback) | `[x]` | `apps/web/src/lib/mockStore.ts` | T0.2 | Full mock layer mirroring contract + IPFS state when `NEXT_PUBLIC_USE_MOCK_STORE=true` |

---

### Phase 5 — Integration, Testing & Quality Assurance

| ID | Task | Status | Target Files | Dependencies | Acceptance Criteria (DoD) |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **T5.1** | Wagmi Contract Hooks | `[x]` | `apps/web/src/hooks/contracts/*.ts` | T1.6, T4.1 | Custom typed Wagmi hooks connecting contracts to UI with mock store fallback |
| **T5.2** | End-to-End Browser Verification | `[x]` | Browser subagent validation | T4.3–T4.9 | Verified all 7 routes via browser subagent with zero console errors |
| **T5.3** | Contract Test Coverage | `[x]` | `packages/contracts/test/*.test.ts` | T1.1–T1.5 | 100% test passing rate on all 5 smart contracts (14/14 tests) |
| **T5.4** | Security & Bundle Audit | `[x]` | Client code & contract inspection | Phase 2, 4 | Verify zero Node built-in leaks in client bundle; zero cleartext PHI in network or storage |
| **T5.5** | Monorepo Production Build | `[x]` | `turbo.json`, Next.js build | All | `turbo run build` succeeds cleanly with exit code 0 across all workspaces |

---

## 4. Immediate Next Steps
1. All 35 tasks across Phase 0 through Phase 5 are 100% complete and verified.
2. For local demonstration: run `npm run start` in `apps/web` or `turbo run dev` from root.
3. For live testnet deployment: configure `SEPOLIA_RPC_URL` and `SEPOLIA_PRIVATE_KEY` in `.env` and execute `npx hardhat ignition deploy ignition/modules/SmartCareHub.ts --network sepolia` from `packages/contracts`.

