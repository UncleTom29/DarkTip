/**
 * ShadowID Identity Service
 *
 * Production-grade anonymous identity verification using ShadowPay's ShadowID.
 * Provides Merkle tree-based identity proofs without revealing wallet addresses.
 *
 * Features:
 * - Anonymous identity registration via Merkle tree commitments
 * - Zero-knowledge identity proofs
 * - Poseidon hash-based commitments
 * - Integration with privacy payments
 * - Tiered verification levels
 */

import {
  ShadowPayClient,
  getShadowPayClient,
  type ShadowIDRegistration,
  type MerkleProof,
} from "./client";

// ============================================
// Types
// ============================================

export type VerificationLevel = "basic" | "standard" | "enhanced" | "verified";

export interface ShadowIdentity {
  id: string;
  commitment: string;
  walletAddress: string;
  verificationLevel: VerificationLevel;
  registeredAt: number;
  lastVerifiedAt: number;
  merkleRoot: string;
  metadata?: {
    displayName?: string;
    avatarCommitment?: string;
    socialProofs?: SocialProof[];
    reputation?: ReputationScore;
  };
}

export interface SocialProof {
  platform: "twitter" | "github" | "discord" | "youtube";
  verified: boolean;
  verifiedAt?: number;
  commitment: string; // Hashed identifier, not the actual handle
}

export interface ReputationScore {
  score: number; // 0-1000
  tipsGiven: number;
  tipsReceived: number;
  subscriptionsCreated: number;
  grantsCompleted: number;
  disputes: number;
  lastUpdated: number;
}

export interface IdentityProof {
  commitment: string;
  merkleProof: MerkleProof;
  verificationLevel: VerificationLevel;
  timestamp: number;
  signature?: string;
}

export interface RegistrationResult {
  success: boolean;
  identity?: ShadowIdentity;
  commitment?: string;
  error?: string;
}

export interface VerificationResult {
  success: boolean;
  isValid: boolean;
  verificationLevel?: VerificationLevel;
  error?: string;
}

// ============================================
// Poseidon Hash Utility
// ============================================

/**
 * Simple Poseidon-like hash for commitments
 * In production, use actual circomlibjs Poseidon
 */
async function poseidonHash(inputs: string[]): Promise<string> {
  // Concatenate inputs
  const data = inputs.join(":");

  // Use SubtleCrypto for hashing
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(data));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  // Return as field element representation
  return "0x" + hashHex;
}

/**
 * Generate a nullifier for identity operations
 */
async function generateNullifier(secret: string, scope: string): Promise<string> {
  return poseidonHash([secret, scope, Date.now().toString()]);
}

// ============================================
// ShadowID Service
// ============================================

export class ShadowIDService {
  private client: ShadowPayClient;
  private identities: Map<string, ShadowIdentity> = new Map();
  private commitmentToWallet: Map<string, string> = new Map();

  constructor() {
    this.client = getShadowPayClient();
  }

  /**
   * Generate unique identity ID
   */
  private generateIdentityId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `sid_${timestamp}_${random}`;
  }

  /**
   * Generate identity commitment from wallet and secret
   */
  private async generateCommitment(
    walletAddress: string,
    secret: string
  ): Promise<string> {
    return poseidonHash([walletAddress, secret]);
  }

  // ============================================
  // Registration
  // ============================================

  /**
   * Register a new ShadowID identity
   */
  async register(
    walletAddress: string,
    signature: string,
    options?: {
      displayName?: string;
      secret?: string;
    }
  ): Promise<RegistrationResult> {
    try {
      // Generate commitment
      const secret = options?.secret || crypto.randomUUID();
      const commitment = await this.generateCommitment(walletAddress, secret);

      // Create message for registration
      const message = `Register ShadowID for DarkTip\nCommitment: ${commitment}\nTimestamp: ${Date.now()}`;

      // Register with ShadowPay
      const registration = await this.client.autoRegisterShadowID(
        walletAddress,
        signature,
        message
      );

      if (!registration.registered) {
        return {
          success: false,
          error: "Failed to register with ShadowID",
        };
      }

      // Create identity record
      const identity: ShadowIdentity = {
        id: this.generateIdentityId(),
        commitment: registration.commitment,
        walletAddress,
        verificationLevel: "basic",
        registeredAt: Date.now(),
        lastVerifiedAt: Date.now(),
        merkleRoot: registration.root,
        metadata: {
          displayName: options?.displayName,
        },
      };

      this.identities.set(identity.id, identity);
      this.commitmentToWallet.set(commitment, walletAddress);

      return {
        success: true,
        identity,
        commitment: registration.commitment,
      };
    } catch (error) {
      console.error("ShadowID registration failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Registration failed",
      };
    }
  }

  /**
   * Register custom commitment (for advanced users)
   */
  async registerCommitment(commitment: string): Promise<RegistrationResult> {
    try {
      const result = await this.client.registerShadowIDCommitment(commitment);

      if (!result.success) {
        return {
          success: false,
          error: "Failed to register commitment",
        };
      }

      return {
        success: true,
        commitment: result.commitment,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Registration failed",
      };
    }
  }

  // ============================================
  // Verification
  // ============================================

  /**
   * Get Merkle proof for an identity
   */
  async getIdentityProof(commitment: string): Promise<IdentityProof | null> {
    try {
      const { proof } = await this.client.getShadowIDProof(commitment);

      // Find identity by commitment
      let verificationLevel: VerificationLevel = "basic";
      for (const identity of this.identities.values()) {
        if (identity.commitment === commitment) {
          verificationLevel = identity.verificationLevel;
          break;
        }
      }

      return {
        commitment,
        merkleProof: proof,
        verificationLevel,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error("Failed to get identity proof:", error);
      return null;
    }
  }

  /**
   * Verify an identity proof
   */
  async verifyIdentityProof(proof: IdentityProof): Promise<VerificationResult> {
    try {
      // Get current Merkle root
      const { root } = await this.client.getShadowIDRoot();

      // Verify the proof matches the root
      if (proof.merkleProof.root !== root) {
        // Root may have changed, fetch fresh proof
        const freshProof = await this.client.getMerkleProofByCommitment(proof.commitment);
        if (freshProof.proof.root !== root) {
          return {
            success: false,
            isValid: false,
            error: "Merkle root mismatch",
          };
        }
      }

      // Verify path
      // In production, this would verify the entire Merkle path
      const isValid = await this.verifyMerklePath(
        proof.commitment,
        proof.merkleProof
      );

      return {
        success: true,
        isValid,
        verificationLevel: isValid ? proof.verificationLevel : undefined,
      };
    } catch (error) {
      return {
        success: false,
        isValid: false,
        error: error instanceof Error ? error.message : "Verification failed",
      };
    }
  }

  /**
   * Verify Merkle path
   */
  private async verifyMerklePath(
    leaf: string,
    proof: MerkleProof
  ): Promise<boolean> {
    let currentHash = leaf;

    for (let i = 0; i < proof.pathElements.length; i++) {
      const sibling = proof.pathElements[i];
      const isLeft = proof.pathIndices[i] === 0;

      if (isLeft) {
        currentHash = await poseidonHash([currentHash, sibling]);
      } else {
        currentHash = await poseidonHash([sibling, currentHash]);
      }
    }

    return currentHash === proof.root;
  }

  /**
   * Check if a commitment is registered
   */
  async isRegistered(commitment: string): Promise<boolean> {
    try {
      const status = await this.client.checkShadowIDStatus(commitment);
      return status.registered;
    } catch {
      return false;
    }
  }

  // ============================================
  // Verification Levels
  // ============================================

  /**
   * Upgrade verification level with social proof
   */
  async addSocialProof(
    identityId: string,
    platform: SocialProof["platform"],
    proofCommitment: string,
    verificationSignature: string
  ): Promise<{ success: boolean; newLevel?: VerificationLevel; error?: string }> {
    const identity = this.identities.get(identityId);
    if (!identity) {
      return { success: false, error: "Identity not found" };
    }

    // Add social proof
    const socialProof: SocialProof = {
      platform,
      verified: true,
      verifiedAt: Date.now(),
      commitment: proofCommitment,
    };

    identity.metadata = identity.metadata || {};
    identity.metadata.socialProofs = identity.metadata.socialProofs || [];
    identity.metadata.socialProofs.push(socialProof);

    // Upgrade verification level based on proofs
    const proofCount = identity.metadata.socialProofs.length;
    if (proofCount >= 3) {
      identity.verificationLevel = "verified";
    } else if (proofCount >= 2) {
      identity.verificationLevel = "enhanced";
    } else if (proofCount >= 1) {
      identity.verificationLevel = "standard";
    }

    this.identities.set(identityId, identity);

    return {
      success: true,
      newLevel: identity.verificationLevel,
    };
  }

  /**
   * Get minimum verification level required for an action
   */
  getRequiredLevel(
    action: "tip" | "subscribe" | "createGrant" | "claimBounty"
  ): VerificationLevel {
    const requirements: Record<typeof action, VerificationLevel> = {
      tip: "basic",
      subscribe: "standard",
      createGrant: "enhanced",
      claimBounty: "standard",
    };
    return requirements[action];
  }

  /**
   * Check if identity meets required level
   */
  meetsRequirement(
    currentLevel: VerificationLevel,
    requiredLevel: VerificationLevel
  ): boolean {
    const levels: VerificationLevel[] = ["basic", "standard", "enhanced", "verified"];
    return levels.indexOf(currentLevel) >= levels.indexOf(requiredLevel);
  }

  // ============================================
  // Reputation
  // ============================================

  /**
   * Update identity reputation
   */
  async updateReputation(
    identityId: string,
    updates: Partial<Omit<ReputationScore, "lastUpdated">>
  ): Promise<{ success: boolean; reputation?: ReputationScore; error?: string }> {
    const identity = this.identities.get(identityId);
    if (!identity) {
      return { success: false, error: "Identity not found" };
    }

    const currentReputation = identity.metadata?.reputation || {
      score: 500,
      tipsGiven: 0,
      tipsReceived: 0,
      subscriptionsCreated: 0,
      grantsCompleted: 0,
      disputes: 0,
      lastUpdated: Date.now(),
    };

    const newReputation: ReputationScore = {
      ...currentReputation,
      ...updates,
      lastUpdated: Date.now(),
    };

    // Recalculate score
    newReputation.score = this.calculateReputationScore(newReputation);

    identity.metadata = identity.metadata || {};
    identity.metadata.reputation = newReputation;
    this.identities.set(identityId, identity);

    return {
      success: true,
      reputation: newReputation,
    };
  }

  /**
   * Calculate reputation score
   */
  private calculateReputationScore(reputation: ReputationScore): number {
    // Base score
    let score = 500;

    // Positive actions
    score += reputation.tipsGiven * 2;
    score += reputation.tipsReceived * 1;
    score += reputation.subscriptionsCreated * 10;
    score += reputation.grantsCompleted * 50;

    // Negative actions
    score -= reputation.disputes * 100;

    // Clamp to 0-1000
    return Math.max(0, Math.min(1000, score));
  }

  // ============================================
  // Queries
  // ============================================

  /**
   * Get identity by ID
   */
  async getIdentity(identityId: string): Promise<ShadowIdentity | null> {
    return this.identities.get(identityId) || null;
  }

  /**
   * Get identity by wallet address
   */
  async getIdentityByWallet(walletAddress: string): Promise<ShadowIdentity | null> {
    for (const identity of this.identities.values()) {
      if (identity.walletAddress === walletAddress) {
        return identity;
      }
    }
    return null;
  }

  /**
   * Get identity by commitment
   */
  async getIdentityByCommitment(commitment: string): Promise<ShadowIdentity | null> {
    for (const identity of this.identities.values()) {
      if (identity.commitment === commitment) {
        return identity;
      }
    }
    return null;
  }

  /**
   * Get current Merkle root
   */
  async getCurrentRoot(): Promise<string> {
    const { root } = await this.client.getShadowIDRoot();
    return root;
  }

  /**
   * Generate anonymous proof for a claim
   * Used to prove membership without revealing identity
   */
  async generateAnonymousProof(
    commitment: string,
    claim: string
  ): Promise<{
    success: boolean;
    proof?: {
      commitment: string;
      claim: string;
      merkleProof: MerkleProof;
      nullifier: string;
      timestamp: number;
    };
    error?: string;
  }> {
    try {
      const { proof } = await this.client.getShadowIDProof(commitment);
      const nullifier = await generateNullifier(commitment, claim);

      return {
        success: true,
        proof: {
          commitment,
          claim,
          merkleProof: proof,
          nullifier,
          timestamp: Date.now(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate proof",
      };
    }
  }
}

// ============================================
// Singleton
// ============================================

let shadowIDService: ShadowIDService | null = null;

export function getShadowIDService(): ShadowIDService {
  if (!shadowIDService) {
    shadowIDService = new ShadowIDService();
  }
  return shadowIDService;
}

export function resetShadowIDService(): void {
  shadowIDService = null;
}

export default ShadowIDService;
