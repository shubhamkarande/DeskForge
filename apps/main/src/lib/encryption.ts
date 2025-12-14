import * as crypto from 'crypto';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

/**
 * Get the encryption key from environment variable
 * Uses PBKDF2 to derive a secure key from the provided passphrase
 */
function getKey(salt: Buffer): Buffer {
    const passphrase = process.env.ENCRYPTION_KEY;

    if (!passphrase) {
        throw new Error('ENCRYPTION_KEY environment variable is not set');
    }

    return crypto.pbkdf2Sync(passphrase, salt, ITERATIONS, KEY_LENGTH, 'sha512');
}

/**
 * Encrypt a plaintext string using AES-256-GCM
 * Returns a base64-encoded string containing: salt + iv + authTag + ciphertext
 */
export function encrypt(plaintext: string): string {
    // Generate random salt and IV
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);

    // Derive key from passphrase
    const key = getKey(salt);

    // Create cipher and encrypt
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    // Get auth tag for GCM mode
    const authTag = cipher.getAuthTag();

    // Combine: salt + iv + authTag + ciphertext
    const combined = Buffer.concat([salt, iv, authTag, encrypted]);

    return combined.toString('base64');
}

/**
 * Decrypt a base64-encoded ciphertext using AES-256-GCM
 * Expects format: salt + iv + authTag + ciphertext
 */
export function decrypt(ciphertext: string): string {
    // Decode from base64
    const combined = Buffer.from(ciphertext, 'base64');

    // Extract components
    const salt = combined.subarray(0, SALT_LENGTH);
    const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const authTag = combined.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);

    // Derive key from passphrase
    const key = getKey(salt);

    // Create decipher and decrypt
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString('utf8');
}

/**
 * Generate a random encryption key (for initial setup)
 */
export function generateKey(): string {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash a value using SHA-256 (for non-reversible hashing)
 */
export function hash(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex');
}
