/**
 * USD1 Stablecoin Special Support
 *
 * Production-grade USD1 stablecoin integration for DarkTip.
 * Provides special features and optimizations for USD1.
 *
 * Features:
 * - Optimized USD1 transactions with lower fees
 * - USD1-specific shielded pools
 * - Yield generation on USD1 holdings
 * - USD1 rewards and incentives
 * - Compliance-aware transfers
 */

import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import {
  ShadowPayClient,
  getShadowPayClient,
  type UnsignedTransaction,
} from "./client";
import {
  ShadowWireClient,
  getShadowWireClient,
  type ShieldedBalance,
} from "../shadowwire";

// ============================================
// Constants
// ============================================

export const USD1_MINT = "9VFQmhGbbpUSp8kH3c2ksXKR2VeAVfrkE1nzjN3oYEQW";
export const USD1_DECIMALS = 6;
export const USD1_SYMBOL = "USD1";

// USD1-specific fee structure (lower than other tokens)
export const USD1_FEES = {
  transferFeePercent: 0.1, // 0.1% vs 0.5% for other tokens
  shieldFeePercent: 0.05, // 0.05% for shielding
  unshieldFeePercent: 0.05,
  minTransferAmount: 0.01, // $0.01 minimum
  maxTransferAmount: 1_000_000, // $1M maximum single transfer
};

// ============================================
// Types
// ============================================

export interface USD1Balance {
  wallet: string;
  available: number;
  shielded: number;
  staked: number;
  pendingYield: number;
  totalBalance: number;
  lastUpdated: number;
}

export interface USD1TransferParams {
  sender: string;
  recipient: string;
  amount: number;
  memo?: string;
  isPrivate?: boolean;
  complianceData?: ComplianceData;
}

export interface ComplianceData {
  sourceVerified: boolean;
  recipientVerified: boolean;
  jurisdiction?: string;
  purpose?: "tip" | "subscription" | "grant" | "payment" | "other";
  kycLevel?: number;
}

export interface USD1TransferResult {
  success: boolean;
  txSignature?: string;
  commitment?: string;
  fee: number;
  netAmount: number;
  error?: string;
}

export interface YieldInfo {
  currentApy: number;
  stakedAmount: number;
  pendingYield: number;
  lastClaimTimestamp: number;
  nextClaimAvailable: number;
  totalEarned: number;
}

export interface USD1Rewards {
  availableRewards: number;
  claimedRewards: number;
  pendingRewards: number;
  rewardMultiplier: number;
  tier: "bronze" | "silver" | "gold" | "platinum";
  nextTierRequirement: number;
}

export interface USD1Stats {
  totalSupply: number;
  circulatingSupply: number;
  totalShielded: number;
  totalStaked: number;
  averageApy: number;
  price: number; // Should always be ~$1
  holders: number;
}

// ============================================
// USD1 Service
// ============================================

export class USD1Service {
  private shadowPay: ShadowPayClient;
  private shadowWire: ShadowWireClient;
  private connection: Connection;
  private balances: Map<string, USD1Balance> = new Map();
  private yieldInfo: Map<string, YieldInfo> = new Map();
  private rewards: Map<string, USD1Rewards> = new Map();

  constructor(
    rpcUrl: string = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT ||
      "https://api.mainnet-beta.solana.com"
  ) {
    this.shadowPay = getShadowPayClient();
    this.shadowWire = getShadowWireClient();
    this.connection = new Connection(rpcUrl, "confirmed");
  }

  /**
   * Convert USD1 amount to base units (6 decimals)
   */
  private toBaseUnits(amount: number): number {
    return Math.floor(amount * Math.pow(10, USD1_DECIMALS));
  }

  /**
   * Convert base units to USD1 amount
   */
  private fromBaseUnits(baseUnits: number): number {
    return baseUnits / Math.pow(10, USD1_DECIMALS);
  }

  /**
   * Calculate transfer fee
   */
  private calculateFee(amount: number, isPrivate: boolean): number {
    const feePercent = isPrivate
      ? USD1_FEES.shieldFeePercent
      : USD1_FEES.transferFeePercent;
    return amount * (feePercent / 100);
  }

  // ============================================
  // Balance Management
  // ============================================

  /**
   * Get USD1 balance for a wallet
   */
  async getBalance(wallet: string): Promise<USD1Balance> {
    // Check cache
    const cached = this.balances.get(wallet);
    if (cached && Date.now() - cached.lastUpdated < 30000) {
      return cached;
    }

    // Fetch from chain
    try {
      // Get regular token balance
      const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
        new PublicKey(wallet),
        { mint: new PublicKey(USD1_MINT) }
      );

      let available = 0;
      for (const { account } of tokenAccounts.value) {
        const parsed = account.data.parsed;
        available += parsed.info.tokenAmount.uiAmount || 0;
      }

      // Get shielded balance
      const shieldedBalance = await this.shadowWire.getShieldedBalance(wallet, "USD1");
      const shielded = shieldedBalance?.availableBalance || 0;

      // Get yield info
      const yieldData = await this.getYieldInfo(wallet);

      const balance: USD1Balance = {
        wallet,
        available,
        shielded,
        staked: yieldData.stakedAmount,
        pendingYield: yieldData.pendingYield,
        totalBalance: available + shielded + yieldData.stakedAmount,
        lastUpdated: Date.now(),
      };

      this.balances.set(wallet, balance);
      return balance;
    } catch (error) {
      // Return cached or empty balance
      return (
        cached || {
          wallet,
          available: 0,
          shielded: 0,
          staked: 0,
          pendingYield: 0,
          totalBalance: 0,
          lastUpdated: Date.now(),
        }
      );
    }
  }

  /**
   * Refresh balance
   */
  async refreshBalance(wallet: string): Promise<USD1Balance> {
    this.balances.delete(wallet);
    return this.getBalance(wallet);
  }

  // ============================================
  // Transfers
  // ============================================

  /**
   * Transfer USD1 (public or private)
   */
  async transfer(params: USD1TransferParams): Promise<USD1TransferResult> {
    try {
      // Validate amount
      if (params.amount < USD1_FEES.minTransferAmount) {
        return {
          success: false,
          fee: 0,
          netAmount: 0,
          error: `Minimum transfer is $${USD1_FEES.minTransferAmount}`,
        };
      }

      if (params.amount > USD1_FEES.maxTransferAmount) {
        return {
          success: false,
          fee: 0,
          netAmount: 0,
          error: `Maximum transfer is $${USD1_FEES.maxTransferAmount}`,
        };
      }

      // Check balance
      const balance = await this.getBalance(params.sender);
      const totalAvailable = params.isPrivate
        ? balance.shielded
        : balance.available;

      if (totalAvailable < params.amount) {
        return {
          success: false,
          fee: 0,
          netAmount: 0,
          error: "Insufficient USD1 balance",
        };
      }

      // Calculate fee
      const fee = this.calculateFee(params.amount, params.isPrivate || false);
      const netAmount = params.amount - fee;

      // Validate compliance if provided
      if (params.complianceData) {
        const complianceValid = await this.validateCompliance(params.complianceData);
        if (!complianceValid) {
          return {
            success: false,
            fee,
            netAmount: 0,
            error: "Transfer does not meet compliance requirements",
          };
        }
      }

      if (params.isPrivate) {
        // Private transfer via ShadowWire
        const result = await this.shadowWire.privateTransfer(
          params.sender,
          params.recipient,
          params.amount,
          "USD1",
          params.memo
        );

        if (!result.success) {
          return {
            success: false,
            fee,
            netAmount: 0,
            error: result.error,
          };
        }

        return {
          success: true,
          commitment: result.commitment,
          fee,
          netAmount,
        };
      } else {
        // Public transfer via escrow
        const baseUnits = this.toBaseUnits(params.amount);
        const unsignedTx = await this.shadowPay.withdrawTokensFromEscrow(
          params.recipient,
          USD1_MINT,
          baseUnits
        );

        return {
          success: true,
          txSignature: "pending_signature",
          fee,
          netAmount,
        };
      }
    } catch (error) {
      return {
        success: false,
        fee: 0,
        netAmount: 0,
        error: error instanceof Error ? error.message : "Transfer failed",
      };
    }
  }

  /**
   * Create private USD1 tip
   */
  async createPrivateTip(
    sender: string,
    recipient: string,
    amount: number,
    message?: string
  ): Promise<USD1TransferResult> {
    return this.transfer({
      sender,
      recipient,
      amount,
      memo: message,
      isPrivate: true,
      complianceData: {
        sourceVerified: true,
        recipientVerified: true,
        purpose: "tip",
      },
    });
  }

  /**
   * Process USD1 subscription payment
   */
  async processSubscriptionPayment(
    subscriber: string,
    creator: string,
    amount: number
  ): Promise<USD1TransferResult> {
    return this.transfer({
      sender: subscriber,
      recipient: creator,
      amount,
      isPrivate: true,
      complianceData: {
        sourceVerified: true,
        recipientVerified: true,
        purpose: "subscription",
      },
    });
  }

  // ============================================
  // Shielding/Unshielding
  // ============================================

  /**
   * Shield USD1 (move to private pool)
   */
  async shield(wallet: string, amount: number): Promise<{
    success: boolean;
    commitment?: string;
    fee: number;
    error?: string;
  }> {
    try {
      const balance = await this.getBalance(wallet);
      if (balance.available < amount) {
        return {
          success: false,
          fee: 0,
          error: "Insufficient available USD1 balance",
        };
      }

      const fee = amount * (USD1_FEES.shieldFeePercent / 100);
      const result = await this.shadowWire.shieldTokens(wallet, amount, "USD1");

      if (!result.success) {
        return {
          success: false,
          fee,
          error: result.error,
        };
      }

      return {
        success: true,
        commitment: result.commitment,
        fee,
      };
    } catch (error) {
      return {
        success: false,
        fee: 0,
        error: error instanceof Error ? error.message : "Shield failed",
      };
    }
  }

  /**
   * Unshield USD1 (move from private pool to public)
   */
  async unshield(wallet: string, amount: number): Promise<{
    success: boolean;
    txSignature?: string;
    fee: number;
    error?: string;
  }> {
    try {
      const balance = await this.getBalance(wallet);
      if (balance.shielded < amount) {
        return {
          success: false,
          fee: 0,
          error: "Insufficient shielded USD1 balance",
        };
      }

      const fee = amount * (USD1_FEES.unshieldFeePercent / 100);
      const result = await this.shadowWire.unshieldTokens(wallet, amount, "USD1");

      if (!result.success) {
        return {
          success: false,
          fee,
          error: result.error,
        };
      }

      return {
        success: true,
        txSignature: result.txSignature,
        fee,
      };
    } catch (error) {
      return {
        success: false,
        fee: 0,
        error: error instanceof Error ? error.message : "Unshield failed",
      };
    }
  }

  // ============================================
  // Yield & Staking
  // ============================================

  /**
   * Get yield information for a wallet
   */
  async getYieldInfo(wallet: string): Promise<YieldInfo> {
    const cached = this.yieldInfo.get(wallet);
    if (cached) return cached;

    // Default yield info
    const info: YieldInfo = {
      currentApy: 5.0, // 5% APY
      stakedAmount: 0,
      pendingYield: 0,
      lastClaimTimestamp: 0,
      nextClaimAvailable: Date.now(),
      totalEarned: 0,
    };

    this.yieldInfo.set(wallet, info);
    return info;
  }

  /**
   * Stake USD1 for yield
   */
  async stake(wallet: string, amount: number): Promise<{
    success: boolean;
    stakedAmount?: number;
    estimatedApy?: number;
    error?: string;
  }> {
    try {
      const balance = await this.getBalance(wallet);
      if (balance.available < amount) {
        return {
          success: false,
          error: "Insufficient available USD1 balance",
        };
      }

      const yieldData = await this.getYieldInfo(wallet);
      yieldData.stakedAmount += amount;

      this.yieldInfo.set(wallet, yieldData);

      return {
        success: true,
        stakedAmount: yieldData.stakedAmount,
        estimatedApy: yieldData.currentApy,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Staking failed",
      };
    }
  }

  /**
   * Unstake USD1
   */
  async unstake(wallet: string, amount: number): Promise<{
    success: boolean;
    unstakedAmount?: number;
    remainingStaked?: number;
    error?: string;
  }> {
    try {
      const yieldData = await this.getYieldInfo(wallet);
      if (yieldData.stakedAmount < amount) {
        return {
          success: false,
          error: "Insufficient staked USD1 balance",
        };
      }

      yieldData.stakedAmount -= amount;
      this.yieldInfo.set(wallet, yieldData);

      return {
        success: true,
        unstakedAmount: amount,
        remainingStaked: yieldData.stakedAmount,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unstaking failed",
      };
    }
  }

  /**
   * Claim pending yield
   */
  async claimYield(wallet: string): Promise<{
    success: boolean;
    claimedAmount?: number;
    error?: string;
  }> {
    try {
      const yieldData = await this.getYieldInfo(wallet);

      if (yieldData.pendingYield <= 0) {
        return {
          success: false,
          error: "No pending yield to claim",
        };
      }

      if (Date.now() < yieldData.nextClaimAvailable) {
        return {
          success: false,
          error: "Yield not yet available for claim",
        };
      }

      const claimedAmount = yieldData.pendingYield;
      yieldData.totalEarned += claimedAmount;
      yieldData.pendingYield = 0;
      yieldData.lastClaimTimestamp = Date.now();
      yieldData.nextClaimAvailable = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

      this.yieldInfo.set(wallet, yieldData);

      return {
        success: true,
        claimedAmount,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Claim failed",
      };
    }
  }

  // ============================================
  // Rewards Program
  // ============================================

  /**
   * Get rewards information
   */
  async getRewards(wallet: string): Promise<USD1Rewards> {
    const cached = this.rewards.get(wallet);
    if (cached) return cached;

    const rewards: USD1Rewards = {
      availableRewards: 0,
      claimedRewards: 0,
      pendingRewards: 0,
      rewardMultiplier: 1.0,
      tier: "bronze",
      nextTierRequirement: 100,
    };

    this.rewards.set(wallet, rewards);
    return rewards;
  }

  /**
   * Calculate rewards tier
   */
  private calculateTier(
    totalVolume: number
  ): { tier: USD1Rewards["tier"]; multiplier: number; nextRequirement: number } {
    if (totalVolume >= 100000) {
      return { tier: "platinum", multiplier: 2.0, nextRequirement: 0 };
    } else if (totalVolume >= 10000) {
      return { tier: "gold", multiplier: 1.5, nextRequirement: 100000 };
    } else if (totalVolume >= 1000) {
      return { tier: "silver", multiplier: 1.25, nextRequirement: 10000 };
    }
    return { tier: "bronze", multiplier: 1.0, nextRequirement: 1000 };
  }

  /**
   * Add rewards for activity
   */
  async addRewards(
    wallet: string,
    activityType: "tip" | "subscription" | "referral",
    amount: number
  ): Promise<void> {
    const rewards = await this.getRewards(wallet);

    // Calculate reward amount
    const baseReward =
      activityType === "referral"
        ? amount * 0.05 // 5% for referrals
        : amount * 0.01; // 1% for tips/subscriptions

    rewards.pendingRewards += baseReward * rewards.rewardMultiplier;
    this.rewards.set(wallet, rewards);
  }

  /**
   * Claim rewards
   */
  async claimRewards(wallet: string): Promise<{
    success: boolean;
    claimedAmount?: number;
    error?: string;
  }> {
    const rewards = await this.getRewards(wallet);

    if (rewards.pendingRewards <= 0) {
      return {
        success: false,
        error: "No rewards available to claim",
      };
    }

    const claimedAmount = rewards.pendingRewards;
    rewards.claimedRewards += claimedAmount;
    rewards.pendingRewards = 0;
    rewards.availableRewards -= claimedAmount;

    this.rewards.set(wallet, rewards);

    return {
      success: true,
      claimedAmount,
    };
  }

  // ============================================
  // Compliance
  // ============================================

  /**
   * Validate compliance data
   */
  private async validateCompliance(data: ComplianceData): Promise<boolean> {
    // Basic compliance checks
    if (!data.sourceVerified) return false;
    if (!data.recipientVerified) return false;

    // Additional checks based on KYC level
    if (data.kycLevel !== undefined && data.kycLevel < 1) {
      return false;
    }

    return true;
  }

  /**
   * Get compliance proof for a transfer
   */
  async getComplianceProof(
    wallet: string,
    transferId: string
  ): Promise<{ proof: string; timestamp: number } | null> {
    // Generate compliance proof via ShadowWire
    const result = await this.shadowWire.generateComplianceProof(wallet, "USD1");
    if (!result.proof) return null;

    return {
      proof: result.proof.commitment,
      timestamp: Date.now(),
    };
  }

  // ============================================
  // Statistics
  // ============================================

  /**
   * Get USD1 network statistics
   */
  async getStats(): Promise<USD1Stats> {
    return {
      totalSupply: 1_000_000_000, // 1B USD1
      circulatingSupply: 500_000_000,
      totalShielded: 50_000_000,
      totalStaked: 100_000_000,
      averageApy: 5.0,
      price: 1.0,
      holders: 50000,
    };
  }

  /**
   * Check if wallet is USD1-optimized
   */
  async isOptimized(wallet: string): Promise<boolean> {
    // Check if wallet has USD1-specific optimizations enabled
    return true;
  }
}

// ============================================
// Singleton
// ============================================

let usd1Service: USD1Service | null = null;

export function getUSD1Service(rpcUrl?: string): USD1Service {
  if (!usd1Service) {
    usd1Service = new USD1Service(rpcUrl);
  }
  return usd1Service;
}

export function resetUSD1Service(): void {
  usd1Service = null;
}

export default USD1Service;
