/**
 * Zero-Knowledge Proof Generator
 *
 * This module generates ZK proofs for supporter claims:
 * - Binary Support Proof: "I tipped Creator X at least once"
 * - Tier Support Proof: "My total tips are in tier Y"
 * - Aggregate Support Proof: "I tipped total amount across all creators"
 * - Time-bound Support Proof: "I tipped Creator X in the last N days"
 *
 * In production, this would use Noir or Circom circuits.
 * This implementation simulates the proof generation process.
 */

import { v4 as uuidv4 } from "uuid";
import nacl from "tweetnacl";
import bs58 from "bs58";
import type { ProofType, SupporterTier, ZKProof, ProofPublicInputs } from "@/types";
import { SUPPORTER_TIERS } from "@/config/constants";

export interface TipRecord {
  tipId: string;
  creatorId: string;
  amountLamports: number;
  timestamp: number;
  transactionSignature: string;
}

export interface ProofGenerationParams {
  proofType: ProofType;
  creatorId?: string;
  tier?: SupporterTier;
  timeWindowDays?: number;
  tipRecords: TipRecord[];
  supporterWallet: string;
}

export interface GeneratedProof {
  proofId: string;
  proofType: ProofType;
  proofData: string;
  publicInputs: ProofPublicInputs;
  tier?: SupporterTier;
  creatorId?: string;
  generatedAt: number;
  expiresAt: number;
}

/**
 * Generate a ZK proof based on the specified parameters
 */
export async function generateProof(
  params: ProofGenerationParams
): Promise<GeneratedProof> {
  const { proofType, creatorId, tier, timeWindowDays, tipRecords, supporterWallet } = params;

  // Validate inputs
  validateProofParams(params);

  // Filter relevant tips based on proof type
  const relevantTips = filterTipsForProof(tipRecords, proofType, creatorId, timeWindowDays);

  if (relevantTips.length === 0) {
    throw new Error("No qualifying tips found for this proof");
  }

  // Calculate total amount for tier determination
  const totalAmount = relevantTips.reduce((sum, tip) => sum + tip.amountLamports, 0);
  const totalSOL = totalAmount / 1e9;

  // Determine tier if tier proof
  const determinedTier = tier || determineTierFromAmount(totalSOL);

  // Verify tier eligibility
  if (proofType === "tier_support" && tier) {
    const tierMin = SUPPORTER_TIERS[tier].min * 1e9;
    if (totalAmount < tierMin) {
      throw new Error(`Insufficient total tips for ${tier} tier`);
    }
  }

  // Generate the proof
  const proofId = `proof_${uuidv4().replace(/-/g, "")}`;
  const generatedAt = Date.now();
  const expiresAt = generatedAt + 30 * 24 * 60 * 60 * 1000; // 30 days

  // Create proof hash (commitment to the private data)
  const proofHash = createProofHash(supporterWallet, relevantTips, generatedAt);

  // Generate the actual proof data (simulated)
  const proofData = await generateProofData(
    proofType,
    supporterWallet,
    relevantTips,
    proofHash
  );

  const publicInputs: ProofPublicInputs = {
    creatorId: creatorId || "all_creators",
    proofType,
    tier: determinedTier,
    timestamp: generatedAt,
    proofHash,
  };

  return {
    proofId,
    proofType,
    proofData,
    publicInputs,
    tier: determinedTier,
    creatorId,
    generatedAt,
    expiresAt,
  };
}

/**
 * Validate proof generation parameters
 */
function validateProofParams(params: ProofGenerationParams): void {
  const { proofType, creatorId, tier, timeWindowDays, tipRecords } = params;

  if (tipRecords.length === 0) {
    throw new Error("No tip records provided");
  }

  if (proofType === "binary_support" || proofType === "tier_support" || proofType === "time_bound_support") {
    if (!creatorId) {
      throw new Error("Creator ID required for this proof type");
    }
  }

  if (proofType === "time_bound_support") {
    if (!timeWindowDays || timeWindowDays <= 0) {
      throw new Error("Time window required for time-bound proof");
    }
  }

  if (proofType === "tier_support" && tier) {
    if (!Object.keys(SUPPORTER_TIERS).includes(tier)) {
      throw new Error("Invalid tier specified");
    }
  }
}

/**
 * Filter tips based on proof requirements
 */
function filterTipsForProof(
  tipRecords: TipRecord[],
  proofType: ProofType,
  creatorId?: string,
  timeWindowDays?: number
): TipRecord[] {
  let filtered = [...tipRecords];

  // Filter by creator if specified
  if (creatorId) {
    filtered = filtered.filter((tip) => tip.creatorId === creatorId);
  }

  // Filter by time window if specified
  if (timeWindowDays) {
    const cutoffTime = Date.now() - timeWindowDays * 24 * 60 * 60 * 1000;
    filtered = filtered.filter((tip) => tip.timestamp >= cutoffTime);
  }

  return filtered;
}

/**
 * Determine supporter tier from total tip amount
 */
function determineTierFromAmount(totalSOL: number): SupporterTier {
  if (totalSOL >= SUPPORTER_TIERS.platinum.min) return "platinum";
  if (totalSOL >= SUPPORTER_TIERS.gold.min) return "gold";
  if (totalSOL >= SUPPORTER_TIERS.silver.min) return "silver";
  return "bronze";
}

/**
 * Create a hash commitment to the proof data
 */
function createProofHash(
  supporterWallet: string,
  tips: TipRecord[],
  timestamp: number
): string {
  const data = JSON.stringify({
    wallet: supporterWallet,
    tipCount: tips.length,
    tipIds: tips.map((t) => t.tipId),
    timestamp,
  });

  const bytes = new TextEncoder().encode(data);
  const hash = nacl.hash(bytes);
  return bs58.encode(hash.slice(0, 32));
}

/**
 * Generate the actual ZK proof data
 * In production, this would compile and run a Noir/Circom circuit
 */
async function generateProofData(
  proofType: ProofType,
  supporterWallet: string,
  tips: TipRecord[],
  proofHash: string
): Promise<string> {
  // Simulate proof generation time
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Create a simulated proof structure
  const proofStructure = {
    version: "1.0.0",
    protocol: "darktip-zkp",
    curve: "bn254",
    proofType,
    proof: {
      a: generateRandomPoint(),
      b: generateRandomPoint(),
      c: generateRandomPoint(),
    },
    publicSignals: [
      proofHash,
      String(tips.length),
      String(Date.now()),
    ],
  };

  return bs58.encode(new TextEncoder().encode(JSON.stringify(proofStructure)));
}

/**
 * Generate a random elliptic curve point (simulated)
 */
function generateRandomPoint(): string[] {
  return [
    bs58.encode(nacl.randomBytes(32)),
    bs58.encode(nacl.randomBytes(32)),
  ];
}

/**
 * Estimate proof generation time based on parameters
 */
export function estimateProofGenerationTime(
  tipCount: number,
  proofType: ProofType
): number {
  // Base time + time per tip
  const baseTime = 2000; // 2 seconds base
  const perTipTime = 100; // 0.1 seconds per tip
  const typeMultiplier: Record<ProofType, number> = {
    binary_support: 1,
    tier_support: 1.2,
    aggregate_support: 1.5,
    time_bound_support: 1.3,
  };

  return Math.round(
    (baseTime + tipCount * perTipTime) * typeMultiplier[proofType]
  );
}

/**
 * Check if a proof can be generated with current tip history
 */
export function canGenerateProof(
  params: Omit<ProofGenerationParams, "supporterWallet">
): { canGenerate: boolean; reason?: string } {
  const { proofType, creatorId, tier, timeWindowDays, tipRecords } = params;

  if (tipRecords.length === 0) {
    return { canGenerate: false, reason: "No tip history found" };
  }

  const relevantTips = filterTipsForProof(tipRecords, proofType, creatorId, timeWindowDays);

  if (relevantTips.length === 0) {
    return { canGenerate: false, reason: "No qualifying tips for this proof" };
  }

  if (tier) {
    const totalAmount = relevantTips.reduce((sum, tip) => sum + tip.amountLamports, 0);
    const totalSOL = totalAmount / 1e9;
    const tierMin = SUPPORTER_TIERS[tier].min;

    if (totalSOL < tierMin) {
      return {
        canGenerate: false,
        reason: `Need ${tierMin - totalSOL} more SOL for ${tier} tier`,
      };
    }
  }

  return { canGenerate: true };
}
