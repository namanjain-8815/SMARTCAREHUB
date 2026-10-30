export {
  deriveKeyFromSignature,
  deriveRawKeyBytesFromSignature,
  getKeyDerivationMessage,
} from './keyDerivation';

export {
  encryptRecord,
  decryptRecord,
  computeContentHash,
  bytesToHex,
  hexToBytes,
} from './recordEncryption';

export {
  encryptKeyForDelegate,
  decryptDelegatedKey,
  generateECDHKeyPair,
  generateDelegateKeyPair,
  exportPublicKeyJwk,
  importPublicKeyJwk,
} from './delegationCrypto';

export {
  signDosageEvent,
  type DosagePayload,
} from './adherenceSign';

