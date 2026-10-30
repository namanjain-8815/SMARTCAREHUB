import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  deriveKeyFromSignature,
  getKeyDerivationMessage,
} from '../src/keyDerivation.js';
import {
  encryptRecord,
  decryptRecord,
  computeContentHash,
  bytesToHex,
  hexToBytes,
} from '../src/recordEncryption.js';
import {
  encryptKeyForDelegate,
  decryptDelegatedKey,
  generateECDHKeyPair,
} from '../src/delegationCrypto.js';

describe('Phase 2 — Cryptographic Core Verification', () => {
  // Test T2.1
  test('T2.1: Key Derivation — non-extractable, deterministic, distinct', async () => {
    const sigA = new Uint8Array(65).fill(1);
    const sigB = new Uint8Array(65).fill(2);

    const keyA = await deriveKeyFromSignature(sigA);
    const keyB = await deriveKeyFromSignature(sigB);

    assert.equal(keyA.extractable, false, 'Derived key must be non-extractable');
    assert.equal(keyA.algorithm.name, 'AES-GCM');

    // Determinism test: encrypt with keyA, verify another key derived from same sigA can decrypt
    const keyA2 = await deriveKeyFromSignature(sigA);
    const plaintext = new TextEncoder().encode('Sensitive Patient Health Record');
    const encrypted = await encryptRecord(plaintext, keyA);
    const decrypted = await decryptRecord(encrypted, keyA2);
    assert.equal(new TextDecoder().decode(decrypted), 'Sensitive Patient Health Record');

    // Distinctness test: keyB must fail to decrypt payload encrypted with keyA
    await assert.rejects(async () => {
      await decryptRecord(encrypted, keyB);
    }, 'Different signature keys must fail GCM auth tag validation');

    assert.ok(getKeyDerivationMessage().includes('SmartCareHub'));
  });

  // Test T2.2
  test('T2.2: Record Encryption — round-trip, tampering detection, content hash', async () => {
    // Generate a test AES-GCM key
    const key = await globalThis.crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    const message = 'Blood Pressure: 120/80 mmHg, Heart Rate: 72 bpm';
    const plaintext = new TextEncoder().encode(message);

    const encrypted = await encryptRecord(plaintext, key);
    assert.ok(encrypted instanceof Uint8Array);
    assert.equal(encrypted.length, 12 + plaintext.length + 16, 'Length must be IV(12) + ciphertext + tag(16)');

    // Decrypt
    const decrypted = await decryptRecord(encrypted, key);
    assert.equal(new TextDecoder().decode(decrypted), message);

    // Tampering test: corrupt a single byte in ciphertext
    const tampered = new Uint8Array(encrypted);
    tampered[15] ^= 0xff; // flip bits in ciphertext
    await assert.rejects(async () => {
      await decryptRecord(tampered, key);
    }, 'Tampered ciphertext must fail authentication tag check');

    // Content hash test
    const hash = await computeContentHash(encrypted);
    assert.equal(hash.length, 32, 'SHA-256 hash must be 32 bytes');
    const hex = bytesToHex(hash);
    assert.ok(hex.startsWith('0x'));
    assert.deepEqual(hexToBytes(hex), hash);
  });

  // Test T2.3
  test('T2.3: Delegation Key Re-Encryption — Alice to Bob key wrapping and unwrapping', async () => {
    // Generate Bob's ECDH keypair
    const bobKeyPair = await generateECDHKeyPair();
    const bobPubJwk = await globalThis.crypto.subtle.exportKey('jwk', bobKeyPair.publicKey);

    // Alice has raw master key bytes (e.g. 32 bytes)
    const masterKeyBytes = globalThis.crypto.getRandomValues(new Uint8Array(32));

    // Alice encrypts her key for Bob
    const packed = await encryptKeyForDelegate(masterKeyBytes, bobPubJwk);
    assert.ok(packed.length > 32);

    // Bob unwraps Alice's key using Bob's private key
    const bobUnwrappedKey = await decryptDelegatedKey(packed, bobKeyPair.privateKey);
    assert.equal(bobUnwrappedKey.extractable, false);

    // Test that Alice's key (imported directly) and Bob's unwrapped key are identical in function
    const aliceMasterKey = await globalThis.crypto.subtle.importKey(
      'raw',
      masterKeyBytes,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    const secretPayload = new TextEncoder().encode('Alice Diagnosis: All Clear');
    const encryptedByAlice = await encryptRecord(secretPayload, aliceMasterKey);

    // Bob decrypts Alice's record using the unwrapped key
    const decryptedByBob = await decryptRecord(encryptedByAlice, bobUnwrappedKey);
    assert.equal(new TextDecoder().decode(decryptedByBob), 'Alice Diagnosis: All Clear');

    // Charlie (unauthorized third party) tries to unwrap Alice's key
    const charlieKeyPair = await generateECDHKeyPair();
    await assert.rejects(async () => {
      await decryptDelegatedKey(packed, charlieKeyPair.privateKey);
    }, 'Unauthorized private key must fail key unwrapping');
  });

  // Test T2.4
  test('T2.4: EIP-712 Dosage Signing — typed data domain & payload format', async () => {
    const { signDosageEvent, getDosageDomain, DOSAGE_TYPES } = await import('../src/adherenceSign.js');

    const contractAddress = '0x1111111111111111111111111111111111111111';
    const domain = getDosageDomain(contractAddress, 11155111);
    assert.equal(domain.name, 'SmartCareHub.AdherenceLogger');
    assert.equal(domain.chainId, 11155111);
    assert.equal(domain.verifyingContract, contractAddress);

    let recordedParams = null;
    const mockWalletClient = {
      account: { address: '0x9999999999999999999999999999999999999999' },
      signTypedData: async (params) => {
        recordedParams = params;
        return '0x' + '00'.repeat(65); // 65-byte mock signature
      },
    };

    const payload = {
      medicationId: 'MED-METFORMIN-500',
      scheduledAt: 1730000000n,
      confirmedAt: 1730000050n,
    };

    const signature = await signDosageEvent(mockWalletClient, contractAddress, payload);
    assert.equal(signature.length, 132); // '0x' + 130 hex chars = 65 bytes
    assert.equal(recordedParams.primaryType, 'DosageEvent');
    assert.deepEqual(recordedParams.types, DOSAGE_TYPES);
    assert.deepEqual(recordedParams.message, payload);
  });
});
