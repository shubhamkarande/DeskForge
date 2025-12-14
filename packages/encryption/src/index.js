"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.encrypt = encrypt;
exports.decrypt = decrypt;
exports.generateKey = generateKey;
exports.hash = hash;
const crypto = __importStar(require("crypto"));
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
function getKey(salt) {
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
function encrypt(plaintext) {
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
function decrypt(ciphertext) {
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
function generateKey() {
    return crypto.randomBytes(32).toString('hex');
}
/**
 * Hash a value using SHA-256 (for non-reversible hashing)
 */
function hash(value) {
    return crypto.createHash('sha256').update(value).digest('hex');
}
//# sourceMappingURL=index.js.map