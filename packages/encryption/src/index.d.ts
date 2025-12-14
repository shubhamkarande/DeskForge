/**
 * Encrypt a plaintext string using AES-256-GCM
 * Returns a base64-encoded string containing: salt + iv + authTag + ciphertext
 */
export declare function encrypt(plaintext: string): string;
/**
 * Decrypt a base64-encoded ciphertext using AES-256-GCM
 * Expects format: salt + iv + authTag + ciphertext
 */
export declare function decrypt(ciphertext: string): string;
/**
 * Generate a random encryption key (for initial setup)
 */
export declare function generateKey(): string;
/**
 * Hash a value using SHA-256 (for non-reversible hashing)
 */
export declare function hash(value: string): string;
//# sourceMappingURL=index.d.ts.map