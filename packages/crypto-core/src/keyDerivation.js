/**
 * Derives a stable AES-256-GCM CryptoKey from a wallet signature using HKDF.
 * The derived key is the patient's master encryption key (non-extractable).
 * Strictly browser-safe Web Crypto API.
 */
export async function deriveKeyFromSignature(signature, salt = 'SmartCareHub.v1') {
    const cryptoObj = typeof window !== 'undefined' ? window.crypto : globalThis.crypto;
    const keyMaterial = await cryptoObj.subtle.importKey('raw', signature, 'HKDF', false, ['deriveKey']);
    return cryptoObj.subtle.deriveKey({
        name: 'HKDF',
        hash: 'SHA-256',
        salt: new TextEncoder().encode(salt),
        info: new TextEncoder().encode('SmartCareHub.PatientEncryptionKey'),
    }, keyMaterial, { name: 'AES-GCM', length: 256 }, false, // non-extractable
    ['encrypt', 'decrypt']);
}
/** Returns the deterministic message the wallet must sign to derive the key. */
export function getKeyDerivationMessage() {
    return [
        'SmartCareHub — Encryption Key Derivation',
        '',
        'Signing this message authorises derivation of your personal encryption key.',
        'This key never leaves your browser.',
        '',
        'Nonce: SMARTCAREHUB_KDF_V1_STATIC',
    ].join('\n');
}
