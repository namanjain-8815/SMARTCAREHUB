/**
 * Derives a stable AES-256-GCM CryptoKey from a wallet signature using HKDF.
 * The derived key is the patient's master encryption key (non-extractable).
 * Strictly browser-safe Web Crypto API.
 */
export declare function deriveKeyFromSignature(signature: Uint8Array, salt?: string): Promise<CryptoKey>;
/** Returns the deterministic message the wallet must sign to derive the key. */
export declare function getKeyDerivationMessage(): string;
