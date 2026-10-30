# SmartCareHub — Developer Implementation Guide (`TASKS.md`)

> **Patient-Centric Web3 Health Vault** · Strictly patient-owned · Privacy-preserving · Cryptographically verifiable

---

## Legend & Conventions

| Symbol | Meaning |
|--------|---------|
| 🟢 | Verified / completed criterion |
| 🔵 | Cryptographic / ZK operation |
| 🔴 | Emergency / break-glass scope |
| 🟡 | Warning / security guardrail |
| `[T#.#]` | Task identifier (Phase.Step) |
| **DoD** | Definition of Done — how to verify the task is complete |

### Architectural Constraints (Non-Negotiable)

| Concern | Rule |
|---------|------|
| Framework | Next.js 14+ (App Router), TypeScript strict mode |
| Styling | Tailwind CSS v3 + custom design tokens |
| Web3 | Viem v2, Wagmi v2, RainbowKit v2 |
| ZK | SnarkJS v0.7+, Circom v2.1+ |
| Encryption | **ONLY** `window.crypto.subtle` or `@noble/ciphers` in Client Components |
| Forbidden | `crypto`, `fs`, `buffer`, `path` Node built-ins in any `'use client'` file |
| Off-chain storage | `@web3-storage/w3up-client` or `helia` (browser-native IPFS) |
| Smart Contracts | Solidity ^0.8.24, Hardhat, OpenZeppelin v5, Sepolia testnet |
| Dev Fallback | IndexedDB + localStorage mock layer (mirrors on-chain data shape) |

---

## Design System Reference

### Colour Palette

```css
/* globals.css — paste into apps/web/src/app/globals.css */
:root {
  /* Backgrounds */
  --bg-base:          #0A0F1E;   /* Primary dark background */
  --bg-surface:       #111827;   /* Card / panel surface */
  --bg-elevated:      #1F2937;   /* Elevated modal / popover */
  --bg-glass:         rgba(255, 255, 255, 0.04); /* Glassmorphism */

  /* Accents — Health & Verification */
  --accent-emerald:   #10B981;   /* Verified health states, confirmed records */
  --accent-emerald-dim: #064E3B; /* Subtle emerald fill */
  --accent-teal:      #0D9488;   /* Family circles, active delegation */
  --accent-teal-dim:  #134E4A;   /* Subtle teal fill */

  /* Accents — Cryptographic Operations */
  --accent-cyan:      #06B6D4;   /* ZK proof progress, crypto indicators */
  --accent-cyan-dim:  #083344;   /* Subtle cyan fill */
  --accent-indigo:    #6366F1;   /* Wallet / signature operations */

  /* Accents — Emergency */
  --emergency-crimson:     #DC2626; /* Break-glass triggers */
  --emergency-crimson-dim: #450A0A; /* Subtle crimson fill */
  --emergency-amber:       #F59E0B; /* Pending auth, warnings */
  --emergency-amber-dim:   #451A03; /* Subtle amber fill */

  /* Typography */
  --text-primary:   #F9FAFB;
  --text-secondary: #9CA3AF;
  --text-muted:     #4B5563;

  /* Borders */
  --border-default: rgba(255, 255, 255, 0.08);
  --border-active:  rgba(16, 185, 129, 0.4);
  --border-crypto:  rgba(6, 182, 212, 0.4);
  --border-emergency: rgba(220, 38, 38, 0.5);

  /* Typography Scale (fluid) */
  --font-display: 'Inter', 'Outfit', system-ui, sans-serif;
  --font-mono:    'JetBrains Mono', 'Fira Code', monospace;
}

/* Light mode overrides */
[data-theme="light"] {
  --bg-base:      #F8FAFC;
  --bg-surface:   #FFFFFF;
  --bg-elevated:  #F1F5F9;
  --text-primary: #0F172A;
  --text-secondary: #475569;
  --text-muted:   #94A3B8;
  --border-default: rgba(0, 0, 0, 0.08);
}
```

### Typography

```
Fonts (Google Fonts CDN):
  - Inter (weights: 300, 400, 500, 600, 700) — body + UI
  - Outfit (weights: 600, 700, 800) — display headings
  - JetBrains Mono (weights: 400, 500) — cryptographic hashes, tx receipts, CIDs
```

### Component Visual Semantics

| Component Role | Border Color | Background | Icon |
|----------------|-------------|------------|------|
| Verified Record | `--accent-emerald` | `--accent-emerald-dim` | ✓ Shield |
| Active Delegation | `--accent-teal` | `--accent-teal-dim` | 🔗 |
| ZK Proof Computing | `--accent-cyan` (animated) | `--accent-cyan-dim` | ⬡ |
| ZK Proof Verified | `--accent-emerald` | `--accent-emerald-dim` | ✓ ZK |
| Emergency Payload | `--emergency-crimson` | `--emergency-crimson-dim` | ⚡ |
| Warning / Pending | `--emergency-amber` | `--emergency-amber-dim` | ⚠ |
| Wallet Signature | `--accent-indigo` | `rgba(99,102,241,0.1)` | 🔏 |

---

## Phase 0 — Project Scaffolding & Design System

> **Goal:** Bootstrap a Turborepo monorepo containing three workspaces: `apps/web` (Next.js), `packages/contracts` (Hardhat), and `packages/circuits` (Circom + SnarkJS). Establish the design system, typography, and global Tailwind config.

---

### [T0.1] — Bootstrap Turborepo Monorepo

**Files to create:**
```
SMARTCAREHUB/
├── package.json
├── turbo.json
├── .gitignore
└── .env.example
```

**Steps:**

1. Open a terminal in `SMARTCAREHUB/`.

2. Initialise the root package:
```bash
npm init -y
npm install turbo --save-dev
```

3. Create `turbo.json`:
```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDotEnv": [".env.local"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "artifacts/**", "cache/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "lint": {}
  }
}
```

4. Update root `package.json`:
```json
{
  "name": "smartcarehub",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev":   "turbo run dev",
    "build": "turbo run build",
    "test":  "turbo run test",
    "lint":  "turbo run lint"
  },
  "devDependencies": {
    "turbo": "latest"
  }
}
```

5. Create `.gitignore`:
```
node_modules/
.next/
dist/
artifacts/
cache/
.env.local
*.ptau
*.zkey
*.r1cs
*.wtns
build/
```

6. Create `.env.example`:
```env
# Wallet Connect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Sepolia RPC (Alchemy or Infura)
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
SEPOLIA_PRIVATE_KEY=0xYOUR_DEPLOYER_PRIVATE_KEY

# Web3.Storage
NEXT_PUBLIC_W3UP_KEY=your_w3up_key_here

# Contract Addresses (populated after Phase 1 deployment)
NEXT_PUBLIC_RECORD_REGISTRY_ADDRESS=
NEXT_PUBLIC_DELEGATION_MANAGER_ADDRESS=
NEXT_PUBLIC_ADHERENCE_LOGGER_ADDRESS=
NEXT_PUBLIC_HEALTH_PROVER_ADDRESS=
NEXT_PUBLIC_CREDENTIAL_LOCKER_ADDRESS=

# Dev mode flag
NEXT_PUBLIC_USE_MOCK_STORE=false
```

**DoD:**
- 🟢 `npm install` completes from the root without errors
- 🟢 `turbo --version` outputs a version number
- 🟢 `apps/`, `packages/` directories exist

---

### [T0.2] — Bootstrap Next.js App (`apps/web`)

**Files created by this task:**
```
apps/web/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   └── page.tsx
│   ├── components/
│   ├── lib/
│   └── hooks/
├── public/
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

**Steps:**

1. From the monorepo root:
```bash
cd apps
npx -y create-next-app@latest web --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-git
cd web
```

2. Install Web3 + utility dependencies:
```bash
npm install wagmi viem @rainbow-me/rainbowkit @tanstack/react-query
npm install @noble/ciphers @noble/hashes
npm install framer-motion lucide-react clsx tailwind-merge
npm install idb
npm install snarkjs
npm install qrcode.react
```

3. Install dev dependencies:
```bash
npm install -D @types/node autoprefixer
```

4. Replace `apps/web/next.config.mjs`:
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Prevent Node.js built-ins leaking into client bundles
      config.resolve.fallback = {
        fs: false,
        path: false,
        crypto: false,
        buffer: false,
        stream: false,
        os: false,
      };
    }
    // Allow WASM for SnarkJS circuits
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    return config;
  },
};

export default nextConfig;
```

5. Replace `apps/web/tailwind.config.ts`:
```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        emerald:  { DEFAULT: '#10B981', dim: '#064E3B' },
        teal:     { DEFAULT: '#0D9488', dim: '#134E4A' },
        cyan:     { DEFAULT: '#06B6D4', dim: '#083344' },
        indigo:   { DEFAULT: '#6366F1' },
        crimson:  { DEFAULT: '#DC2626', dim: '#450A0A' },
        amber:    { DEFAULT: '#F59E0B', dim: '#451A03' },
        surface:  { base: '#0A0F1E', card: '#111827', elevated: '#1F2937' },
      },
      fontFamily: {
        display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial':    'radial-gradient(var(--tw-gradient-stops))',
        'gradient-mesh':      'linear-gradient(135deg, #0A0F1E 0%, #0D1B2A 50%, #0A0F1E 100%)',
        'gradient-emerald':   'linear-gradient(135deg, #064E3B, #10B981)',
        'gradient-cyan':      'linear-gradient(135deg, #083344, #06B6D4)',
        'gradient-emergency': 'linear-gradient(135deg, #450A0A, #DC2626)',
      },
      animation: {
        'pulse-slow':    'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow':     'spin 3s linear infinite',
        'glow-emerald':  'glowEmerald 2s ease-in-out infinite alternate',
        'glow-crimson':  'glowCrimson 1.5s ease-in-out infinite alternate',
        'slide-up':      'slideUp 0.4s ease-out',
        'fade-in':       'fadeIn 0.3s ease-out',
      },
      keyframes: {
        glowEmerald: {
          from: { boxShadow: '0 0 8px rgba(16,185,129,0.3)' },
          to:   { boxShadow: '0 0 24px rgba(16,185,129,0.7)' },
        },
        glowCrimson: {
          from: { boxShadow: '0 0 8px rgba(220,38,38,0.4)' },
          to:   { boxShadow: '0 0 28px rgba(220,38,38,0.8)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
      },
      backdropBlur: { xs: '2px' },
      borderRadius: { xl2: '1.25rem', xl3: '1.5rem' },
    },
  },
  plugins: [],
};

export default config;
```

6. Replace `apps/web/src/app/globals.css` with the full colour palette + Tailwind directives (see Design System Reference above).

7. Replace `apps/web/src/app/layout.tsx`:
```tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SmartCareHub — Patient-Centric Web3 Health Vault',
  description:
    'Own your medical data. Encrypt it. Prove it. No third-party custodians.',
  keywords: ['health', 'blockchain', 'zero-knowledge', 'HIPAA', 'Web3'],
  openGraph: {
    title: 'SmartCareHub',
    description: 'Self-sovereign encrypted medical records on the decentralised web.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

**DoD:**
- 🟢 `npm run dev` starts Next.js on `http://localhost:3000` without errors
- 🟢 Browser console shows no "Module not found: crypto" or polyfill errors
- 🟢 `window.crypto.subtle` is accessible in the DevTools console
- 🟢 Tailwind classes like `bg-surface-base`, `text-emerald` resolve correctly
- 🟢 Inter and JetBrains Mono fonts are loaded (check Network tab)

---

### [T0.3] — Bootstrap Hardhat Contracts Package (`packages/contracts`)

**Steps:**

1. From monorepo root:
```bash
mkdir packages\contracts && cd packages\contracts
npm init -y
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox @nomicfoundation/hardhat-verify
npm install @openzeppelin/contracts
npx hardhat init   # choose "Create a TypeScript project"
```

2. Create `packages/contracts/hardhat.config.ts`:
```ts
import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import '@nomicfoundation/hardhat-verify';
import * as dotenv from 'dotenv';
dotenv.config({ path: '../../.env.local' });

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.24',
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    sepolia: {
      url:      process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || '',
      accounts: process.env.SEPOLIA_PRIVATE_KEY ? [process.env.SEPOLIA_PRIVATE_KEY] : [],
      chainId:  11155111,
    },
    localhost: {
      url: 'http://127.0.0.1:8545',
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || '',
  },
};

export default config;
```

**DoD:**
- 🟢 `npx hardhat compile` succeeds
- 🟢 `npx hardhat test` passes the default test

---

### [T0.4] — Bootstrap Circuits Package (`packages/circuits`)

**Steps:**

1. Install toolchain:
```bash
# Install circom (download binary from https://github.com/ItchySats/circom/releases for Windows)
# Or use the JS port:
npm install -g circom
npm install -g snarkjs
```

2. Create `packages/circuits/` structure:
```
packages/circuits/
├── circuits/
│   ├── vaccination_range.circom
│   ├── vitals_range.circom
│   └── age_threshold.circom
├── build/
├── test/
│   └── runProof.js
└── package.json
```

3. Create `packages/circuits/package.json`:
```json
{
  "name": "@smartcarehub/circuits",
  "version": "0.1.0",
  "scripts": {
    "compile": "bash scripts/compile_all.sh",
    "test":    "node test/runProof.js"
  }
}
```

**DoD:**
- 🟢 `circom --version` outputs `2.x.x`
- 🟢 `snarkjs --version` outputs a version string

---

## Phase 1 — Smart Contract Suite

> **Goal:** Write, test, and deploy five Solidity contracts to Sepolia. Each contract encodes one feature. Zero PHI is stored on-chain — only hashes, CIDs, and access metadata.

> 🟡 **Security Rule:** Never store plaintext medical data in any event, mapping, or storage variable.

---

### [T1.1] — `RecordRegistry.sol` (Feature 1)

**File:** `packages/contracts/contracts/RecordRegistry.sol`

**Purpose:** Anchors content hashes and encrypted IPFS CIDs on-chain. Proves tamper-free existence at a given block height.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title RecordRegistry
/// @notice Anchors encrypted medical record commitments on-chain.
///         No PHI is stored. Only: contentHash, encryptedCID, timestamp.
contract RecordRegistry is ReentrancyGuard {

    struct RecordEntry {
        bytes32 contentHash;    // keccak256 of the encrypted file bytes
        string  encryptedCID;   // IPFS CID of the AES-256-GCM encrypted blob
        uint256 timestamp;
        bool    revoked;
    }

    mapping(address => RecordEntry[]) private _records;

    event RecordAnchored(
        address indexed owner,
        bytes32 indexed contentHash,
        string  encryptedCID,
        uint256 timestamp
    );
    event RecordRevoked(address indexed owner, uint256 indexed recordIndex);

    /// @notice Anchor a new encrypted medical record commitment
    function anchorRecord(bytes32 contentHash, string calldata encryptedCID)
        external nonReentrant
    {
        require(contentHash != bytes32(0), "RecordRegistry: empty hash");
        require(bytes(encryptedCID).length > 0, "RecordRegistry: empty CID");

        _records[msg.sender].push(RecordEntry({
            contentHash:  contentHash,
            encryptedCID: encryptedCID,
            timestamp:    block.timestamp,
            revoked:      false
        }));

        emit RecordAnchored(msg.sender, contentHash, encryptedCID, block.timestamp);
    }

    /// @notice Soft-delete a record entry
    function revokeRecord(uint256 index) external {
        require(index < _records[msg.sender].length, "RecordRegistry: out of bounds");
        _records[msg.sender][index].revoked = true;
        emit RecordRevoked(msg.sender, index);
    }

    /// @notice Get all record entries for the caller
    function getMyRecords() external view returns (RecordEntry[] memory) {
        return _records[msg.sender];
    }

    /// @notice Verify integrity — returns true if hash matches and not revoked
    function verifyRecord(address owner, uint256 index, bytes32 claimedHash)
        external view returns (bool)
    {
        RecordEntry storage entry = _records[owner][index];
        return (!entry.revoked && entry.contentHash == claimedHash);
    }
}
```

**DoD:**
- 🟢 `npx hardhat test --grep "RecordRegistry"` — all tests pass
- 🟢 `verifyRecord` returns `false` after `revokeRecord` is called
- 🟡 No `string` field longer than a CID (≤ 64 chars) stored in cleartext

---

### [T1.2] — `DelegationManager.sol` (Feature 2)

**File:** `packages/contracts/contracts/DelegationManager.sol`

**Purpose:** Time-bound, role-scoped delegation. Roles: `READ_ONLY = 1`, `READ_WRITE = 2`.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title DelegationManager
/// @notice Manages granular, time-bound, revocable delegation of record access.
contract DelegationManager {

    uint8 public constant ROLE_READ_ONLY  = 1;
    uint8 public constant ROLE_READ_WRITE = 2;

    struct Delegation {
        address delegate;
        uint8   role;
        uint256 expiresAt;    // Unix timestamp; 0 = never
        bool    revoked;
        bytes   encryptedKey; // Patient's AES key re-encrypted for the delegate (ECDH)
    }

    mapping(address => Delegation[]) private _delegations;

    event DelegationGranted(
        address indexed grantor,
        address indexed delegate,
        uint8   role,
        uint256 expiresAt
    );
    event DelegationRevoked(address indexed grantor, uint256 indexed delegationIndex);

    /// @notice Grant time-bound access with a re-encrypted key bundle
    function grantDelegation(
        address delegate,
        uint8   role,
        uint256 expiresAt,
        bytes calldata encryptedKey
    ) external {
        require(delegate != address(0) && delegate != msg.sender, "DelegationManager: invalid delegate");
        require(role == ROLE_READ_ONLY || role == ROLE_READ_WRITE, "DelegationManager: invalid role");
        require(expiresAt == 0 || expiresAt > block.timestamp, "DelegationManager: expiry in past");

        _delegations[msg.sender].push(Delegation({
            delegate:     delegate,
            role:         role,
            expiresAt:    expiresAt,
            revoked:      false,
            encryptedKey: encryptedKey
        }));

        emit DelegationGranted(msg.sender, delegate, role, expiresAt);
    }

    /// @notice Immediately revoke a delegation — no intermediary required
    function revokeDelegation(uint256 index) external {
        require(index < _delegations[msg.sender].length, "DelegationManager: out of bounds");
        _delegations[msg.sender][index].revoked = true;
        emit DelegationRevoked(msg.sender, index);
    }

    /// @notice Check if a delegate currently holds valid access
    function hasValidAccess(address grantor, address delegate)
        external view returns (bool valid, uint8 role)
    {
        Delegation[] storage dels = _delegations[grantor];
        for (uint256 i = 0; i < dels.length; i++) {
            Delegation storage d = dels[i];
            if (
                d.delegate == delegate &&
                !d.revoked &&
                (d.expiresAt == 0 || d.expiresAt > block.timestamp)
            ) {
                return (true, d.role);
            }
        }
        return (false, 0);
    }

    /// @notice Return all delegations granted by the caller (for permission matrix UI)
    function getGrantedDelegations() external view returns (Delegation[] memory) {
        return _delegations[msg.sender];
    }
}
```

**DoD:**
- 🟢 `npx hardhat test --grep "DelegationManager"` — all tests pass
- 🟢 A revoked delegation returns `(false, 0)` from `hasValidAccess` immediately
- 🟢 An expired delegation also returns `(false, 0)`

---

### [T1.3] — `AdherenceLogger.sol` (Feature 3)

**File:** `packages/contracts/contracts/AdherenceLogger.sol`

**Purpose:** Stores EIP-712 signed dosage confirmations. Signature proves the patient (not a bot) confirmed the dose. On-chain timestamp makes the log tamper-proof.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/// @title AdherenceLogger
/// @notice Stores EIP-712 signed dosage events as an immutable adherence trail.
contract AdherenceLogger is EIP712 {
    using ECDSA for bytes32;

    bytes32 private constant DOSAGE_TYPEHASH = keccak256(
        "DosageEvent(string medicationId,uint256 scheduledAt,uint256 confirmedAt)"
    );

    struct DosageEvent {
        string   medicationId;  // Opaque ID (keccak256 of name — no PHI cleartext)
        uint256  scheduledAt;
        uint256  confirmedAt;
        bytes32  eventHash;
    }

    mapping(address => DosageEvent[]) private _log;

    event DosageConfirmed(
        address indexed patient,
        bytes32 indexed eventHash,
        uint256 scheduledAt,
        uint256 confirmedAt
    );

    constructor() EIP712("SmartCareHub.AdherenceLogger", "1") {}

    /// @notice Submit a patient-signed dosage confirmation
    function logDosage(
        string calldata medicationId,
        uint256 scheduledAt,
        uint256 confirmedAt,
        bytes calldata signature
    ) external {
        require(confirmedAt <= block.timestamp + 60, "AdherenceLogger: future timestamp");

        bytes32 structHash = keccak256(abi.encode(
            DOSAGE_TYPEHASH,
            keccak256(bytes(medicationId)),
            scheduledAt,
            confirmedAt
        ));
        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = digest.recover(signature);
        require(signer == msg.sender, "AdherenceLogger: invalid signature");

        bytes32 eventHash = keccak256(abi.encode(medicationId, scheduledAt, confirmedAt));
        _log[msg.sender].push(DosageEvent(medicationId, scheduledAt, confirmedAt, eventHash));

        emit DosageConfirmed(msg.sender, eventHash, scheduledAt, confirmedAt);
    }

    function getMyLog() external view returns (DosageEvent[] memory) {
        return _log[msg.sender];
    }

    function computeComplianceScore(address patient, uint256 from, uint256 to)
        external view returns (uint256 confirmed, uint256 inWindow)
    {
        DosageEvent[] storage log = _log[patient];
        for (uint256 i = 0; i < log.length; i++) {
            if (log[i].scheduledAt >= from && log[i].scheduledAt <= to) {
                inWindow++;
                if (log[i].confirmedAt > 0) confirmed++;
            }
        }
    }
}
```

**DoD:**
- 🟢 `npx hardhat test --grep "AdherenceLogger"` — all tests pass
- 🟢 A tampered signature causes an `invalid signature` revert
- 🟢 `computeComplianceScore` returns correct counts over a test window

---

### [T1.4] — `HealthProver.sol` (Feature 4)

**File:** `packages/contracts/contracts/HealthProver.sol`

**Purpose:** Routes ZK proof verification to the appropriate Groth16 verifier contract. Verifier contracts are generated by SnarkJS in Phase 3.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IGroth16Verifier {
    function verifyProof(
        uint[2]    calldata _pA,
        uint[2][2] calldata _pB,
        uint[2]    calldata _pC,
        uint[]     calldata _pubSignals
    ) external view returns (bool);
}

contract HealthProver {
    enum ClaimType { VACCINATION, VITALS_RANGE, AGE_THRESHOLD }

    mapping(ClaimType => address) public verifiers;
    address public owner;

    event ProofVerified(
        address indexed prover,
        ClaimType       claimType,
        bytes32 indexed proofHash,
        uint256         timestamp
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "HealthProver: not owner");
        _;
    }

    constructor() { owner = msg.sender; }

    function setVerifier(ClaimType claimType, address verifier) external onlyOwner {
        verifiers[claimType] = verifier;
    }

    function verifyHealthClaim(
        ClaimType      claimType,
        uint[2]    calldata pA,
        uint[2][2] calldata pB,
        uint[2]    calldata pC,
        uint[]     calldata pubSignals
    ) external returns (bool) {
        address verifier = verifiers[claimType];
        require(verifier != address(0), "HealthProver: verifier not registered");

        bool valid = IGroth16Verifier(verifier).verifyProof(pA, pB, pC, pubSignals);

        if (valid) {
            bytes32 proofHash = keccak256(abi.encode(pA, pB, pC, pubSignals));
            emit ProofVerified(msg.sender, claimType, proofHash, block.timestamp);
        }

        return valid;
    }
}
```

**DoD:**
- 🟢 Contract compiles without errors
- 🔵 After Phase 3, `setVerifier` registers the generated verifier contracts
- 🔵 A valid proof returns `true` and emits `ProofVerified`

---

### [T1.5] — `CredentialLocker.sol` (Feature 5)

**File:** `packages/contracts/contracts/CredentialLocker.sol`

**Purpose:** Soulbound NFTs + emergency break-glass with dual-trigger + permanent audit trail.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title CredentialLocker
/// @notice Soulbound medical credentials + emergency triage access with full audit trail.
contract CredentialLocker is ERC721, Ownable {

    struct Credential {
        string  credentialType;
        address issuer;
        uint256 issuedAt;
        uint256 expiresAt;
        bytes32 dataHash;
        bool    revoked;
    }

    struct TriagePayload {
        string    encryptedCID;
        address[] guardians;
        bool      active;
    }

    struct BreakGlassEvent {
        address accessedBy;
        uint256 timestamp;
        string  reason;   // "GUARDIAN_SIGNED" | "MEDIC_CREDENTIAL"
    }

    uint256 private _tokenIds;
    mapping(uint256 => Credential)        private _credentials;
    mapping(address => TriagePayload)     private _triagePayloads;
    mapping(address => BreakGlassEvent[]) private _auditLog;
    mapping(address => bool)              public verifiedMedics;

    event CredentialIssued(uint256 indexed tokenId, address indexed holder, string credentialType);
    event CredentialRevoked(uint256 indexed tokenId);
    event BreakGlassAccessed(address indexed patient, address indexed accessor, string reason, uint256 timestamp);
    event TriagePayloadSet(address indexed patient);

    constructor() ERC721("SmartCareHub Credential", "SCHC") Ownable(msg.sender) {}

    // ─── Soulbound: block all transfers ──────────────────────────────────────
    function _update(address to, uint256 tokenId, address auth)
        internal override returns (address)
    {
        address from = _ownerOf(tokenId);
        require(from == address(0), "CredentialLocker: soulbound — transfers disabled");
        return super._update(to, tokenId, auth);
    }

    // ─── Credential Issuance ─────────────────────────────────────────────────
    function issueCredential(
        address holder,
        string calldata credentialType,
        uint256 expiresAt,
        bytes32 dataHash
    ) external returns (uint256) {
        _tokenIds++;
        uint256 tokenId = _tokenIds;
        _safeMint(holder, tokenId);
        _credentials[tokenId] = Credential(credentialType, msg.sender, block.timestamp, expiresAt, dataHash, false);
        emit CredentialIssued(tokenId, holder, credentialType);
        return tokenId;
    }

    function revokeCredential(uint256 tokenId) external {
        require(_credentials[tokenId].issuer == msg.sender, "CredentialLocker: not issuer");
        _credentials[tokenId].revoked = true;
        emit CredentialRevoked(tokenId);
    }

    function getCredential(uint256 tokenId) external view returns (Credential memory) {
        return _credentials[tokenId];
    }

    // ─── Triage Payload ──────────────────────────────────────────────────────
    function setTriagePayload(string calldata encryptedCID, address[] calldata guardians) external {
        _triagePayloads[msg.sender] = TriagePayload(encryptedCID, guardians, true);
        emit TriagePayloadSet(msg.sender);
    }

    // ─── Break-Glass — Trigger 1: Guardian ───────────────────────────────────
    function breakGlassAsGuardian(address patient) external returns (string memory) {
        TriagePayload storage payload = _triagePayloads[patient];
        require(payload.active, "CredentialLocker: no triage payload");
        require(_isGuardian(patient, msg.sender), "CredentialLocker: not a guardian");
        _recordAudit(patient, msg.sender, "GUARDIAN_SIGNED");
        return payload.encryptedCID;
    }

    // ─── Break-Glass — Trigger 2: Verified Medic ─────────────────────────────
    function breakGlassAsMedic(address patient, uint256 medicCredentialTokenId)
        external returns (string memory)
    {
        TriagePayload storage payload = _triagePayloads[patient];
        require(payload.active, "CredentialLocker: no triage payload");
        require(ownerOf(medicCredentialTokenId) == msg.sender, "CredentialLocker: not credential holder");
        Credential storage cred = _credentials[medicCredentialTokenId];
        require(!cred.revoked, "CredentialLocker: credential revoked");
        require(cred.expiresAt == 0 || cred.expiresAt > block.timestamp, "CredentialLocker: credential expired");
        require(verifiedMedics[msg.sender], "CredentialLocker: not a verified medic");
        _recordAudit(patient, msg.sender, "MEDIC_CREDENTIAL");
        return payload.encryptedCID;
    }

    // ─── Audit ───────────────────────────────────────────────────────────────
    function getAuditLog(address patient) external view returns (BreakGlassEvent[] memory) {
        return _auditLog[patient];
    }

    // ─── Internal ────────────────────────────────────────────────────────────
    function _isGuardian(address patient, address candidate) internal view returns (bool) {
        address[] storage gs = _triagePayloads[patient].guardians;
        for (uint256 i = 0; i < gs.length; i++) {
            if (gs[i] == candidate) return true;
        }
        return false;
    }

    function _recordAudit(address patient, address accessor, string memory reason) internal {
        _auditLog[patient].push(BreakGlassEvent(accessor, block.timestamp, reason));
        emit BreakGlassAccessed(patient, accessor, reason, block.timestamp);
    }

    function registerMedic(address medic, bool status) external onlyOwner {
        verifiedMedics[medic] = status;
    }
}
```

**DoD:**
- 🔴 `safeTransferFrom` reverts with "soulbound" error
- 🔴 Non-guardian calling `breakGlassAsGuardian` reverts
- 🟢 `BreakGlassAccessed` event emitted with accessor address + timestamp
- 🟢 `getAuditLog` returns the correct history

---

### [T1.6] — Deployment Script & Sepolia Deploy

**File:** `packages/contracts/ignition/modules/SmartCareHub.ts`

```ts
import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

export default buildModule('SmartCareHub', (m) => {
  const recordRegistry      = m.contract('RecordRegistry');
  const delegationManager   = m.contract('DelegationManager');
  const adherenceLogger     = m.contract('AdherenceLogger');
  const healthProver        = m.contract('HealthProver');
  const credentialLocker    = m.contract('CredentialLocker');

  return { recordRegistry, delegationManager, adherenceLogger, healthProver, credentialLocker };
});
```

**Deploy:**
```bash
cd packages/contracts
npx hardhat ignition deploy ignition/modules/SmartCareHub.ts --network sepolia
```

**Verify on Etherscan:**
```bash
npx hardhat verify --network sepolia <ADDRESS>
```
Repeat for each of the five contracts.

**Post-deploy:** Copy all five contract addresses into `.env.local`.

**DoD:**
- 🟢 All five contracts on Sepolia Etherscan with verified source code
- 🟢 Contract addresses populated in `.env.local`
- 🟢 `npx hardhat test` passes 100% of written tests

---

## Phase 2 — Cryptographic Core

> **Goal:** Build browser-safe crypto utilities in `packages/crypto-core/src/`. Zero Node.js built-ins in any file.

> 🟡 **Every function must open with:**
> ```ts
> if (typeof window === 'undefined' || !window.crypto?.subtle) {
>   throw new Error('CryptoCore: requires browser SubtleCrypto');
> }
> ```

---

### [T2.1] — Key Derivation (`keyDerivation.ts`)

**File:** `packages/crypto-core/src/keyDerivation.ts`

**Concept:** Patient signs a deterministic message. The 65-byte ECDSA signature is fed into HKDF to produce a stable AES-256-GCM key. The key never leaves the browser.

```ts
/**
 * Derives a stable AES-256-GCM CryptoKey from a wallet signature using HKDF.
 * The derived key is the patient's master encryption key (non-extractable).
 */
export async function deriveKeyFromSignature(
  signature: Uint8Array,
  salt: string = 'SmartCareHub.v1'
): Promise<CryptoKey> {
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw', signature, 'HKDF', false, ['deriveKey']
  );
  return window.crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new TextEncoder().encode(salt),
      info: new TextEncoder().encode('SmartCareHub.PatientEncryptionKey'),
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,           // non-extractable
    ['encrypt', 'decrypt']
  );
}

/** Returns the deterministic message the wallet must sign to derive the key. */
export function getKeyDerivationMessage(): string {
  return [
    'SmartCareHub — Encryption Key Derivation',
    '',
    'Signing this message authorises derivation of your personal encryption key.',
    'This key never leaves your browser.',
    '',
    'Nonce: SMARTCAREHUB_KDF_V1_STATIC',
  ].join('\n');
}
```

**DoD:**
- 🔵 `key.extractable === false` (confirmed in DevTools)
- 🟢 Same signature always produces a key that decrypts what it encrypted
- 🟢 Different signatures produce different keys (verified by attempting cross-decrypt — must fail)

---

### [T2.2] — Record Encryption (`recordEncryption.ts`)

**File:** `packages/crypto-core/src/recordEncryption.ts`

```ts
/**
 * Encrypts arbitrary bytes using AES-256-GCM.
 * Output format: [12-byte IV | ciphertext + 16-byte auth tag]
 */
export async function encryptRecord(plaintext: Uint8Array, key: CryptoKey): Promise<Uint8Array> {
  const iv         = window.crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);
  const result     = new Uint8Array(12 + ciphertext.byteLength);
  result.set(iv, 0);
  result.set(new Uint8Array(ciphertext), 12);
  return result;
}

/**
 * Decrypts AES-256-GCM encrypted bytes.
 * Expects the [IV | ciphertext] format from encryptRecord.
 */
export async function decryptRecord(encrypted: Uint8Array, key: CryptoKey): Promise<Uint8Array> {
  const iv         = encrypted.slice(0, 12);
  const ciphertext = encrypted.slice(12);
  const plaintext  = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return new Uint8Array(plaintext);
}

/** SHA-256 of encrypted bytes — used as the on-chain content hash commitment. */
export async function computeContentHash(encrypted: Uint8Array): Promise<Uint8Array> {
  return new Uint8Array(await window.crypto.subtle.digest('SHA-256', encrypted));
}
```

**DoD:**
- 🟢 Encrypt a string → decrypt → result matches original
- 🟢 Modifying one byte of ciphertext causes decryption to throw (GCM auth tag failure)
- 🔵 Output is raw binary — no base64 encoding at this layer

---

### [T2.3] — Delegation Key Re-Encryption (`delegationCrypto.ts`)

**File:** `packages/crypto-core/src/delegationCrypto.ts`

**Concept:** Alice wraps her AES key using Bob's ECDH public key (ephemeral ECDH key exchange + AES-KW). Only Bob's private key can unwrap it. The wrapped key is stored as `encryptedKey` in `DelegationManager.sol`.

```ts
/**
 * Re-encrypts the patient's AES master key for a delegate using ECDH + AES-KW.
 * Output is stored on-chain in DelegationManager.grantDelegation().
 *
 * @param masterKeyBytes     Raw bytes of the patient's AES-256 key (temporary export)
 * @param delegatePubKeyJwk  Delegate's ECDH public key in JWK format
 * @returns                  Packed bytes: [4B ephemeralPubLen | ephemeralPubJwk | wrappedKey]
 */
export async function encryptKeyForDelegate(
  masterKeyBytes: Uint8Array,
  delegatePubKeyJwk: JsonWebKey
): Promise<Uint8Array> {
  const delegatePubKey = await window.crypto.subtle.importKey(
    'jwk', delegatePubKeyJwk, { name: 'ECDH', namedCurve: 'P-256' }, false, []
  );
  const ephemeral = await window.crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveKey']
  );
  const wrappingKey = await window.crypto.subtle.deriveKey(
    { name: 'ECDH', public: delegatePubKey },
    ephemeral.privateKey,
    { name: 'AES-KW', length: 256 }, false, ['wrapKey']
  );
  const masterKey = await window.crypto.subtle.importKey(
    'raw', masterKeyBytes, { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']
  );
  const wrappedKey       = await window.crypto.subtle.wrapKey('raw', masterKey, wrappingKey, 'AES-KW');
  const ephemeralPubJwk  = await window.crypto.subtle.exportKey('jwk', ephemeral.publicKey);
  const ephemeralPubBytes = new TextEncoder().encode(JSON.stringify(ephemeralPubJwk));

  const view = new DataView(new ArrayBuffer(4));
  view.setUint32(0, ephemeralPubBytes.length, false);
  const packed = new Uint8Array(4 + ephemeralPubBytes.length + wrappedKey.byteLength);
  packed.set(new Uint8Array(view.buffer), 0);
  packed.set(ephemeralPubBytes, 4);
  packed.set(new Uint8Array(wrappedKey), 4 + ephemeralPubBytes.length);
  return packed;
}

/**
 * Unwraps a delegated key using the delegate's ECDH private key.
 */
export async function decryptDelegatedKey(
  packed: Uint8Array,
  delegatePrivKey: CryptoKey
): Promise<CryptoKey> {
  const view = new DataView(packed.buffer, packed.byteOffset);
  const ephemeralPubLen   = view.getUint32(0, false);
  const ephemeralPubJwk   = JSON.parse(new TextDecoder().decode(packed.slice(4, 4 + ephemeralPubLen))) as JsonWebKey;
  const wrappedKeyBytes   = packed.slice(4 + ephemeralPubLen);
  const ephemeralPub      = await window.crypto.subtle.importKey(
    'jwk', ephemeralPubJwk, { name: 'ECDH', namedCurve: 'P-256' }, false, []
  );
  const unwrappingKey = await window.crypto.subtle.deriveKey(
    { name: 'ECDH', public: ephemeralPub },
    delegatePrivKey,
    { name: 'AES-KW', length: 256 }, false, ['unwrapKey']
  );
  return window.crypto.subtle.unwrapKey(
    'raw', wrappedKeyBytes, unwrappingKey, 'AES-KW',
    { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
  );
}
```

**DoD:**
- 🔵 Alice encrypts her key for Bob → Bob unwraps → Bob decrypts Alice's records successfully
- 🟢 Using a different private key during unwrap throws a `DOMException`

---

### [T2.4] — EIP-712 Dosage Signing (`adherenceSign.ts`)

**File:** `packages/crypto-core/src/adherenceSign.ts`

```ts
import type { WalletClient } from 'viem';

export interface DosagePayload {
  medicationId: string;
  scheduledAt:  bigint;
  confirmedAt:  bigint;
}

const TYPES = {
  DosageEvent: [
    { name: 'medicationId', type: 'string'  },
    { name: 'scheduledAt',  type: 'uint256' },
    { name: 'confirmedAt',  type: 'uint256' },
  ],
} as const;

/** Produces an EIP-712 signature for a dosage confirmation. */
export async function signDosageEvent(
  walletClient: WalletClient,
  contractAddress: `0x${string}`,
  payload: DosagePayload
): Promise<`0x${string}`> {
  return walletClient.signTypedData({
    account:     walletClient.account!,
    domain:      { name: 'SmartCareHub.AdherenceLogger', version: '1', chainId: 11155111, verifyingContract: contractAddress },
    types:       TYPES,
    primaryType: 'DosageEvent',
    message:     payload,
  });
}
```

**DoD:**
- 🟢 MetaMask displays the structured EIP-712 data modal (not raw hex)
- 🔵 Recovered signer in `AdherenceLogger.logDosage` matches `msg.sender`
- 🟢 Signature is exactly 65 bytes (r + s + v)

---

## Phase 3 — ZK Proof Engine

> **Goal:** Author three Circom circuits, compile them, run the trusted setup, generate Solidity verifiers, and wire them into a browser SnarkJS flow.

> 🔵 **ZK Architecture:** Groth16. Public inputs = disclosed claim parameters. Private inputs = raw health values (stay on the client, never transmitted).

---

### [T3.1] — Vaccination Range Circuit

**File:** `packages/circuits/circuits/vaccination_range.circom`

**Claim:** "My vaccination date falls within the past N days."

```circom
pragma circom 2.1.6;

include "node_modules/circomlib/circuits/comparators.circom";
include "node_modules/circomlib/circuits/poseidon.circom";

/*
 * Public inputs:  today_timestamp (days), window_days
 * Private inputs: vacc_date (days since epoch), record_hash
 * Proves: today_timestamp - window_days <= vacc_date <= today_timestamp
 */
template VaccinationRange() {
    signal input today_timestamp;
    signal input window_days;
    signal input vacc_date;      // PRIVATE
    signal input record_hash;    // PRIVATE — binding commitment

    signal output commitment;

    component geq = GreaterEqThan(64);
    geq.in[0] <== vacc_date;
    geq.in[1] <== today_timestamp - window_days;
    geq.out === 1;

    component leq = LessEqThan(64);
    leq.in[0] <== vacc_date;
    leq.in[1] <== today_timestamp;
    leq.out === 1;

    component hasher = Poseidon(2);
    hasher.inputs[0] <== record_hash;
    hasher.inputs[1] <== vacc_date;
    commitment <== hasher.out;
}

component main { public [today_timestamp, window_days] } = VaccinationRange();
```

**Install circomlib:**
```bash
cd packages/circuits && npm install circomlib
```

**Compile:**
```bash
circom circuits/vaccination_range.circom --r1cs --wasm --sym -o build/vaccination_range
```

**DoD:**
- 🟢 `build/vaccination_range/vaccination_range.r1cs` exists
- 🟢 `build/vaccination_range/vaccination_range_js/vaccination_range.wasm` exists

---

### [T3.2] — Vitals Range Circuit

**File:** `packages/circuits/circuits/vitals_range.circom`

**Claim:** "My health metric falls within the specified normal range."

```circom
pragma circom 2.1.6;

include "node_modules/circomlib/circuits/comparators.circom";
include "node_modules/circomlib/circuits/poseidon.circom";

/*
 * Public inputs:  low, high (e.g. BP bounds: 90, 120)
 * Private inputs: value (actual measurement), record_hash
 */
template VitalsRange() {
    signal input low;
    signal input high;
    signal input value;        // PRIVATE
    signal input record_hash;  // PRIVATE

    signal output commitment;

    component geq = GreaterEqThan(32);
    geq.in[0] <== value;
    geq.in[1] <== low;
    geq.out === 1;

    component leq = LessEqThan(32);
    leq.in[0] <== value;
    leq.in[1] <== high;
    leq.out === 1;

    component hasher = Poseidon(2);
    hasher.inputs[0] <== record_hash;
    hasher.inputs[1] <== value;
    commitment <== hasher.out;
}

component main { public [low, high] } = VitalsRange();
```

**Compile:**
```bash
circom circuits/vitals_range.circom --r1cs --wasm --sym -o build/vitals_range
```

**DoD:**
- 🟢 `build/vitals_range/vitals_range.r1cs` exists
- 🟢 A value outside `[low, high]` causes proof generation to fail with a constraint error

---

### [T3.3] — Age Threshold Circuit

**File:** `packages/circuits/circuits/age_threshold.circom`

**Claim:** "My age in days meets or exceeds the minimum threshold."

```circom
pragma circom 2.1.6;

include "node_modules/circomlib/circuits/comparators.circom";
include "node_modules/circomlib/circuits/poseidon.circom";

/*
 * Public inputs:  today_ts (days), min_age_days
 * Private inputs: dob_ts (days since epoch), record_hash
 */
template AgeThreshold() {
    signal input today_ts;
    signal input min_age_days;
    signal input dob_ts;        // PRIVATE
    signal input record_hash;   // PRIVATE

    signal output commitment;

    signal age;
    age <== today_ts - dob_ts;

    component geq = GreaterEqThan(64);
    geq.in[0] <== age;
    geq.in[1] <== min_age_days;
    geq.out === 1;

    component hasher = Poseidon(2);
    hasher.inputs[0] <== record_hash;
    hasher.inputs[1] <== dob_ts;
    commitment <== hasher.out;
}

component main { public [today_ts, min_age_days] } = AgeThreshold();
```

**Compile:**
```bash
circom circuits/age_threshold.circom --r1cs --wasm --sym -o build/age_threshold
```

**DoD:**
- 🟢 `build/age_threshold/age_threshold.r1cs` exists
- 🟢 A `dob_ts` that makes age < `min_age_days` fails proof generation

---

### [T3.4] — Trusted Setup & Key Generation

Run the following for each `{CIRCUIT}` in `[vaccination_range, vitals_range, age_threshold]`:

```bash
# 1. Download Powers of Tau (covers circuits up to 2^12 constraints)
curl -O https://storage.googleapis.com/zkevm/ptau/powersOfTau28_hez_final_12.ptau

# 2. Phase 2 setup
snarkjs groth16 setup \
  build/{CIRCUIT}/{CIRCUIT}.r1cs \
  powersOfTau28_hez_final_12.ptau \
  build/{CIRCUIT}/{CIRCUIT}_0000.zkey

# 3. Contribute to ceremony (one dev contribution is sufficient)
snarkjs zkey contribute \
  build/{CIRCUIT}/{CIRCUIT}_0000.zkey \
  build/{CIRCUIT}/{CIRCUIT}_final.zkey \
  --name="SmartCareHub Dev Contribution" -v

# 4. Export verification key (used by browser for local verification)
snarkjs zkey export verificationkey \
  build/{CIRCUIT}/{CIRCUIT}_final.zkey \
  build/{CIRCUIT}/verification_key.json

# 5. Export Solidity verifier (deploy alongside HealthProver)
snarkjs zkey export solidityverifier \
  build/{CIRCUIT}/{CIRCUIT}_final.zkey \
  ../../contracts/contracts/{CIRCUIT_PASCAL}Verifier.sol
```

Generated verifier contracts:
- `packages/contracts/contracts/VaccinationRangeVerifier.sol`
- `packages/contracts/contracts/VitalsRangeVerifier.sol`
- `packages/contracts/contracts/AgeThresholdVerifier.sol`

Deploy each and call `HealthProver.setVerifier(ClaimType.VACCINATION, verifierAddress)` etc.

**Copy WASM + ZKEY to Next.js public folder:**
```bash
mkdir -p apps/web/public/circuits/vaccination_range
cp build/vaccination_range/vaccination_range_js/vaccination_range.wasm apps/web/public/circuits/vaccination_range/
cp build/vaccination_range/vaccination_range_final.zkey              apps/web/public/circuits/vaccination_range/
cp build/vaccination_range/verification_key.json                     apps/web/public/circuits/vaccination_range/
# Repeat for vitals_range and age_threshold
```

**DoD:**
- 🔵 `{CIRCUIT}_final.zkey` exists for all three circuits
- 🔵 `verification_key.json` exists for all three circuits
- 🟢 `snarkjs groth16 verify verification_key.json public.json proof.json` outputs `OK`

---

### [T3.5] — Browser ZK Proof Helper (`zkProofHelpers.ts`)

**File:** `packages/crypto-core/src/zkProofHelpers.ts`

```ts
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

/**
 * Generate a Groth16 ZK proof entirely in the browser.
 * Private inputs (actual health values) never leave the client.
 */
export async function generateHealthProof(
  claimType: ClaimType,
  inputs: Record<string, number | string>,
  onProgress?: (pct: number) => void
): Promise<{ proof: object; publicSignals: string[] }> {
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
  proof: object,
  publicSignals: string[]
): Promise<boolean> {
  const res  = await fetch(`/circuits/${claimType}_range/verification_key.json`);
  const vkey = await res.json();
  return snarkjs.groth16.verify(vkey, publicSignals, proof);
}

/** Format proof as Solidity calldata for HealthProver.verifyHealthClaim() */
export async function formatProofForChain(proof: object, publicSignals: string[]) {
  return snarkjs.groth16.exportSolidityCallData(proof, publicSignals);
}
```

**DoD:**
- 🔵 `generateHealthProof('vaccination', {...})` resolves within 30 seconds in Chrome
- 🔵 `verifyProofLocally(...)` returns `true` for a valid proof
- 🔵 On-chain `verifyHealthClaim` emits `ProofVerified` event on Sepolia
- 🟢 Network tab shows no outbound request containing private input values

---

## Phase 4 — Frontend UI/UX

> **Goal:** Build all seven Next.js pages and the shared component library. Every page visually exposes the cryptographic mechanics: signature confirmations, proof states, on-chain receipts, permission matrices.

---

### [T4.1] — Web3 Provider & App Shell

**New files:**
- `apps/web/src/providers/Web3Provider.tsx`
- `apps/web/src/app/(app)/layout.tsx`
- `apps/web/src/components/layout/AppNav.tsx`

**`Web3Provider.tsx`:**
```tsx
'use client';
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import '@rainbow-me/rainbowkit/styles.css';

const config = getDefaultConfig({
  appName:   'SmartCareHub',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
  chains:    [sepolia],
  ssr:       true,
});

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

**`AppNav.tsx` requirements:**
- Logo: "SmartCareHub" in Outfit font with `text-gradient-emerald`
- Nav links: Vault · Family · Reminders · Prove · Credentials · Audit
- Right side: `<ConnectButton />` from RainbowKit + live chain/block indicator
- Sticky, glassmorphism: `className="sticky top-0 z-50 glass border-b border-[var(--border-default)]"`
- Mobile: hamburger icon → Framer Motion slide-in drawer

**DoD:**
- 🟢 `<ConnectButton />` connects to Sepolia and shows wallet address
- 🟢 All nav links navigate without hydration errors
- 🟢 Mobile drawer opens/closes with smooth animation

---

### [T4.2] — Shared Component Library

**Directory:** `apps/web/src/components/ui/`

#### `GlassmorphismCard.tsx`
```tsx
import { cn } from '@/lib/utils';

type Variant = 'default' | 'emerald' | 'cyan' | 'emergency';

const variants: Record<Variant, string> = {
  default:   'border-[var(--border-default)]',
  emerald:   'border-[var(--border-active)] shadow-[0_0_24px_rgba(16,185,129,0.3)]',
  cyan:      'border-[var(--border-crypto)] shadow-[0_0_20px_rgba(6,182,212,0.25)]',
  emergency: 'border-[var(--border-emergency)] shadow-[0_0_28px_rgba(220,38,38,0.4)] animate-glow-crimson',
};

export function GlassmorphismCard({
  children, variant = 'default', className, animate
}: { children: React.ReactNode; variant?: Variant; className?: string; animate?: boolean }) {
  return (
    <div className={cn(
      'glass rounded-xl2 p-6 transition-all duration-300',
      variants[variant],
      animate && 'animate-slide-up',
      className
    )}>
      {children}
    </div>
  );
}
```

#### `TxReceipt.tsx`
Props: `{ txHash: string; blockNumber: bigint; timestamp: number; network: 'sepolia' }`
- Animated emerald checkmark (Framer Motion scale-in)
- Block number + truncated hash (hover to copy full hash)
- Relative timestamp (e.g. "2 minutes ago")
- Etherscan link: `https://sepolia.etherscan.io/tx/{txHash}`
- Font: `font-mono text-xs text-[var(--text-secondary)]`

#### `ProofProgressRing.tsx`
Props: `{ progress: number; stage: string }` (progress 0–100)
- SVG circle, stroke-dashoffset animated on `progress` change
- Stroke colour: `var(--accent-cyan)`
- Centre: stage name in `font-mono text-sm`
- Outer glow: `drop-shadow(0 0 8px var(--accent-cyan))`

Stages sequence: `['Preparing', 'Loading Circuit', 'Computing Witness', 'Generating Proof', 'Verifying', 'Complete']`

#### `IntegrityChip.tsx`
```tsx
type Status = 'verified' | 'pending' | 'revoked' | 'unknown';
// Props: { status: Status; hash?: string }

const statusConfig = {
  verified: { bg: 'bg-[var(--accent-emerald-dim)]', text: 'text-emerald', label: 'Verified', icon: ShieldCheck },
  pending:  { bg: 'bg-[var(--emergency-amber-dim)]', text: 'text-amber',   label: 'Pending',  icon: Clock },
  revoked:  { bg: 'bg-[var(--emergency-crimson-dim)]', text: 'text-crimson', label: 'Revoked', icon: X },
  unknown:  { bg: 'bg-[var(--bg-elevated)]', text: 'text-[var(--text-muted)]', label: 'Unknown', icon: HelpCircle },
};
```

#### `EmergencyBadge.tsx`
```tsx
export function EmergencyBadge({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-crimson-dim border border-crimson animate-glow-crimson">
      <AlertTriangle className="w-4 h-4 text-crimson animate-pulse" />
      <span className="text-crimson text-sm font-semibold">{label}</span>
    </div>
  );
}
```

#### `WalletSignatureModal.tsx`
Props: `{ isOpen: boolean; message: string; purpose: string; onSign: () => void; onCancel: () => void }`
- Framer Motion AnimatePresence backdrop + centered card
- Shows purpose (e.g. "Derive your encryption key")
- Shows the raw message in a `font-mono` scrollable `<pre>` block
- Wallet address + chain indicator
- "Sign with Wallet" (indigo) and "Cancel" (ghost) buttons
- Includes warning: "This signature is used only locally and is never transmitted"

**DoD:**
- 🟢 All six components render without TypeScript errors
- 🟢 `TxReceipt` Etherscan link navigates to the correct Sepolia page
- 🟢 `ProofProgressRing` animates smoothly through all stages

---

### [T4.3] — Landing Page (`/`)

**File:** `apps/web/src/app/page.tsx`

**Section 1 — Hero**
- Background: animated CSS mesh gradient (`background-image: radial-gradient(...)` + keyframe shift)
- Heading: `"Own Your Health Data. Forever."` — Outfit 800, 5xl on desktop
- Subheading: one-liner about ZK + encryption
- CTA: `<ConnectButton />` wrapped in an emerald gradient button
- Floating glass cards (Framer Motion `y` float animation): show mini previews of Vault, ZK Prover, Emergency panel

**Section 2 — Feature Showcase**
Six `<GlassmorphismCard>` tiles, 3×2 grid:
| Feature | Accent | Icon |
|---------|--------|------|
| Medical Vault | emerald | Shield |
| Family Circle | teal | Users |
| Adherence | cyan | Activity |
| ZK Prover | cyan | Lock |
| Credentials | emerald | Award |
| Emergency | crimson | Zap |

**Section 3 — Architecture Flow Diagram**
Animated horizontal flow (CSS keyframe arrows):
```
[🔒 Browser Encrypt] → [📦 IPFS Store] → [⛓ Chain Anchor] → [✓ Proof Verify]
```

**Section 4 — Footer**
`"Built on Ethereum Sepolia · SnarkJS · Viem · OpenZeppelin"`

**DoD:**
- 🟢 Lighthouse Performance ≥ 90 on `/`
- 🟢 CTA button opens RainbowKit modal
- 🟢 All six feature cards render with correct accent colours and icons

---

### [T4.4] — Medical Vault Dashboard (`/vault`)

**File:** `apps/web/src/app/(app)/vault/page.tsx`

#### `<UploadRecord />` component
Multi-step flow with visual stepper:
```
Step 1 → Encrypt    (amber — loading, emerald — done)
Step 2 → Upload     (amber — loading, emerald — done)
Step 3 → Anchor     (amber — loading, emerald — done)
Step 4 → Complete ✓ (emerald — done)
```

Internal flow:
1. File dropped → `<WalletSignatureModal />` opens for KDF signature
2. `deriveKeyFromSignature(sig)` → `CryptoKey`
3. `encryptRecord(fileBytes, key)` → encrypted `Uint8Array`
4. Upload to IPFS via `@web3-storage/w3up-client` → `encryptedCID`
5. `computeContentHash(encrypted)` → `contentHash`
6. `anchorRecord(contentHash, encryptedCID)` via wagmi `useWriteContract`
7. `<TxReceipt />` displayed with block hash

#### `<RecordList />` component
- CSS Grid of `<GlassmorphismCard variant="emerald">` items
- Each card: file-type icon, upload date, hash (truncated `font-mono`), `<IntegrityChip />`
- "Decrypt & View" button: re-derives key → fetches IPFS → `decryptRecord` → opens in `<dialog>`
- "Revoke" button: calls `revokeRecord(index)` on-chain → chip turns crimson

#### `<IntegrityVerifier />` tool
- Paste a CID + re-upload a file → re-compute hash → compare with on-chain → show ✅ / ❌

**DoD:**
- 🟢 Upload a PDF → appears in RecordList with emerald `IntegrityChip`
- 🟢 "Decrypt & View" opens the original PDF correctly
- 🟢 Modifying the encrypted IPFS blob causes decryption to throw with a toast error
- 🟢 `RecordAnchored` event visible in Sepolia Etherscan

---

### [T4.5] — Family Health Circle (`/family`)

**File:** `apps/web/src/app/(app)/family/page.tsx`

#### `<QRHandshake />` component
**Granting flow (Grantor device):**
1. Click "Add Family Member"
2. Generate ECDH key pair (ephemeral)
3. Encode `{ grantorAddress, ecdhPubKeyJwk, sessionNonce }` as QR (use `qrcode.react`)
4. Delegate scans on their device → sees grantor info + role selector
5. Delegate confirms → sends their ECDH pub key back
6. Call `encryptKeyForDelegate()` → `grantDelegation()` on-chain

**Receiving flow (Delegate device):**
1. Scan QR
2. Select role (Read / Read+Write) and optional expiry date
3. App generates delegate ECDH key pair → encodes in response QR
4. Grantor scans response → completes the handshake

Use `html5-qrcode` library for scanning.

#### `<DelegationMatrix />` component
Responsive table with columns:
`Delegate Address | Role | Expires | Status | Actions`
- Each row: `<IntegrityChip />` for status, `<button>Revoke</button>` (calls `revokeDelegation()`)
- Expired rows: amber tint + "Expired" chip
- Revoked rows: crimson tint + "Revoked" chip + strikethrough on address
- Countdown timer on time-bound delegations

**DoD:**
- 🟢 Grant a delegation → appears in matrix with correct role and expiry
- 🟢 Click Revoke → row updates to "Revoked" within 2 block confirmations
- 🔵 `hasValidAccess(grantor, delegate)` returns `false` on-chain after revocation

---

### [T4.6] — Medicine Reminders (`/reminders`)

**File:** `apps/web/src/app/(app)/reminders/page.tsx`

#### `<ReminderScheduler />` component
Add medication form:
- Name, dose (mg), frequency (once/twice/thrice daily), start date, end date (optional)
- Storage: `IndexedDB` (never sent to any server)
- Displays: next dose countdown in HH:MM:SS format

#### Browser notification engine (`apps/web/src/lib/notifications.ts`)
```ts
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  const perm = await Notification.requestPermission();
  return perm === 'granted';
}

export function scheduleReminder(medicationName: string, dueAt: Date, onDue: () => void) {
  const ms = dueAt.getTime() - Date.now();
  if (ms <= 0) return;
  setTimeout(() => {
    new Notification('SmartCareHub — Medication Reminder', {
      body: `Time to take: ${medicationName}`,
      icon: '/icon-192.png',
    });
    onDue(); // trigger confirmation modal
  }, ms);
}
```

#### `<AdherenceLog />` component (dose confirmation modal)
- Fires on notification trigger
- Shows: medication name, scheduled time, current time
- "Confirm Intake" button → `signDosageEvent()` → `logDosage()` on-chain
- Shows EIP-712 structured data before signing (transparency)
- "Snooze 15 min" option

#### `<ComplianceScore />` component
- Calls `computeComplianceScore(patient, from, to)` on-chain
- Circular ring: emerald if ≥ 80%, amber if 50–79%, crimson if < 50%
- Calendar heatmap showing confirmed (emerald) vs missed (crimson) doses per day

**DoD:**
- 🟢 Add a medication → browser push notification fires at the scheduled time
- 🟢 "Confirm Intake" shows EIP-712 MetaMask modal with structured medication data
- 🟢 `DosageConfirmed` event visible on Sepolia Etherscan after confirmation
- 🔵 Compliance score correctly reflects confirmed vs total scheduled events

---

### [T4.7] — ZK Health Prover (`/prove`)

**File:** `apps/web/src/app/(app)/prove/page.tsx`

#### `<ClaimBuilder />` component
Three tabs: Vaccination | Vitals | Age

Each tab:
- **Public inputs** (shown to verifier): user-filled fields with validation
- **Private inputs**: linked from decrypted health records or manually entered for demo
- "Generate Proof" button (disabled until all inputs filled)

#### `<ProofProgress />` component
Driven by `generateHealthProof()` + `onProgress` callback:
- `<ProofProgressRing />` with animated fill
- Stage labels update in real time
- On completion: show `publicSignals` in a `font-mono` card
- "Verify On-Chain" button → calls `HealthProver.verifyHealthClaim()`
- `<TxReceipt />` with `ProofVerified` event details

#### `<VerifierChip />` component
After on-chain verification:
- Claim type badge (emerald)
- Sepolia block timestamp
- Transaction hash (truncated, copyable)
- QR code of the tx hash (for third-party scanning)
- "Export Proof JSON" button

**DoD:**
- 🔵 Proof generation completes in browser (< 30s on a modern laptop)
- 🔵 `verifyProofLocally()` returns `true`
- 🔵 `verifyHealthClaim` emits `ProofVerified` on Sepolia
- 🟢 Entering an invalid private input (e.g., BP outside range) shows a clear error before the circuit even runs
- 🟢 Network tab shows zero outbound requests containing private input values

---

### [T4.8] — Credential Locker & Emergency Access (`/credentials`)

**File:** `apps/web/src/app/(app)/credentials/page.tsx`

#### `<CredentialCard />` component
Displays a soulbound NFT:
- Credential type badge (e.g., "VACCINATION", "FITNESS_TO_WORK")
- Issuer address (truncated)
- Issued / expires dates
- Data hash (`font-mono`, truncated)
- `<IntegrityChip status="verified|expired|revoked" />`
- Etherscan link

#### `<EmergencyPayload />` component
Configuration form for the triage payload:
```
Fields:
  • Blood type            (dropdown: A+, A-, B+, B-, O+, O-, AB+, AB-)
  • Anaphylactic allergies (textarea)
  • Critical conditions   (textarea)
  • Emergency contacts    (up to 3: name + phone)
  • Active implants       (checkboxes: pacemaker, cochlear, etc.)
```
- "Save & Encrypt" button: encrypts with patient key → uploads to IPFS → `setTriagePayload(encryptedCID, guardians)`

#### `<EmergencyGuardianPanel />` component
- Add/remove guardian wallet addresses
- Displays guardians as address chips (teal)

#### `<BreakGlassPanel />` component (🔴)

Two distinct crimson `<GlassmorphismCard variant="emergency">` panels:

**Panel 1 — Guardian Release**
- `<EmergencyBadge label="Guardian Emergency Access" />`
- "I am an Authorised Guardian" button
- Mandatory confirmation dialog:
  > ⚠️ This access will be permanently recorded on the blockchain. Your wallet address and timestamp will be visible to the patient forever.
- Calls `breakGlassAsGuardian(patientAddress)`

**Panel 2 — Medical Practitioner Access**
- QR scanner (device camera via `html5-qrcode`)
- Reads medic's credential NFT token ID from QR
- Same mandatory confirmation dialog
- Calls `breakGlassAsMedic(patientAddress, tokenId)`

#### `<AuditTimeline />` component
- Reads `getAuditLog(patient)` on-chain
- Vertical timeline: accessor address, timestamp, reason badge
- `BreakGlassAccessed` items: crimson pulsing dot, `<EmergencyBadge />`
- Etherscan link on each event

**DoD:**
- 🔴 Attempting `safeTransferFrom` on a soulbound credential reverts with "soulbound" error
- 🟢 Save triage payload → CID stored on-chain via `setTriagePayload`
- 🔴 Guardian `breakGlassAsGuardian` records event in audit log
- 🟢 Non-guardian calling `breakGlassAsGuardian` shows revert error toast
- 🟢 Audit timeline updates after a break-glass event without page refresh

---

### [T4.9] — Audit Trail (`/audit`)

**File:** `apps/web/src/app/(app)/audit/page.tsx`

**Fetch all on-chain events for the current patient:**
```ts
// apps/web/src/lib/auditLog.ts
import { publicClient } from './viemClient';
import { parseAbiItem } from 'viem';

export async function fetchAllPatientEvents(patient: `0x${string}`) {
  const [records, delegations, dosages, proofs, breakGlass] = await Promise.all([
    publicClient.getLogs({
      address: process.env.NEXT_PUBLIC_RECORD_REGISTRY_ADDRESS as `0x${string}`,
      event: parseAbiItem('event RecordAnchored(address indexed owner, bytes32 indexed contentHash, string encryptedCID, uint256 timestamp)'),
      args: { owner: patient },
      fromBlock: 'earliest',
    }),
    // ... repeat for each contract and event
  ]);
  return { records, delegations, dosages, proofs, breakGlass };
}
```

**Timeline colour scheme:**
| Event | Colour |
|-------|--------|
| RecordAnchored | emerald |
| RecordRevoked | amber |
| DelegationGranted | teal |
| DelegationRevoked | amber |
| DosageConfirmed | cyan |
| ProofVerified | cyan |
| BreakGlassAccessed | crimson (pulsing) |

**DoD:**
- 🟢 All events from all five contracts appear in the timeline after performing corresponding actions
- 🔴 `BreakGlassAccessed` events highlighted in pulsing crimson
- 🟢 Clicking any event's Etherscan link opens the correct Sepolia tx page

---

### [T4.10] — IndexedDB Mock Layer (Dev Fallback)

**File:** `apps/web/src/lib/mockStore.ts`

```ts
import { openDB } from 'idb';

export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_STORE === 'true';

export async function getDB() {
  return openDB('smartcarehub-dev', 1, {
    upgrade(db) {
      db.createObjectStore('records',     { keyPath: 'contentHash' });
      db.createObjectStore('delegations', { keyPath: 'id', autoIncrement: true });
      db.createObjectStore('adherence',   { keyPath: 'eventHash' });
      db.createObjectStore('credentials', { keyPath: 'tokenId' });
      db.createObjectStore('triage',      { keyPath: 'owner' });
      db.createObjectStore('auditLog',    { keyPath: 'id', autoIncrement: true });
    },
  });
}
```

Each contract hook checks `USE_MOCK` first and routes to IndexedDB if `true`.

**DoD:**
- 🟢 `NEXT_PUBLIC_USE_MOCK_STORE=true` allows all UI flows without MetaMask or deployed contracts
- 🟢 Data persists across page refreshes (IndexedDB, not sessionStorage)

---

## Phase 5 — Integration & Testing

> **Goal:** Connect all layers, run end-to-end flow tests, achieve 80%+ contract coverage, and pass the security checklist.

---

### [T5.1] — Wagmi Contract Hooks

**Directory:** `apps/web/src/hooks/contracts/`

Create one hook file per contract, e.g.:

```ts
// useRecordRegistry.ts
import { useWriteContract, useReadContract, useWatchContractEvent } from 'wagmi';
import { RECORD_REGISTRY_ABI } from '@/lib/abis';

const ADDRESS = process.env.NEXT_PUBLIC_RECORD_REGISTRY_ADDRESS as `0x${string}`;

export function useAnchorRecord() {
  return useWriteContract();
}

export function useGetMyRecords() {
  return useReadContract({
    address:      ADDRESS,
    abi:          RECORD_REGISTRY_ABI,
    functionName: 'getMyRecords',
  });
}

export function useWatchRecordAnchored(onLog: (log: unknown) => void) {
  return useWatchContractEvent({
    address:   ADDRESS,
    abi:       RECORD_REGISTRY_ABI,
    eventName: 'RecordAnchored',
    onLogs:    onLog,
  });
}
```

Repeat for `useDelegationManager`, `useAdherenceLogger`, `useHealthProver`, `useCredentialLocker`.

Place ABIs in `apps/web/src/lib/abis/` (copy from `packages/contracts/artifacts/contracts/`).

**DoD:**
- 🟢 All read hooks return data from Sepolia contracts
- 🟢 Write hooks surface loading/success/error states in the UI
- 🟢 Event watchers trigger UI updates in real time

---

### [T5.2] — End-to-End Playwright Tests

**File:** `apps/web/e2e/flows.spec.ts`

```ts
import { test, expect } from '@playwright/test';

test('F1: Upload, anchor, retrieve, and verify a medical record', async ({ page }) => {
  await page.goto('/');
  // 1. Connect wallet (mock wallet injected by playwright-web3 fixture)
  // 2. Navigate to /vault
  // 3. Drop test PDF into upload zone
  // 4. Confirm signature modal
  // 5. Wait for TxReceipt to appear (await page.locator('[data-testid="tx-receipt"]').isVisible())
  // 6. Assert IntegrityChip shows "Verified"
  // 7. Click "Decrypt & View" → assert file name matches
});

test('F2: Grant delegation, verify matrix, revoke', async ({ page }) => { /* ... */ });
test('F3: Add medication, confirm dose, check compliance score', async ({ page }) => { /* ... */ });
test('F4: Generate ZK vaccination proof, verify on-chain', async ({ page }) => { /* ... */ });
test('F5: Set triage payload, guardian break-glass, check audit trail', async ({ page }) => { /* ... */ });
```

**Run:**
```bash
cd apps/web && npx playwright test
```

**DoD:**
- 🟢 All 5 flow tests pass against Hardhat local node
- 🟢 No single test exceeds 2 minutes runtime

---

### [T5.3] — Contract Coverage

```bash
cd packages/contracts
npx hardhat coverage
```

**Minimum targets:**

| Contract | Statements | Branches | Functions |
|----------|-----------|----------|-----------|
| RecordRegistry | 90% | 85% | 100% |
| DelegationManager | 90% | 85% | 100% |
| AdherenceLogger | 90% | 80% | 100% |
| HealthProver | 85% | 80% | 100% |
| CredentialLocker | 90% | 85% | 100% |

**DoD:**
- 🟢 Coverage report shows all targets met
- 🟢 All revert paths (`require` checks) have dedicated negative test cases

---

### [T5.4] — Security Checklist

| # | Check | How to Verify |
|---|-------|--------------|
| 1 | No PHI in contract events | `grep -r "emit" packages/contracts/contracts/` — zero cleartext medical strings |
| 2 | No Node.js `crypto` in client | `grep -r "require('crypto')" apps/web/src` → 0 results |
| 3 | No `fs`, `buffer` in client | Same grep for `'fs'`, `'buffer'` |
| 4 | AES key non-extractable | DevTools: `key.extractable === false` |
| 5 | Soulbound transfer reverts | Hardhat test: `expect(transfer).to.be.revertedWith("soulbound")` |
| 6 | Break-glass always audited | Every call to `breakGlass*` emits `BreakGlassAccessed` |
| 7 | ZK private inputs not transmitted | Network tab: no outbound request with `vacc_date`, `value`, `dob_ts`, etc. |
| 8 | Delegation revocation instant | `hasValidAccess` returns `false` in the same block as `revokeDelegation` |

**DoD:**
- 🟢 All 8 checks pass with zero violations

---

### [T5.5] — Lighthouse CI

**File:** `apps/web/lighthouserc.js`
```js
module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000',
        'http://localhost:3000/vault',
        'http://localhost:3000/prove',
      ],
    },
    assert: {
      assertions: {
        'categories:performance':    ['warn', { minScore: 0.85 }],
        'categories:accessibility':  ['error', { minScore: 0.90 }],
        'categories:seo':            ['warn', { minScore: 0.90 }],
        'categories:best-practices': ['warn', { minScore: 0.90 }],
      },
    },
  },
};
```

**Run:**
```bash
npm install -g @lhci/cli
lhci autorun
```

**DoD:**
- 🟢 Performance ≥ 85 on `/`, `/vault`, `/prove`
- 🟢 Accessibility ≥ 90 on all pages
- 🟢 SEO ≥ 90 on all pages

---

## Task Summary Table

| ID | Task | Phase | Priority |
|----|------|-------|----------|
| T0.1 | Bootstrap Turborepo monorepo | Scaffold | 🔴 Critical |
| T0.2 | Bootstrap Next.js app + Tailwind | Scaffold | 🔴 Critical |
| T0.3 | Bootstrap Hardhat package | Scaffold | 🔴 Critical |
| T0.4 | Bootstrap Circom/SnarkJS package | Scaffold | 🔴 Critical |
| T1.1 | `RecordRegistry.sol` | Contracts | 🔴 Critical |
| T1.2 | `DelegationManager.sol` | Contracts | 🔴 Critical |
| T1.3 | `AdherenceLogger.sol` | Contracts | 🔴 Critical |
| T1.4 | `HealthProver.sol` | Contracts | 🔴 Critical |
| T1.5 | `CredentialLocker.sol` | Contracts | 🔴 Critical |
| T1.6 | Deploy to Sepolia | Contracts | 🟠 High |
| T2.1 | Key derivation from wallet sig (HKDF) | Crypto | 🔴 Critical |
| T2.2 | Record encryption/decryption (AES-GCM) | Crypto | 🔴 Critical |
| T2.3 | Delegation key re-encryption (ECDH+AES-KW) | Crypto | 🟠 High |
| T2.4 | EIP-712 dosage event signing | Crypto | 🟠 High |
| T3.1 | Vaccination range Circom circuit | ZK | 🟠 High |
| T3.2 | Vitals range Circom circuit | ZK | 🟠 High |
| T3.3 | Age threshold Circom circuit | ZK | 🟠 High |
| T3.4 | Trusted setup + Solidity verifier export | ZK | 🟠 High |
| T3.5 | Browser SnarkJS proof helper | ZK | 🟠 High |
| T4.1 | Web3 provider + app shell + nav | Frontend | 🔴 Critical |
| T4.2 | Shared component library (6 components) | Frontend | 🔴 Critical |
| T4.3 | Landing page (`/`) | Frontend | 🟠 High |
| T4.4 | Medical Vault dashboard (`/vault`) | Frontend | 🔴 Critical |
| T4.5 | Family Health Circle (`/family`) | Frontend | 🟠 High |
| T4.6 | Medicine Reminders (`/reminders`) | Frontend | 🟠 High |
| T4.7 | ZK Health Prover (`/prove`) | Frontend | 🟠 High |
| T4.8 | Credential Locker & Emergency (`/credentials`) | Frontend | 🟠 High |
| T4.9 | Audit Trail (`/audit`) | Frontend | 🟡 Medium |
| T4.10 | IndexedDB mock layer (dev fallback) | Frontend | 🟡 Medium |
| T5.1 | Wagmi contract hooks | Integration | 🔴 Critical |
| T5.2 | Playwright E2E tests (5 flows) | Testing | 🟠 High |
| T5.3 | Hardhat coverage (80%+ per contract) | Testing | 🟠 High |
| T5.4 | Security checklist (8 checks) | Security | 🔴 Critical |
| T5.5 | Lighthouse CI | Performance | 🟡 Medium |

---

## Recommended Implementation Order

```
Week 1  →  T0.1 → T0.2 → T0.3 → T0.4 → T2.1 → T2.2
Week 2  →  T1.1 → T1.2 → T1.3 → T1.4 → T1.5 → T1.6
Week 3  →  T2.3 → T2.4 → T3.1 → T3.2 → T3.3 → T3.4 → T3.5
Week 4  →  T4.1 → T4.2 → T4.3 → T4.4 → T5.1
Week 5  →  T4.5 → T4.6 → T4.7 → T4.8 → T4.9 → T4.10
Week 6  →  T5.2 → T5.3 → T5.4 → T5.5 → Final review
```

---

*SmartCareHub TASKS.md — Version 1.0 · 2026-10-30*
*Stack: Next.js 14 · Tailwind CSS v3 · Viem/Wagmi/RainbowKit · SnarkJS/Circom · Solidity/Hardhat · Sepolia*
