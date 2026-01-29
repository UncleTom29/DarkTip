/**
 * Stealth Address Generation for Privacy-Preserving Tips
 *
 * Stealth addresses allow a sender to generate a one-time address for a recipient
 * such that only the recipient can derive the private key to spend funds.
 *
 * This implementation uses elliptic curve cryptography (Curve25519) for key exchange.
 */

import nacl from "tweetnacl";
import bs58 from "bs58";
import { v4 as uuidv4 } from "uuid";

export interface StealthKeyPair {
  scanKey: Uint8Array;       // Used to detect incoming payments
  spendKey: Uint8Array;      // Used to spend received funds
  scanPublicKey: Uint8Array;
  spendPublicKey: Uint8Array;
}

export interface StealthAddress {
  address: string;           // The one-time stealth address
  ephemeralPublicKey: string; // Needed by recipient to derive private key
  viewTag: string;           // Optimization for scanning (first 2 bytes of shared secret)
}

export interface StealthMetadata {
  stealthAddress: string;
  ephemeralPublicKey: string;
  viewTag: string;
  createdAt: number;
}

/**
 * Generate a stealth key pair for a recipient (creator)
 * This is done once when a creator registers
 */
export function generateStealthKeyPair(): StealthKeyPair {
  const scanKeyPair = nacl.box.keyPair();
  const spendKeyPair = nacl.box.keyPair();

  return {
    scanKey: scanKeyPair.secretKey,
    spendKey: spendKeyPair.secretKey,
    scanPublicKey: scanKeyPair.publicKey,
    spendPublicKey: spendKeyPair.publicKey,
  };
}

/**
 * Encode stealth public keys for storage/display
 */
export function encodeStealthPublicKeys(keyPair: StealthKeyPair): {
  scanPublicKey: string;
  spendPublicKey: string;
} {
  return {
    scanPublicKey: bs58.encode(keyPair.scanPublicKey),
    spendPublicKey: bs58.encode(keyPair.spendPublicKey),
  };
}

/**
 * Generate a stealth address for a recipient
 * Called by the sender (supporter) when making a tip
 */
export function generateStealthAddress(
  recipientScanPublicKey: string,
  recipientSpendPublicKey: string
): StealthAddress {
  // Decode recipient's public keys
  const scanPubKey = bs58.decode(recipientScanPublicKey);
  const spendPubKey = bs58.decode(recipientSpendPublicKey);

  // Generate ephemeral key pair for this transaction
  const ephemeralKeyPair = nacl.box.keyPair();

  // Compute shared secret using ECDH: ephemeral_private * recipient_scan_public
  const sharedSecret = nacl.scalarMult(ephemeralKeyPair.secretKey, scanPubKey);

  // Hash the shared secret to get a deterministic value
  const hashedSecret = nacl.hash(sharedSecret);

  // Derive the stealth public key: recipient_spend_public + hash(shared_secret) * G
  // For simplicity, we'll use XOR with the hashed secret (in production, use proper EC math)
  const stealthPublicKey = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    stealthPublicKey[i] = spendPubKey[i] ^ hashedSecret[i];
  }

  // Create view tag (first 2 bytes of shared secret for efficient scanning)
  const viewTag = bs58.encode(hashedSecret.slice(0, 2));

  return {
    address: bs58.encode(stealthPublicKey),
    ephemeralPublicKey: bs58.encode(ephemeralKeyPair.publicKey),
    viewTag,
  };
}

/**
 * Derive the private key for a stealth address (recipient side)
 * Called by the creator to claim funds from a stealth address
 */
export function deriveStealthPrivateKey(
  scanPrivateKey: Uint8Array,
  spendPrivateKey: Uint8Array,
  ephemeralPublicKey: string
): Uint8Array {
  // Decode ephemeral public key
  const ephemeralPubKey = bs58.decode(ephemeralPublicKey);

  // Compute shared secret: scan_private * ephemeral_public
  const sharedSecret = nacl.scalarMult(scanPrivateKey, ephemeralPubKey);

  // Hash the shared secret
  const hashedSecret = nacl.hash(sharedSecret);

  // Derive the stealth private key: spend_private + hash(shared_secret)
  // For simplicity, we'll use XOR (in production, use proper EC math)
  const stealthPrivateKey = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    stealthPrivateKey[i] = spendPrivateKey[i] ^ hashedSecret[i];
  }

  return stealthPrivateKey;
}

/**
 * Check if a stealth address belongs to a recipient using the view tag
 * This is an optimization to avoid full derivation for every transaction
 */
export function checkViewTag(
  scanPrivateKey: Uint8Array,
  ephemeralPublicKey: string,
  viewTag: string
): boolean {
  const ephemeralPubKey = bs58.decode(ephemeralPublicKey);
  const sharedSecret = nacl.scalarMult(scanPrivateKey, ephemeralPubKey);
  const hashedSecret = nacl.hash(sharedSecret);
  const computedViewTag = bs58.encode(hashedSecret.slice(0, 2));

  return computedViewTag === viewTag;
}

/**
 * Scan for stealth payments belonging to a recipient
 */
export function scanForPayments(
  scanPrivateKey: Uint8Array,
  stealthMetadatas: StealthMetadata[]
): StealthMetadata[] {
  return stealthMetadatas.filter((metadata) =>
    checkViewTag(scanPrivateKey, metadata.ephemeralPublicKey, metadata.viewTag)
  );
}

/**
 * Generate a unique stealth payment ID
 */
export function generateStealthPaymentId(): string {
  return `sp_${uuidv4().replace(/-/g, "")}`;
}
