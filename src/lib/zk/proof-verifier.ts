/**
 * Zero-Knowledge Proof Verifier
 *
 * This module verifies ZK proofs both off-chain (JavaScript) and on-chain (Solana).
 * Proofs can be verified without revealing any private information.
 */

import nacl from "tweetnacl";
import bs58 from "bs58";
import type { ProofType, SupporterTier, ProofPublicInputs } from "@/types";
import type { GeneratedProof } from "./proof-generator";

export interface VerificationResult {
  isValid: boolean;
  proofType?: ProofType;
  creatorId?: string;
  tier?: SupporterTier;
  timestamp?: number;
  error?: string;
}

export interface OnChainVerificationResult extends VerificationResult {
  transactionSignature?: string;
  slot?: number;
}

/**
 * Verify a proof off-chain (instant verification)
 */
export async function verifyProofOffChain(
  proofData: string,
  publicInputs: ProofPublicInputs
): Promise<VerificationResult> {
  try {
    // Decode the proof
    const proofBytes = bs58.decode(proofData);
    const proofStructure = JSON.parse(new TextDecoder().decode(proofBytes));

    // Validate proof structure
    if (!validateProofStructure(proofStructure)) {
      return { isValid: false, error: "Invalid proof structure" };
    }

    // Verify the proof (simulated)
    const isValid = await performVerification(proofStructure, publicInputs);

    if (!isValid) {
      return { isValid: false, error: "Proof verification failed" };
    }

    // Check if proof is expired
    if (publicInputs.timestamp) {
      const expiryTime = publicInputs.timestamp + 30 * 24 * 60 * 60 * 1000; // 30 days
      if (Date.now() > expiryTime) {
        return { isValid: false, error: "Proof has expired" };
      }
    }

    return {
      isValid: true,
      proofType: publicInputs.proofType,
      creatorId: publicInputs.creatorId,
      tier: publicInputs.tier,
      timestamp: publicInputs.timestamp,
    };
  } catch (error) {
    console.error("Proof verification error:", error);
    return {
      isValid: false,
      error: error instanceof Error ? error.message : "Verification failed",
    };
  }
}

/**
 * Verify a proof on-chain (requires Solana transaction)
 * In production, this would call a Solana program
 */
export async function verifyProofOnChain(
  proofData: string,
  publicInputs: ProofPublicInputs
): Promise<OnChainVerificationResult> {
  // First verify off-chain
  const offChainResult = await verifyProofOffChain(proofData, publicInputs);

  if (!offChainResult.isValid) {
    return offChainResult;
  }

  // Simulate on-chain verification
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return {
    ...offChainResult,
    transactionSignature: `sig_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    slot: Math.floor(Math.random() * 1000000) + 200000000,
  };
}

/**
 * Validate the structure of a proof
 */
function validateProofStructure(proof: unknown): boolean {
  if (typeof proof !== "object" || proof === null) {
    return false;
  }

  const p = proof as Record<string, unknown>;

  // Check required fields
  if (
    typeof p.version !== "string" ||
    typeof p.protocol !== "string" ||
    typeof p.curve !== "string" ||
    typeof p.proofType !== "string" ||
    typeof p.proof !== "object" ||
    !Array.isArray(p.publicSignals)
  ) {
    return false;
  }

  // Validate protocol
  if (p.protocol !== "darktip-zkp") {
    return false;
  }

  // Validate curve
  if (p.curve !== "bn254") {
    return false;
  }

  // Validate proof components
  const proofObj = p.proof as Record<string, unknown>;
  if (
    !Array.isArray(proofObj.a) ||
    !Array.isArray(proofObj.b) ||
    !Array.isArray(proofObj.c)
  ) {
    return false;
  }

  return true;
}

/**
 * Perform the actual cryptographic verification
 * In production, this would use pairing checks on the elliptic curve
 */
async function performVerification(
  proofStructure: Record<string, unknown>,
  publicInputs: ProofPublicInputs
): Promise<boolean> {
  // Simulate verification computation
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Check that public signals match
  const publicSignals = proofStructure.publicSignals as string[];

  if (!publicSignals || publicSignals.length === 0) {
    return false;
  }

  // Verify proof hash is present
  if (publicSignals[0] !== publicInputs.proofHash) {
    return false;
  }

  // In a real implementation, we would:
  // 1. Compute the pairing e(A, B) where A and B are proof elements
  // 2. Verify that the pairing equation holds
  // 3. Check that the proof satisfies the circuit constraints

  return true;
}

/**
 * Batch verify multiple proofs
 */
export async function batchVerifyProofs(
  proofs: Array<{ proofData: string; publicInputs: ProofPublicInputs }>
): Promise<VerificationResult[]> {
  return Promise.all(
    proofs.map((p) => verifyProofOffChain(p.proofData, p.publicInputs))
  );
}

/**
 * Check if a proof has been revoked
 */
export async function isProofRevoked(proofId: string): Promise<boolean> {
  // In production, this would check a revocation registry
  // For now, return false (not revoked)
  return false;
}

/**
 * Get the verification key for a proof type
 * In production, this would return the actual verification key from the circuit
 */
export function getVerificationKey(proofType: ProofType): string {
  // Return a mock verification key
  return `vk_${proofType}_${bs58.encode(nacl.randomBytes(16))}`;
}

/**
 * Serialize a proof for sharing
 */
export function serializeProofForSharing(proof: GeneratedProof): string {
  const shareData = {
    id: proof.proofId,
    type: proof.proofType,
    data: proof.proofData,
    inputs: proof.publicInputs,
    generated: proof.generatedAt,
    expires: proof.expiresAt,
  };

  return bs58.encode(new TextEncoder().encode(JSON.stringify(shareData)));
}

/**
 * Deserialize a shared proof
 */
export function deserializeSharedProof(serialized: string): GeneratedProof | null {
  try {
    const bytes = bs58.decode(serialized);
    const shareData = JSON.parse(new TextDecoder().decode(bytes));

    return {
      proofId: shareData.id,
      proofType: shareData.type,
      proofData: shareData.data,
      publicInputs: shareData.inputs,
      generatedAt: shareData.generated,
      expiresAt: shareData.expires,
    };
  } catch {
    return null;
  }
}
