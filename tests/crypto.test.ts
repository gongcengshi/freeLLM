import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { encrypt, decrypt, generateProxyKey, hashApiKey } from '../src/utils/crypto.js';

describe('Crypto Utils', () => {
  it('should encrypt and decrypt text', () => {
    const text = 'test-api-key-12345';
    const encrypted = encrypt(text);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(text);
  });

  it('should generate unique proxy keys', () => {
    const key1 = generateProxyKey();
    const key2 = generateProxyKey();
    expect(key1).not.toBe(key2);
    expect(key1).toMatch(/^freellm-/);
  });

  it('should hash API keys', () => {
    const key = 'test-key';
    const hash = hashApiKey(key);
    expect(hash).toHaveLength(64); // SHA-256 hex length
  });

  it('should produce consistent encryption', () => {
    const text = 'consistent-test';
    const encrypted1 = encrypt(text);
    const encrypted2 = encrypt(text);
    // Different due to random IV, but both should decrypt correctly
    expect(decrypt(encrypted1)).toBe(text);
    expect(decrypt(encrypted2)).toBe(text);
  });
});
