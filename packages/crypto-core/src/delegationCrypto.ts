/**
 * Re-encrypts the patient's AES master key for a delegate using ECDH + AES-KW.
 * Output is stored on-chain in DelegationManager.grantDelegation().
 * Strictly browser-safe Web Crypto API.
 *
 * @param masterKeyBytes     Raw bytes of the patient's AES-256 key
 * @param delegatePubKeyJwk  Delegate's ECDH public key in JWK format
 * @returns                  Packed bytes: [4B ephemeralPubLen | ephemeralPubJwk | wrappedKey]
 */
export async function encryptKeyForDelegate(
  masterKeyBytes: Uint8Array,
  delegatePubKeyJwk: JsonWebKey
): Promise<Uint8Array> {
  const cryptoObj = typeof window !== 'undefined' ? window.crypto : globalThis.crypto;

  const delegatePubKey = await cryptoObj.subtle.importKey(
    'jwk',
    delegatePubKeyJwk,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );

  const ephemeral = await cryptoObj.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey']
  );

  const wrappingKey = await cryptoObj.subtle.deriveKey(
    { name: 'ECDH', public: delegatePubKey },
    ephemeral.privateKey,
    { name: 'AES-KW', length: 256 },
    false,
    ['wrapKey']
  );

  const masterKey = await cryptoObj.subtle.importKey(
    'raw',
    masterKeyBytes as unknown as BufferSource,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  const wrappedKey = await cryptoObj.subtle.wrapKey('raw', masterKey, wrappingKey, 'AES-KW');
  const ephemeralPubJwk = await cryptoObj.subtle.exportKey('jwk', ephemeral.publicKey);
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
  const cryptoObj = typeof window !== 'undefined' ? window.crypto : globalThis.crypto;
  const view = new DataView(packed.buffer, packed.byteOffset);
  const ephemeralPubLen = view.getUint32(0, false);
  const ephemeralPubJwk = JSON.parse(
    new TextDecoder().decode(packed.slice(4, 4 + ephemeralPubLen))
  ) as JsonWebKey;
  const wrappedKeyBytes = packed.slice(4 + ephemeralPubLen);

  const ephemeralPub = await cryptoObj.subtle.importKey(
    'jwk',
    ephemeralPubJwk,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );

  const unwrappingKey = await cryptoObj.subtle.deriveKey(
    { name: 'ECDH', public: ephemeralPub },
    delegatePrivKey,
    { name: 'AES-KW', length: 256 },
    false,
    ['unwrapKey']
  );

  return cryptoObj.subtle.unwrapKey(
    'raw',
    wrappedKeyBytes as unknown as BufferSource,
    unwrappingKey,
    'AES-KW',
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/** Helper to generate an ECDH P-256 keypair for a user profile */
export async function generateECDHKeyPair(): Promise<CryptoKeyPair> {
  const cryptoObj = typeof window !== 'undefined' ? window.crypto : globalThis.crypto;
  return cryptoObj.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey']
  );
}

export const generateDelegateKeyPair = generateECDHKeyPair;

export async function exportPublicKeyJwk(key: CryptoKey): Promise<JsonWebKey> {
  const cryptoObj = typeof window !== 'undefined' ? window.crypto : globalThis.crypto;
  return cryptoObj.subtle.exportKey('jwk', key);
}

export async function importPublicKeyJwk(jwk: JsonWebKey): Promise<CryptoKey> {
  const cryptoObj = typeof window !== 'undefined' ? window.crypto : globalThis.crypto;
  return cryptoObj.subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );
}

