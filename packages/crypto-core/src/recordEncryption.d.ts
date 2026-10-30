/**
 * Encrypts arbitrary bytes using AES-256-GCM.
 * Output format: [12-byte IV | ciphertext + 16-byte auth tag]
 * Strictly browser-safe Web Crypto API.
 */
export declare function encryptRecord(plaintext: Uint8Array, key: CryptoKey): Promise<Uint8Array>;
/**
 * Decrypts AES-256-GCM encrypted bytes.
 * Expects the [12-byte IV | ciphertext + 16-byte auth tag] format from encryptRecord.
 */
export declare function decryptRecord(encrypted: Uint8Array, key: CryptoKey): Promise<Uint8Array>;
/** SHA-256 of encrypted bytes — used as the on-chain content hash commitment. */
export declare function computeContentHash(encrypted: Uint8Array): Promise<Uint8Array>;
/** Formats byte array to hex string (0x...) */
export declare function bytesToHex(bytes: Uint8Array): `0x${string}`;
/** Parses hex string (0x...) to byte array */
export declare function hexToBytes(hex: string): Uint8Array;
