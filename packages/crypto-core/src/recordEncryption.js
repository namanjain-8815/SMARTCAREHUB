/**
 * Encrypts arbitrary bytes using AES-256-GCM.
 * Output format: [12-byte IV | ciphertext + 16-byte auth tag]
 * Strictly browser-safe Web Crypto API.
 */
export async function encryptRecord(plaintext, key) {
    const cryptoObj = typeof window !== 'undefined' ? window.crypto : globalThis.crypto;
    const iv = cryptoObj.getRandomValues(new Uint8Array(12));
    const ciphertext = await cryptoObj.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);
    const result = new Uint8Array(12 + ciphertext.byteLength);
    result.set(iv, 0);
    result.set(new Uint8Array(ciphertext), 12);
    return result;
}
/**
 * Decrypts AES-256-GCM encrypted bytes.
 * Expects the [12-byte IV | ciphertext + 16-byte auth tag] format from encryptRecord.
 */
export async function decryptRecord(encrypted, key) {
    if (encrypted.length < 28) {
        throw new Error('Encrypted record payload too short (minimum 28 bytes for IV + tag)');
    }
    const cryptoObj = typeof window !== 'undefined' ? window.crypto : globalThis.crypto;
    const iv = encrypted.slice(0, 12);
    const ciphertext = encrypted.slice(12);
    const plaintext = await cryptoObj.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
    return new Uint8Array(plaintext);
}
/** SHA-256 of encrypted bytes — used as the on-chain content hash commitment. */
export async function computeContentHash(encrypted) {
    const cryptoObj = typeof window !== 'undefined' ? window.crypto : globalThis.crypto;
    return new Uint8Array(await cryptoObj.subtle.digest('SHA-256', encrypted));
}
/** Formats byte array to hex string (0x...) */
export function bytesToHex(bytes) {
    return `0x${Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')}`;
}
/** Parses hex string (0x...) to byte array */
export function hexToBytes(hex) {
    const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
    const bytes = new Uint8Array(clean.length / 2);
    for (let i = 0; i < clean.length; i += 2) {
        bytes[i / 2] = parseInt(clean.substring(i, i + 2), 16);
    }
    return bytes;
}
