import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (key) {
    return Buffer.from(key, 'hex');
  }
  // Generate a random key if not provided (for development only)
  const defaultKey = process.env.FREELLM_DEFAULT_KEY || 'freellm-dev-key-change-in-production-32c';
  return crypto.scryptSync(defaultKey, 'freellm-salt', KEY_LENGTH);
}

export function encrypt(text: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: TAG_LENGTH,
  });

  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  // Combine: iv + tag + encrypted
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

export function decrypt(encryptedText: string): string {
  const key = getEncryptionKey();
  const data = Buffer.from(encryptedText, 'base64');

  const iv = data.subarray(0, IV_LENGTH);
  const tag = data.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encrypted = data.subarray(IV_LENGTH + TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: TAG_LENGTH,
  });
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

export function generateProxyKey(): string {
  const bytes = crypto.randomBytes(24);
  return `freellm-${bytes.toString('base64url')}`;
}

export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}
