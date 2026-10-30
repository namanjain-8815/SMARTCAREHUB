/**
 * Derives a stable AES-256-GCM CryptoKey from a wallet signature using HKDF.
 * The derived key is the patient's master encryption key (non-extractable).
 * Strictly browser-safe Web Crypto API.
 */
export async function deriveKeyFromSignature(
  signature: Uint8Array,
  salt: string = 'SmartCareHub.v1'
): Promise<CryptoKey> {
  const cryptoObj = typeof window !== 'undefined' ? window.crypto : globalThis.crypto;
  const keyMaterial = await cryptoObj.subtle.importKey(
    'raw',
    signature as unknown as BufferSource,
    'HKDF',
    false,
    ['deriveKey']
  );

  return cryptoObj.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new TextEncoder().encode(salt),
      info: new TextEncoder().encode('SmartCareHub.PatientEncryptionKey'),
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false, // non-extractable
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

/**
 * Derives raw 32-byte AES key material from a wallet signature using HKDF deriveBits.
 * Suitable for ECDH-based key wrapping/delegation.
 */
export async function deriveRawKeyBytesFromSignature(
  signature: Uint8Array,
  salt: string = 'SmartCareHub.v1'
): Promise<Uint8Array> {
  const cryptoObj = typeof window !== 'undefined' ? window.crypto : globalThis.crypto;
  const keyMaterial = await cryptoObj.subtle.importKey(
    'raw',
    signature as unknown as BufferSource,
    'HKDF',
    false,
    ['deriveBits']
  );

  const bits = await cryptoObj.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new TextEncoder().encode(salt),
      info: new TextEncoder().encode('SmartCareHub.PatientEncryptionKey'),
    },
    keyMaterial,
    256
  );
  return new Uint8Array(bits);
}

