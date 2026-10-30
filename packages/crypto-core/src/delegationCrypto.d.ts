/**
 * Re-encrypts the patient's AES master key for a delegate using ECDH + AES-KW.
 * Output is stored on-chain in DelegationManager.grantDelegation().
 * Strictly browser-safe Web Crypto API.
 *
 * @param masterKeyBytes     Raw bytes of the patient's AES-256 key
 * @param delegatePubKeyJwk  Delegate's ECDH public key in JWK format
 * @returns                  Packed bytes: [4B ephemeralPubLen | ephemeralPubJwk | wrappedKey]
 */
export declare function encryptKeyForDelegate(masterKeyBytes: Uint8Array, delegatePubKeyJwk: JsonWebKey): Promise<Uint8Array>;
/**
 * Unwraps a delegated key using the delegate's ECDH private key.
 */
export declare function decryptDelegatedKey(packed: Uint8Array, delegatePrivKey: CryptoKey): Promise<CryptoKey>;
/** Helper to generate an ECDH P-256 keypair for a user profile */
export declare function generateECDHKeyPair(): Promise<CryptoKeyPair>;
