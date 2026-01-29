/**
 * Private Tipping Service
 *
 * Production-ready service for private tips on Solana combining:
 * - Privacy Cash SDK for private token transfers
 * - Arcium MPC for encrypted state and proofs
 * - Stealth addresses for recipient privacy
 *
 * Implements the Arcium "Private Subscriptions & Payments" RFP pattern.
 */

import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import {
  PrivacyCashClient,
  createPrivacyCashClient,
  type DepositResult,
  type WithdrawResult,
} from "@/lib/privacy/privacy-cash-client";
import {
  ArciumClient,
  createArciumClient,
  type TipRecord,
  type ArciumProof,
  type EncryptedAmount,
  type MilestoneProgress,
} from "@/lib/arcium";
import {
  generateStealthAddress,
  type StealthAddress,
} from "@/lib/privacy/stealth-address";

// ============================================
// Types
// ============================================

export interface TipParams {
  senderKeypair: Keypair;
  recipientId: string;
  recipientScanKey: string;
  recipientSpendKey: string;
  amount: number; // in SOL
  privacyLevel: "standard" | "enhanced" | "maximum";
  memo?: string;
  token?: "SOL" | "USDC" | "USDT";
}

export interface TipResult {
  success: boolean;
  tipRecord: TipRecord;
  transactionSignature?: string;
  stealthAddress?: string;
  proof?: ArciumProof;
  error?: string;
}

export interface SupporterBadge {
  creatorId: string;
  tier: "bronze" | "silver" | "gold" | "platinum";
  proof: ArciumProof;
  expiresAt: number;
}

export interface MilestoneContribution {
  milestoneId: string;
  amount: number;
  contributorId: string;
  isAnonymous: boolean;
}

export interface MilestoneContributionResult {
  success: boolean;
  progress: MilestoneProgress;
  transactionSignature?: string;
  proof?: ArciumProof;
  error?: string;
}

// ============================================
// Private Tipping Service
// ============================================

export class PrivateTippingService {
  private privacyCashClient: PrivacyCashClient | null = null;
  private arciumClient: ArciumClient | null = null;
  private isInitialized = false;

  private rpcUrl: string;
  private network: "mainnet" | "devnet" | "testnet";

  constructor(
    rpcUrl: string = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT ||
      "https://api.devnet.solana.com",
    network: "mainnet" | "devnet" | "testnet" = "devnet"
  ) {
    this.rpcUrl = rpcUrl;
    this.network = network;
  }

  /**
   * Initialize the service with a sender keypair
   */
  async initialize(senderKeypair: Keypair): Promise<void> {
    if (this.isInitialized) return;

    // Initialize Privacy Cash client
    this.privacyCashClient = createPrivacyCashClient({
      rpcUrl: this.rpcUrl,
      owner: senderKeypair,
      enableDebug: process.env.NODE_ENV === "development",
    });
    await this.privacyCashClient.initialize();

    // Initialize Arcium client
    this.arciumClient = createArciumClient({
      network: this.network,
      rpcUrl: this.rpcUrl,
    });
    await this.arciumClient.initialize();

    this.isInitialized = true;
  }

  /**
   * Send a private tip to a creator
   */
  async sendPrivateTip(params: TipParams): Promise<TipResult> {
    try {
      // Ensure service is initialized
      if (!this.privacyCashClient || !this.arciumClient) {
        await this.initialize(params.senderKeypair);
      }

      // Generate stealth address for maximum privacy
      let stealthAddress: StealthAddress | undefined;
      if (params.privacyLevel === "maximum") {
        stealthAddress = generateStealthAddress(
          params.recipientScanKey,
          params.recipientSpendKey
        );
      }

      // Create encrypted tip record via Arcium
      const senderId = params.senderKeypair.publicKey.toBase58();
      const tipRecord = await this.arciumClient!.createPrivateTip(
        senderId,
        params.recipientId,
        BigInt(Math.floor(params.amount * LAMPORTS_PER_SOL)),
        params.memo
      );

      // Execute the private transfer via Privacy Cash
      let depositResult: DepositResult;
      let withdrawResult: WithdrawResult;

      const token = params.token || "SOL";
      const recipientAddress =
        stealthAddress?.address || params.recipientId;

      if (token === "SOL") {
        // Deposit to privacy pool
        depositResult = await this.privacyCashClient!.depositSOL(
          BigInt(Math.floor(params.amount * LAMPORTS_PER_SOL))
        );

        // Withdraw to recipient (through stealth address if maximum privacy)
        withdrawResult = await this.privacyCashClient!.withdrawSOL(
          BigInt(Math.floor(params.amount * LAMPORTS_PER_SOL)),
          recipientAddress
        );
      } else if (token === "USDC") {
        const baseUnits = BigInt(Math.floor(params.amount * 1_000_000));
        depositResult = await this.privacyCashClient!.depositUSDC(baseUnits);
        withdrawResult = await this.privacyCashClient!.withdrawUSDC(
          baseUnits,
          recipientAddress
        );
      } else {
        // USDT
        const baseUnits = BigInt(Math.floor(params.amount * 1_000_000));
        depositResult = await this.privacyCashClient!.depositUSDT(baseUnits);
        withdrawResult = await this.privacyCashClient!.withdrawUSDT(
          baseUnits,
          recipientAddress
        );
      }

      // Generate proof of tip for supporter badge eligibility
      const proof = await this.arciumClient!.generateSupporterProof(
        senderId,
        params.recipientId,
        BigInt(Math.floor(params.amount * LAMPORTS_PER_SOL))
      );

      return {
        success: true,
        tipRecord,
        transactionSignature: withdrawResult.signature,
        stealthAddress: stealthAddress?.address,
        proof,
      };
    } catch (error) {
      console.error("Private tip failed:", error);
      return {
        success: false,
        tipRecord: {
          id: "",
          senderId: "",
          recipientId: params.recipientId,
          amount: { commitment: "", rangeProof: "" },
          timestamp: Date.now(),
        },
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Contribute to a milestone privately
   */
  async contributeToMilestone(
    contribution: MilestoneContribution,
    senderKeypair: Keypair,
    currentProgress: MilestoneProgress
  ): Promise<MilestoneContributionResult> {
    try {
      if (!this.privacyCashClient || !this.arciumClient) {
        await this.initialize(senderKeypair);
      }

      // Execute private deposit
      const lamports = BigInt(Math.floor(contribution.amount * LAMPORTS_PER_SOL));
      const depositResult = await this.privacyCashClient!.depositSOL(lamports);

      // Update milestone progress via Arcium (encrypted)
      const newProgress = await this.arciumClient!.addMilestoneContribution(
        currentProgress,
        lamports
      );

      // Generate contribution proof
      let proof: ArciumProof | undefined;
      if (!contribution.isAnonymous) {
        proof = await this.arciumClient!.generateSupporterProof(
          contribution.contributorId,
          contribution.milestoneId,
          lamports
        );
      }

      return {
        success: true,
        progress: newProgress,
        transactionSignature: depositResult.signature,
        proof,
      };
    } catch (error) {
      console.error("Milestone contribution failed:", error);
      return {
        success: false,
        progress: currentProgress,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Generate a supporter badge with ZK proof
   */
  async generateSupporterBadge(
    supporterId: string,
    creatorId: string,
    minimumAmount: number
  ): Promise<SupporterBadge | null> {
    try {
      if (!this.arciumClient) {
        throw new Error("Service not initialized");
      }

      const lamports = BigInt(Math.floor(minimumAmount * LAMPORTS_PER_SOL));
      const proof = await this.arciumClient.generateSupporterProof(
        supporterId,
        creatorId,
        lamports
      );

      // Determine tier based on minimum amount
      let tier: SupporterBadge["tier"] = "bronze";
      if (minimumAmount >= 100) tier = "platinum";
      else if (minimumAmount >= 50) tier = "gold";
      else if (minimumAmount >= 10) tier = "silver";

      return {
        creatorId,
        tier,
        proof,
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
      };
    } catch (error) {
      console.error("Failed to generate supporter badge:", error);
      return null;
    }
  }

  /**
   * Verify a supporter badge proof
   */
  async verifySupporterBadge(badge: SupporterBadge): Promise<boolean> {
    try {
      if (!this.arciumClient) {
        throw new Error("Service not initialized");
      }

      // Check expiration
      if (Date.now() > badge.expiresAt) {
        return false;
      }

      // Verify the ZK proof
      return await this.arciumClient.verifySupporterProof(badge.proof);
    } catch (error) {
      console.error("Failed to verify supporter badge:", error);
      return false;
    }
  }

  /**
   * Get aggregated (encrypted) tip total for a creator
   */
  async getAggregatedTips(
    creatorId: string,
    tipRecords: TipRecord[]
  ): Promise<EncryptedAmount | null> {
    try {
      if (!this.arciumClient) {
        throw new Error("Service not initialized");
      }

      return await this.arciumClient.aggregateTips(creatorId, tipRecords);
    } catch (error) {
      console.error("Failed to aggregate tips:", error);
      return null;
    }
  }

  /**
   * Prove milestone completion for fund release
   */
  async proveMilestoneCompletion(milestoneId: string): Promise<ArciumProof | null> {
    try {
      if (!this.arciumClient) {
        throw new Error("Service not initialized");
      }

      return await this.arciumClient.proveMilestoneCompletion(milestoneId);
    } catch (error) {
      console.error("Failed to prove milestone completion:", error);
      return null;
    }
  }

  /**
   * Get private balance (for checking available funds)
   */
  async getPrivateBalance(): Promise<{
    sol: bigint;
    usdc: bigint;
    usdt: bigint;
  } | null> {
    try {
      if (!this.privacyCashClient) {
        throw new Error("Service not initialized");
      }

      const [solBalance, usdcBalance, usdtBalance] = await Promise.all([
        this.privacyCashClient.getPrivateSOLBalance(),
        this.privacyCashClient.getPrivateUSDCBalance(),
        this.privacyCashClient.getPrivateUSDTBalance(),
      ]);

      return {
        sol: solBalance.totalLamports,
        usdc: usdcBalance.totalBaseUnits,
        usdt: usdtBalance.totalBaseUnits,
      };
    } catch (error) {
      console.error("Failed to get private balance:", error);
      return null;
    }
  }
}

// ============================================
// Singleton Instance
// ============================================

let serviceSingleton: PrivateTippingService | null = null;

export function getPrivateTippingService(
  rpcUrl?: string,
  network?: "mainnet" | "devnet" | "testnet"
): PrivateTippingService {
  if (!serviceSingleton) {
    serviceSingleton = new PrivateTippingService(rpcUrl, network);
  }
  return serviceSingleton;
}

export default PrivateTippingService;
