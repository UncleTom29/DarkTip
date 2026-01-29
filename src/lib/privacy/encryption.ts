/**
 * End-to-End Encryption for Messages
 *
 * Uses NaCl box encryption (X25519 + XSalsa20-Poly1305)
 * for secure message passing between supporters and creators.
 */

import nacl from "tweetnacl";
import bs58 from "bs58";

export interface EncryptedPayload {
  ciphertext: string;    // Base58 encoded ciphertext
  nonce: string;         // Base58 encoded nonce
  ephemeralPubKey: string; // Base58 encoded ephemeral public key
}

export interface EncryptionKeyPair {
  publicKey: string;
  secretKey: Uint8Array;
}

/**
 * Generate an encryption key pair for a user
 */
export function generateEncryptionKeyPair(): EncryptionKeyPair {
  const keyPair = nacl.box.keyPair();
  return {
    publicKey: bs58.encode(keyPair.publicKey),
    secretKey: keyPair.secretKey,
  };
}

/**
 * Encrypt a message for a recipient using their public key
 * Creates a new ephemeral key pair for each message (forward secrecy)
 */
export function encryptMessage(
  message: string,
  recipientPublicKey: string
): EncryptedPayload {
  // Generate ephemeral key pair for this message
  const ephemeralKeyPair = nacl.box.keyPair();

  // Decode recipient's public key
  const recipientPubKey = bs58.decode(recipientPublicKey);

  // Generate random nonce
  const nonce = nacl.randomBytes(nacl.box.nonceLength);

  // Convert message to Uint8Array
  const messageBytes = new TextEncoder().encode(message);

  // Encrypt the message
  const ciphertext = nacl.box(
    messageBytes,
    nonce,
    recipientPubKey,
    ephemeralKeyPair.secretKey
  );

  return {
    ciphertext: bs58.encode(ciphertext),
    nonce: bs58.encode(nonce),
    ephemeralPubKey: bs58.encode(ephemeralKeyPair.publicKey),
  };
}

/**
 * Decrypt a message using the recipient's secret key
 */
export function decryptMessage(
  payload: EncryptedPayload,
  recipientSecretKey: Uint8Array
): string | null {
  try {
    const ciphertext = bs58.decode(payload.ciphertext);
    const nonce = bs58.decode(payload.nonce);
    const senderPubKey = bs58.decode(payload.ephemeralPubKey);

    const messageBytes = nacl.box.open(
      ciphertext,
      nonce,
      senderPubKey,
      recipientSecretKey
    );

    if (!messageBytes) {
      return null;
    }

    return new TextDecoder().decode(messageBytes);
  } catch (error) {
    console.error("Decryption failed:", error);
    return null;
  }
}

/**
 * Encrypt data symmetrically (for local storage)
 */
export function encryptSymmetric(data: string, key: Uint8Array): string {
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
  const messageBytes = new TextEncoder().encode(data);
  const ciphertext = nacl.secretbox(messageBytes, nonce, key);

  // Combine nonce + ciphertext
  const combined = new Uint8Array(nonce.length + ciphertext.length);
  combined.set(nonce);
  combined.set(ciphertext, nonce.length);

  return bs58.encode(combined);
}

/**
 * Decrypt symmetrically encrypted data
 */
export function decryptSymmetric(
  encryptedData: string,
  key: Uint8Array
): string | null {
  try {
    const combined = bs58.decode(encryptedData);
    const nonce = combined.slice(0, nacl.secretbox.nonceLength);
    const ciphertext = combined.slice(nacl.secretbox.nonceLength);

    const messageBytes = nacl.secretbox.open(ciphertext, nonce, key);

    if (!messageBytes) {
      return null;
    }

    return new TextDecoder().decode(messageBytes);
  } catch (error) {
    console.error("Symmetric decryption failed:", error);
    return null;
  }
}

/**
 * Generate a random encryption key
 */
export function generateSymmetricKey(): Uint8Array {
  return nacl.randomBytes(nacl.secretbox.keyLength);
}

/**
 * Hash data using SHA-512
 */
export function hashData(data: string): string {
  const bytes = new TextEncoder().encode(data);
  const hash = nacl.hash(bytes);
  return bs58.encode(hash);
}
