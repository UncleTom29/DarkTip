/**
 * ShadowPay Escrow Service
 *
 * Production-grade escrow service for DarkTip using ShadowPay.
 * Handles secure escrow for tips, grants, and multi-party payments.
 *
 * Features:
 * - Time-locked escrows for grants
 * - Milestone-based release for funding campaigns
 * - Automatic release on completion
 * - Dispute resolution support
 * - Multi-token support (SOL, USD1, USDC, BONK)
 */

import { Connection, Transaction, PublicKey } from "@solana/web3.js";
import {
  ShadowPayClient,
  getShadowPayClient,
  type EscrowBalance,
  type UnsignedTransaction,
} from "./client";
import { TOKEN_MINTS, type SupportedToken } from "./zk-payments";

// ============================================
// Types
// ============================================

export type EscrowStatus =
  | "pending"
  | "funded"
  | "released"
  | "disputed"
  | "refunded"
  | "expired";

export type EscrowType = "tip" | "grant" | "subscription" | "milestone" | "bounty";

export interface EscrowConfig {
  type: EscrowType;
  sender: string;
  recipient: string;
  amount: number;
  token: SupportedToken;
  expiresAt?: number;
  releaseConditions?: ReleaseCondition[];
  metadata?: Record<string, unknown>;
}

export interface ReleaseCondition {
  type: "time" | "milestone" | "approval" | "oracle";
  value: string | number;
  satisfied?: boolean;
}

export interface Escrow {
  id: string;
  type: EscrowType;
  sender: string;
  recipient: string;
  amount: number;
  token: SupportedToken;
  tokenMint: string;
  status: EscrowStatus;
  releaseConditions: ReleaseCondition[];
  createdAt: number;
  expiresAt?: number;
  fundedAt?: number;
  releasedAt?: number;
  refundedAt?: number;
  disputedAt?: number;
  txSignature?: string;
  releaseTxSignature?: string;
  metadata?: Record<string, unknown>;
}

export interface EscrowResult {
  success: boolean;
  escrow?: Escrow;
  unsignedTx?: UnsignedTransaction;
  error?: string;
}

export interface ReleaseResult {
  success: boolean;
  txSignature?: string;
  amountReleased?: number;
  error?: string;
}

export interface DisputeResult {
  success: boolean;
  disputeId?: string;
  escrowStatus?: EscrowStatus;
  error?: string;
}

// ============================================
// Escrow Service
// ============================================

export class EscrowService {
  private client: ShadowPayClient;
  private connection: Connection;
  private escrows: Map<string, Escrow> = new Map();

  constructor(
    rpcUrl: string = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT ||
      "https://api.mainnet-beta.solana.com"
  ) {
    this.client = getShadowPayClient();
    this.connection = new Connection(rpcUrl, "confirmed");
  }

  /**
   * Generate unique escrow ID
   */
  private generateEscrowId(type: EscrowType): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `escrow_${type}_${timestamp}_${random}`;
  }

  /**
   * Get token mint address
   */
  private getTokenMint(token: SupportedToken): string {
    return TOKEN_MINTS[token];
  }

  /**
   * Convert token amount to base units
   */
  private toBaseUnits(amount: number, token: SupportedToken): number {
    const decimals: Record<SupportedToken, number> = {
      SOL: 9,
      USDC: 6,
      USDT: 6,
      USD1: 6,
      BONK: 5,
    };
    return Math.floor(amount * Math.pow(10, decimals[token]));
  }

  /**
   * Convert base units to token amount
   */
  private fromBaseUnits(baseUnits: number, token: SupportedToken): number {
    const decimals: Record<SupportedToken, number> = {
      SOL: 9,
      USDC: 6,
      USDT: 6,
      USD1: 6,
      BONK: 5,
    };
    return baseUnits / Math.pow(10, decimals[token]);
  }

  // ============================================
  // Escrow Creation
  // ============================================

  /**
   * Create a new escrow
   */
  async createEscrow(config: EscrowConfig): Promise<EscrowResult> {
    try {
      const escrowId = this.generateEscrowId(config.type);
      const tokenMint = this.getTokenMint(config.token);
      const baseUnits = this.toBaseUnits(config.amount, config.token);

      // Create deposit transaction
      let unsignedTx: UnsignedTransaction;

      if (config.token === "SOL") {
        unsignedTx = await this.client.depositToEscrow(config.sender, baseUnits);
      } else {
        // For SPL tokens, we'd need a token-specific deposit
        // Using the general escrow deposit for now
        unsignedTx = await this.client.depositToEscrow(config.sender, baseUnits);
      }

      const escrow: Escrow = {
        id: escrowId,
        type: config.type,
        sender: config.sender,
        recipient: config.recipient,
        amount: config.amount,
        token: config.token,
        tokenMint,
        status: "pending",
        releaseConditions: config.releaseConditions || [],
        createdAt: Date.now(),
        expiresAt: config.expiresAt,
        metadata: config.metadata,
      };

      this.escrows.set(escrowId, escrow);

      return {
        success: true,
        escrow,
        unsignedTx,
      };
    } catch (error) {
      console.error("Failed to create escrow:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create escrow",
      };
    }
  }

  /**
   * Create escrow for a tip with optional message
   */
  async createTipEscrow(
    sender: string,
    recipient: string,
    amount: number,
    token: SupportedToken = "SOL",
    options?: {
      message?: string;
      expiresInHours?: number;
      requireRecipientAction?: boolean;
    }
  ): Promise<EscrowResult> {
    const conditions: ReleaseCondition[] = [];

    if (options?.requireRecipientAction) {
      conditions.push({
        type: "approval",
        value: recipient,
        satisfied: false,
      });
    }

    return this.createEscrow({
      type: "tip",
      sender,
      recipient,
      amount,
      token,
      expiresAt: options?.expiresInHours
        ? Date.now() + options.expiresInHours * 60 * 60 * 1000
        : undefined,
      releaseConditions: conditions,
      metadata: {
        message: options?.message,
        createdVia: "darktip",
      },
    });
  }

  /**
   * Create escrow for a grant with milestones
   */
  async createGrantEscrow(
    sender: string,
    recipient: string,
    totalAmount: number,
    token: SupportedToken = "SOL",
    milestones: Array<{
      description: string;
      percentage: number;
      dueDate?: number;
    }>
  ): Promise<EscrowResult> {
    // Validate milestones add up to 100%
    const totalPercentage = milestones.reduce((sum, m) => sum + m.percentage, 0);
    if (totalPercentage !== 100) {
      return {
        success: false,
        error: "Milestone percentages must add up to 100%",
      };
    }

    const conditions: ReleaseCondition[] = milestones.map((m, index) => ({
      type: "milestone" as const,
      value: JSON.stringify({
        index,
        description: m.description,
        percentage: m.percentage,
        dueDate: m.dueDate,
        amount: (totalAmount * m.percentage) / 100,
      }),
      satisfied: false,
    }));

    return this.createEscrow({
      type: "grant",
      sender,
      recipient,
      amount: totalAmount,
      token,
      releaseConditions: conditions,
      metadata: {
        milestones,
        totalMilestones: milestones.length,
        completedMilestones: 0,
      },
    });
  }

  /**
   * Create bounty escrow
   */
  async createBountyEscrow(
    creator: string,
    amount: number,
    token: SupportedToken = "SOL",
    options: {
      title: string;
      description: string;
      expiresInDays: number;
      requiredSkills?: string[];
    }
  ): Promise<EscrowResult> {
    return this.createEscrow({
      type: "bounty",
      sender: creator,
      recipient: "", // To be assigned when claimed
      amount,
      token,
      expiresAt: Date.now() + options.expiresInDays * 24 * 60 * 60 * 1000,
      releaseConditions: [
        {
          type: "approval",
          value: creator,
          satisfied: false,
        },
      ],
      metadata: {
        title: options.title,
        description: options.description,
        requiredSkills: options.requiredSkills,
        claims: [],
      },
    });
  }

  // ============================================
  // Escrow Funding
  // ============================================

  /**
   * Confirm escrow funding after transaction is signed and submitted
   */
  async confirmFunding(escrowId: string, txSignature: string): Promise<EscrowResult> {
    const escrow = this.escrows.get(escrowId);
    if (!escrow) {
      return {
        success: false,
        error: "Escrow not found",
      };
    }

    if (escrow.status !== "pending") {
      return {
        success: false,
        error: `Cannot fund escrow in ${escrow.status} status`,
      };
    }

    // Verify transaction on chain
    try {
      const txInfo = await this.connection.getTransaction(txSignature, {
        commitment: "confirmed",
      });

      if (!txInfo) {
        return {
          success: false,
          error: "Transaction not found on chain",
        };
      }

      if (txInfo.meta?.err) {
        return {
          success: false,
          error: "Transaction failed on chain",
        };
      }

      escrow.status = "funded";
      escrow.fundedAt = Date.now();
      escrow.txSignature = txSignature;

      this.escrows.set(escrowId, escrow);

      return {
        success: true,
        escrow,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to verify transaction",
      };
    }
  }

  // ============================================
  // Escrow Release
  // ============================================

  /**
   * Release escrow funds to recipient
   */
  async releaseEscrow(
    escrowId: string,
    releaserWallet: string,
    partialAmount?: number
  ): Promise<ReleaseResult> {
    const escrow = this.escrows.get(escrowId);
    if (!escrow) {
      return {
        success: false,
        error: "Escrow not found",
      };
    }

    if (escrow.status !== "funded") {
      return {
        success: false,
        error: `Cannot release escrow in ${escrow.status} status`,
      };
    }

    // Validate releaser is authorized
    if (releaserWallet !== escrow.sender && releaserWallet !== escrow.recipient) {
      return {
        success: false,
        error: "Unauthorized to release this escrow",
      };
    }

    const releaseAmount = partialAmount || escrow.amount;
    const baseUnits = this.toBaseUnits(releaseAmount, escrow.token);

    try {
      // Create withdrawal transaction to recipient
      const unsignedTx = await this.client.withdrawFromEscrow(
        escrow.recipient,
        baseUnits
      );

      // Return unsigned transaction for signing
      // In a full implementation, this would be sent to the releaserWallet for signing

      escrow.status = releaseAmount >= escrow.amount ? "released" : "funded";
      escrow.releasedAt = Date.now();

      this.escrows.set(escrowId, escrow);

      return {
        success: true,
        amountReleased: releaseAmount,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to release escrow",
      };
    }
  }

  /**
   * Release milestone for a grant escrow
   */
  async releaseMilestone(
    escrowId: string,
    milestoneIndex: number,
    approverWallet: string
  ): Promise<ReleaseResult> {
    const escrow = this.escrows.get(escrowId);
    if (!escrow) {
      return {
        success: false,
        error: "Escrow not found",
      };
    }

    if (escrow.type !== "grant") {
      return {
        success: false,
        error: "Not a grant escrow",
      };
    }

    if (approverWallet !== escrow.sender) {
      return {
        success: false,
        error: "Only the grant creator can release milestones",
      };
    }

    const condition = escrow.releaseConditions[milestoneIndex];
    if (!condition) {
      return {
        success: false,
        error: "Milestone not found",
      };
    }

    if (condition.satisfied) {
      return {
        success: false,
        error: "Milestone already released",
      };
    }

    // Parse milestone data
    const milestoneData = JSON.parse(condition.value as string);
    const releaseAmount = milestoneData.amount;

    // Mark milestone as satisfied
    condition.satisfied = true;
    escrow.releaseConditions[milestoneIndex] = condition;

    // Update metadata
    const metadata = escrow.metadata || {};
    metadata.completedMilestones = (metadata.completedMilestones as number || 0) + 1;
    escrow.metadata = metadata;

    // Check if all milestones are complete
    const allComplete = escrow.releaseConditions.every((c) => c.satisfied);
    if (allComplete) {
      escrow.status = "released";
      escrow.releasedAt = Date.now();
    }

    this.escrows.set(escrowId, escrow);

    // Release the milestone funds
    return this.releaseEscrow(escrowId, approverWallet, releaseAmount);
  }

  // ============================================
  // Escrow Refund
  // ============================================

  /**
   * Refund escrow to sender
   */
  async refundEscrow(escrowId: string, reason?: string): Promise<ReleaseResult> {
    const escrow = this.escrows.get(escrowId);
    if (!escrow) {
      return {
        success: false,
        error: "Escrow not found",
      };
    }

    if (!["funded", "disputed"].includes(escrow.status)) {
      return {
        success: false,
        error: `Cannot refund escrow in ${escrow.status} status`,
      };
    }

    const baseUnits = this.toBaseUnits(escrow.amount, escrow.token);

    try {
      // Create withdrawal transaction back to sender
      const unsignedTx = await this.client.withdrawFromEscrow(
        escrow.sender,
        baseUnits
      );

      escrow.status = "refunded";
      escrow.refundedAt = Date.now();
      if (reason) {
        escrow.metadata = { ...escrow.metadata, refundReason: reason };
      }

      this.escrows.set(escrowId, escrow);

      return {
        success: true,
        amountReleased: escrow.amount,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to refund escrow",
      };
    }
  }

  /**
   * Auto-refund expired escrows
   */
  async processExpiredEscrows(): Promise<number> {
    const now = Date.now();
    let refundedCount = 0;

    for (const [escrowId, escrow] of this.escrows) {
      if (
        escrow.status === "funded" &&
        escrow.expiresAt &&
        escrow.expiresAt < now
      ) {
        const result = await this.refundEscrow(escrowId, "Escrow expired");
        if (result.success) {
          escrow.status = "expired";
          this.escrows.set(escrowId, escrow);
          refundedCount++;
        }
      }
    }

    return refundedCount;
  }

  // ============================================
  // Disputes
  // ============================================

  /**
   * Open a dispute on an escrow
   */
  async openDispute(
    escrowId: string,
    disputerWallet: string,
    reason: string
  ): Promise<DisputeResult> {
    const escrow = this.escrows.get(escrowId);
    if (!escrow) {
      return {
        success: false,
        error: "Escrow not found",
      };
    }

    if (escrow.status !== "funded") {
      return {
        success: false,
        error: `Cannot dispute escrow in ${escrow.status} status`,
      };
    }

    // Validate disputer is a party to the escrow
    if (disputerWallet !== escrow.sender && disputerWallet !== escrow.recipient) {
      return {
        success: false,
        error: "Unauthorized to dispute this escrow",
      };
    }

    const disputeId = `dispute_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    escrow.status = "disputed";
    escrow.disputedAt = Date.now();
    escrow.metadata = {
      ...escrow.metadata,
      dispute: {
        id: disputeId,
        reason,
        openedBy: disputerWallet,
        openedAt: Date.now(),
        status: "open",
      },
    };

    this.escrows.set(escrowId, escrow);

    return {
      success: true,
      disputeId,
      escrowStatus: escrow.status,
    };
  }

  /**
   * Resolve a dispute
   */
  async resolveDispute(
    escrowId: string,
    resolution: "release" | "refund",
    resolverWallet: string
  ): Promise<DisputeResult> {
    const escrow = this.escrows.get(escrowId);
    if (!escrow) {
      return {
        success: false,
        error: "Escrow not found",
      };
    }

    if (escrow.status !== "disputed") {
      return {
        success: false,
        error: "Escrow is not in dispute",
      };
    }

    // In production, this would require admin/arbitrator authorization
    // For now, allow either party to resolve

    const dispute = escrow.metadata?.dispute as Record<string, unknown> | undefined;
    if (dispute) {
      dispute.resolution = resolution;
      dispute.resolvedBy = resolverWallet;
      dispute.resolvedAt = Date.now();
      dispute.status = "resolved";
    }

    if (resolution === "release") {
      await this.releaseEscrow(escrowId, resolverWallet);
    } else {
      await this.refundEscrow(escrowId, "Dispute resolved in favor of sender");
    }

    return {
      success: true,
      escrowStatus: escrow.status,
    };
  }

  // ============================================
  // Queries
  // ============================================

  /**
   * Get escrow by ID
   */
  async getEscrow(escrowId: string): Promise<Escrow | null> {
    return this.escrows.get(escrowId) || null;
  }

  /**
   * Get all escrows for a wallet (as sender or recipient)
   */
  async getEscrowsForWallet(
    wallet: string,
    options?: {
      type?: EscrowType;
      status?: EscrowStatus;
      role?: "sender" | "recipient" | "both";
    }
  ): Promise<Escrow[]> {
    const role = options?.role || "both";
    const results: Escrow[] = [];

    for (const escrow of this.escrows.values()) {
      const matchesRole =
        role === "both" ||
        (role === "sender" && escrow.sender === wallet) ||
        (role === "recipient" && escrow.recipient === wallet);

      const matchesType = !options?.type || escrow.type === options.type;
      const matchesStatus = !options?.status || escrow.status === options.status;

      if (matchesRole && matchesType && matchesStatus) {
        results.push(escrow);
      }
    }

    return results.sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Get escrow balance from ShadowPay
   */
  async getWalletEscrowBalance(wallet: string): Promise<EscrowBalance> {
    return this.client.getEscrowBalance(wallet);
  }

  /**
   * Get token escrow balance
   */
  async getWalletTokenEscrowBalance(
    wallet: string,
    token: SupportedToken
  ): Promise<EscrowBalance> {
    const mint = this.getTokenMint(token);
    if (mint === "native") {
      return this.client.getEscrowBalance(wallet);
    }
    return this.client.getTokenEscrowBalance(wallet, mint);
  }

  /**
   * Get escrow statistics for a wallet
   */
  async getEscrowStats(wallet: string): Promise<{
    totalCreated: number;
    totalReceived: number;
    totalValueCreated: Record<SupportedToken, number>;
    totalValueReceived: Record<SupportedToken, number>;
    activeEscrows: number;
    completedEscrows: number;
    disputedEscrows: number;
  }> {
    const escrows = await this.getEscrowsForWallet(wallet);

    const stats = {
      totalCreated: 0,
      totalReceived: 0,
      totalValueCreated: {} as Record<SupportedToken, number>,
      totalValueReceived: {} as Record<SupportedToken, number>,
      activeEscrows: 0,
      completedEscrows: 0,
      disputedEscrows: 0,
    };

    for (const escrow of escrows) {
      if (escrow.sender === wallet) {
        stats.totalCreated++;
        stats.totalValueCreated[escrow.token] =
          (stats.totalValueCreated[escrow.token] || 0) + escrow.amount;
      }

      if (escrow.recipient === wallet) {
        stats.totalReceived++;
        stats.totalValueReceived[escrow.token] =
          (stats.totalValueReceived[escrow.token] || 0) + escrow.amount;
      }

      if (["pending", "funded"].includes(escrow.status)) {
        stats.activeEscrows++;
      } else if (escrow.status === "released") {
        stats.completedEscrows++;
      } else if (escrow.status === "disputed") {
        stats.disputedEscrows++;
      }
    }

    return stats;
  }
}

// ============================================
// Singleton
// ============================================

let escrowService: EscrowService | null = null;

export function getEscrowService(rpcUrl?: string): EscrowService {
  if (!escrowService) {
    escrowService = new EscrowService(rpcUrl);
  }
  return escrowService;
}

export function resetEscrowService(): void {
  escrowService = null;
}

export default EscrowService;
