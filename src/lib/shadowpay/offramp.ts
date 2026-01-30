/**
 * ShadowPay Off-Ramp & Virtual Card Service
 *
 * Production-grade off-ramp service for converting crypto to fiat.
 * Provides virtual card generation for creators to spend their earnings.
 *
 * Features:
 * - Virtual card generation and management
 * - Crypto-to-fiat conversion
 * - Multiple withdrawal methods
 * - Exchange rate management
 * - Transaction history and analytics
 */

import {
  ShadowPayClient,
  getShadowPayClient,
  type VirtualCard,
  type OfframpRequest,
  type OfframpResponse,
} from "./client";
import { TOKEN_MINTS, type SupportedToken } from "./zk-payments";

// ============================================
// Types
// ============================================

export type OfframpStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

export type WithdrawalMethod = "virtual_card" | "bank_transfer" | "crypto_swap";

export interface ExchangeRate {
  token: SupportedToken;
  usdRate: number;
  lastUpdated: number;
  source: string;
}

export interface OfframpTransaction {
  id: string;
  userWallet: string;
  amountCrypto: number;
  token: SupportedToken;
  amountUsd: number;
  feeUsd: number;
  netAmountUsd: number;
  exchangeRate: number;
  method: WithdrawalMethod;
  status: OfframpStatus;
  destinationDetails?: Record<string, string>;
  cardId?: string;
  createdAt: number;
  completedAt?: number;
  failureReason?: string;
}

export interface CardTransaction {
  id: string;
  cardId: string;
  merchantName: string;
  merchantCategory: string;
  amountUsd: number;
  status: "pending" | "completed" | "declined" | "refunded";
  timestamp: number;
  location?: string;
}

export interface CardLimits {
  dailyLimit: number;
  monthlyLimit: number;
  perTransactionLimit: number;
  atmWithdrawalLimit: number;
  dailySpent: number;
  monthlySpent: number;
}

export interface OfframpConfig {
  minWithdrawalUsd: number;
  maxWithdrawalUsd: number;
  feePercentage: number;
  flatFeeUsd: number;
  supportedTokens: SupportedToken[];
  supportedMethods: WithdrawalMethod[];
}

// Default configuration
const DEFAULT_CONFIG: OfframpConfig = {
  minWithdrawalUsd: 10,
  maxWithdrawalUsd: 10000,
  feePercentage: 1.5,
  flatFeeUsd: 0.50,
  supportedTokens: ["SOL", "USDC", "USDT", "USD1"],
  supportedMethods: ["virtual_card", "bank_transfer"],
};

// ============================================
// Off-Ramp Service
// ============================================

export class OfframpService {
  private client: ShadowPayClient;
  private config: OfframpConfig;
  private exchangeRates: Map<SupportedToken, ExchangeRate> = new Map();
  private transactions: Map<string, OfframpTransaction> = new Map();
  private cards: Map<string, VirtualCard> = new Map();
  private cardTransactions: Map<string, CardTransaction[]> = new Map();
  private cardLimits: Map<string, CardLimits> = new Map();

  constructor(config: Partial<OfframpConfig> = {}) {
    this.client = getShadowPayClient();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeExchangeRates();
  }

  /**
   * Initialize exchange rates
   */
  private async initializeExchangeRates(): Promise<void> {
    // In production, fetch from price oracle
    const rates: Record<SupportedToken, number> = {
      SOL: 100, // $100 per SOL
      USDC: 1,
      USDT: 1,
      USD1: 1,
      BONK: 0.00001,
    };

    for (const [token, rate] of Object.entries(rates) as [SupportedToken, number][]) {
      this.exchangeRates.set(token, {
        token,
        usdRate: rate,
        lastUpdated: Date.now(),
        source: "internal",
      });
    }
  }

  /**
   * Generate transaction ID
   */
  private generateTransactionId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `offramp_${timestamp}_${random}`;
  }

  /**
   * Get token decimals
   */
  private getDecimals(token: SupportedToken): number {
    const decimals: Record<SupportedToken, number> = {
      SOL: 9,
      USDC: 6,
      USDT: 6,
      USD1: 6,
      BONK: 5,
    };
    return decimals[token];
  }

  // ============================================
  // Exchange Rates
  // ============================================

  /**
   * Get current exchange rate for a token
   */
  async getExchangeRate(token: SupportedToken): Promise<ExchangeRate | null> {
    const rate = this.exchangeRates.get(token);

    // Refresh if stale (> 5 minutes)
    if (rate && Date.now() - rate.lastUpdated > 5 * 60 * 1000) {
      await this.refreshExchangeRate(token);
    }

    return this.exchangeRates.get(token) || null;
  }

  /**
   * Refresh exchange rate from oracle
   */
  async refreshExchangeRate(token: SupportedToken): Promise<void> {
    // In production, fetch from Pyth, Switchboard, or other oracle
    try {
      const currentRate = this.exchangeRates.get(token);
      if (currentRate) {
        // Simulate minor price fluctuation
        const fluctuation = 1 + (Math.random() - 0.5) * 0.01;
        currentRate.usdRate *= fluctuation;
        currentRate.lastUpdated = Date.now();
        this.exchangeRates.set(token, currentRate);
      }
    } catch (error) {
      console.error(`Failed to refresh exchange rate for ${token}:`, error);
    }
  }

  /**
   * Get all exchange rates
   */
  async getAllExchangeRates(): Promise<ExchangeRate[]> {
    return Array.from(this.exchangeRates.values());
  }

  /**
   * Convert crypto amount to USD
   */
  async convertToUsd(amount: number, token: SupportedToken): Promise<number> {
    const rate = await this.getExchangeRate(token);
    if (!rate) {
      throw new Error(`Exchange rate not available for ${token}`);
    }
    return amount * rate.usdRate;
  }

  // ============================================
  // Virtual Card Management
  // ============================================

  /**
   * Request a new virtual card
   */
  async requestVirtualCard(
    userWallet: string,
    userSignature: string,
    options?: {
      spendingLimitUsd?: number;
      dailyLimitUsd?: number;
      allowedCategories?: string[];
    }
  ): Promise<{
    success: boolean;
    card?: VirtualCard;
    error?: string;
  }> {
    try {
      const result = await this.client.requestVirtualCard(
        userWallet,
        userSignature,
        options?.spendingLimitUsd || 1000
      );

      if (!result.success || !result.card) {
        return {
          success: false,
          error: result.error || "Failed to create virtual card",
        };
      }

      this.cards.set(result.card.card_id, result.card);

      // Set default limits
      this.cardLimits.set(result.card.card_id, {
        dailyLimit: options?.dailyLimitUsd || 500,
        monthlyLimit: options?.spendingLimitUsd || 1000,
        perTransactionLimit: 200,
        atmWithdrawalLimit: 0, // Virtual cards don't support ATM
        dailySpent: 0,
        monthlySpent: 0,
      });

      return {
        success: true,
        card: result.card,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create card",
      };
    }
  }

  /**
   * Get virtual card details
   */
  async getVirtualCard(cardId: string): Promise<VirtualCard | null> {
    return this.cards.get(cardId) || null;
  }

  /**
   * Get all cards for a user
   */
  async getUserCards(userWallet: string): Promise<VirtualCard[]> {
    return Array.from(this.cards.values()).filter(
      (card) => card.user_wallet === userWallet
    );
  }

  /**
   * Freeze/unfreeze a card
   */
  async setCardStatus(
    cardId: string,
    status: "active" | "frozen",
    userSignature: string
  ): Promise<{ success: boolean; error?: string }> {
    const card = this.cards.get(cardId);
    if (!card) {
      return { success: false, error: "Card not found" };
    }

    card.status = status;
    this.cards.set(cardId, card);

    return { success: true };
  }

  /**
   * Get card spending limits
   */
  async getCardLimits(cardId: string): Promise<CardLimits | null> {
    return this.cardLimits.get(cardId) || null;
  }

  /**
   * Update card spending limits
   */
  async updateCardLimits(
    cardId: string,
    updates: Partial<Pick<CardLimits, "dailyLimit" | "monthlyLimit" | "perTransactionLimit">>
  ): Promise<{ success: boolean; limits?: CardLimits; error?: string }> {
    const limits = this.cardLimits.get(cardId);
    if (!limits) {
      return { success: false, error: "Card limits not found" };
    }

    const updatedLimits = { ...limits, ...updates };
    this.cardLimits.set(cardId, updatedLimits);

    return { success: true, limits: updatedLimits };
  }

  /**
   * Get card transactions
   */
  async getCardTransactions(
    cardId: string,
    options?: {
      limit?: number;
      offset?: number;
      startDate?: number;
      endDate?: number;
    }
  ): Promise<CardTransaction[]> {
    let transactions = this.cardTransactions.get(cardId) || [];

    if (options?.startDate) {
      transactions = transactions.filter((t) => t.timestamp >= options.startDate!);
    }
    if (options?.endDate) {
      transactions = transactions.filter((t) => t.timestamp <= options.endDate!);
    }

    const offset = options?.offset || 0;
    const limit = options?.limit || 50;

    return transactions
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(offset, offset + limit);
  }

  // ============================================
  // Off-Ramp Operations
  // ============================================

  /**
   * Calculate off-ramp fees
   */
  async calculateFees(
    amountUsd: number
  ): Promise<{ feeUsd: number; netAmountUsd: number }> {
    const percentageFee = amountUsd * (this.config.feePercentage / 100);
    const totalFee = percentageFee + this.config.flatFeeUsd;
    const netAmount = amountUsd - totalFee;

    return {
      feeUsd: totalFee,
      netAmountUsd: Math.max(0, netAmount),
    };
  }

  /**
   * Initiate off-ramp transaction
   */
  async initiateOfframp(
    userWallet: string,
    amount: number,
    token: SupportedToken,
    method: WithdrawalMethod,
    destinationDetails?: Record<string, string>
  ): Promise<{
    success: boolean;
    transaction?: OfframpTransaction;
    unsignedTx?: string;
    error?: string;
  }> {
    try {
      // Validate token is supported
      if (!this.config.supportedTokens.includes(token)) {
        return { success: false, error: `Token ${token} not supported for off-ramp` };
      }

      // Validate method
      if (!this.config.supportedMethods.includes(method)) {
        return { success: false, error: `Withdrawal method ${method} not supported` };
      }

      // Convert to USD
      const amountUsd = await this.convertToUsd(amount, token);

      // Validate amount limits
      if (amountUsd < this.config.minWithdrawalUsd) {
        return {
          success: false,
          error: `Minimum withdrawal is $${this.config.minWithdrawalUsd}`,
        };
      }
      if (amountUsd > this.config.maxWithdrawalUsd) {
        return {
          success: false,
          error: `Maximum withdrawal is $${this.config.maxWithdrawalUsd}`,
        };
      }

      // Calculate fees
      const { feeUsd, netAmountUsd } = await this.calculateFees(amountUsd);

      // Get exchange rate
      const rate = await this.getExchangeRate(token);
      if (!rate) {
        return { success: false, error: "Exchange rate not available" };
      }

      // Create off-ramp request
      const tokenMint = TOKEN_MINTS[token];
      const decimals = this.getDecimals(token);
      const amountLamports = Math.floor(amount * Math.pow(10, decimals));

      const offrampRequest: OfframpRequest = {
        user_wallet: userWallet,
        amount_lamports: amountLamports,
        token_mint: tokenMint === "native" ? undefined : tokenMint,
        destination_type: method === "virtual_card" ? "virtual_card" : "bank_transfer",
        destination_details: destinationDetails,
      };

      const result = await this.client.offramp(offrampRequest);

      if (!result.success) {
        return { success: false, error: result.error };
      }

      // Create transaction record
      const transaction: OfframpTransaction = {
        id: result.transaction_id || this.generateTransactionId(),
        userWallet,
        amountCrypto: amount,
        token,
        amountUsd,
        feeUsd,
        netAmountUsd,
        exchangeRate: rate.usdRate,
        method,
        status: "processing",
        destinationDetails,
        createdAt: Date.now(),
      };

      this.transactions.set(transaction.id, transaction);

      return {
        success: true,
        transaction,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Off-ramp failed",
      };
    }
  }

  /**
   * Load funds to virtual card
   */
  async loadToCard(
    cardId: string,
    userWallet: string,
    amount: number,
    token: SupportedToken
  ): Promise<{
    success: boolean;
    transaction?: OfframpTransaction;
    newBalance?: number;
    error?: string;
  }> {
    const card = this.cards.get(cardId);
    if (!card) {
      return { success: false, error: "Card not found" };
    }

    if (card.user_wallet !== userWallet) {
      return { success: false, error: "Unauthorized" };
    }

    if (card.status !== "active") {
      return { success: false, error: "Card is not active" };
    }

    // Initiate off-ramp to card
    const result = await this.initiateOfframp(
      userWallet,
      amount,
      token,
      "virtual_card",
      { cardId }
    );

    if (!result.success || !result.transaction) {
      return { success: false, error: result.error };
    }

    // Update card balance (in production, this would be async)
    result.transaction.cardId = cardId;
    card.balance_usd += result.transaction.netAmountUsd;
    this.cards.set(cardId, card);

    // Mark transaction complete
    result.transaction.status = "completed";
    result.transaction.completedAt = Date.now();
    this.transactions.set(result.transaction.id, result.transaction);

    return {
      success: true,
      transaction: result.transaction,
      newBalance: card.balance_usd,
    };
  }

  /**
   * Get off-ramp transaction by ID
   */
  async getTransaction(transactionId: string): Promise<OfframpTransaction | null> {
    return this.transactions.get(transactionId) || null;
  }

  /**
   * Get user's off-ramp history
   */
  async getUserTransactions(
    userWallet: string,
    options?: {
      limit?: number;
      offset?: number;
      status?: OfframpStatus;
    }
  ): Promise<OfframpTransaction[]> {
    let transactions = Array.from(this.transactions.values()).filter(
      (t) => t.userWallet === userWallet
    );

    if (options?.status) {
      transactions = transactions.filter((t) => t.status === options.status);
    }

    const offset = options?.offset || 0;
    const limit = options?.limit || 50;

    return transactions
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(offset, offset + limit);
  }

  // ============================================
  // Analytics
  // ============================================

  /**
   * Get off-ramp statistics for a user
   */
  async getUserOfframpStats(userWallet: string): Promise<{
    totalWithdrawnUsd: number;
    totalFeesPaidUsd: number;
    transactionCount: number;
    byToken: Record<SupportedToken, { count: number; totalUsd: number }>;
    byMethod: Record<WithdrawalMethod, { count: number; totalUsd: number }>;
    averageTransactionUsd: number;
  }> {
    const transactions = await this.getUserTransactions(userWallet);
    const completedTransactions = transactions.filter((t) => t.status === "completed");

    const stats = {
      totalWithdrawnUsd: 0,
      totalFeesPaidUsd: 0,
      transactionCount: completedTransactions.length,
      byToken: {} as Record<SupportedToken, { count: number; totalUsd: number }>,
      byMethod: {} as Record<WithdrawalMethod, { count: number; totalUsd: number }>,
      averageTransactionUsd: 0,
    };

    for (const tx of completedTransactions) {
      stats.totalWithdrawnUsd += tx.netAmountUsd;
      stats.totalFeesPaidUsd += tx.feeUsd;

      // By token
      if (!stats.byToken[tx.token]) {
        stats.byToken[tx.token] = { count: 0, totalUsd: 0 };
      }
      stats.byToken[tx.token].count++;
      stats.byToken[tx.token].totalUsd += tx.netAmountUsd;

      // By method
      if (!stats.byMethod[tx.method]) {
        stats.byMethod[tx.method] = { count: 0, totalUsd: 0 };
      }
      stats.byMethod[tx.method].count++;
      stats.byMethod[tx.method].totalUsd += tx.netAmountUsd;
    }

    stats.averageTransactionUsd =
      stats.transactionCount > 0
        ? stats.totalWithdrawnUsd / stats.transactionCount
        : 0;

    return stats;
  }

  /**
   * Get configuration
   */
  getConfig(): OfframpConfig {
    return { ...this.config };
  }
}

// ============================================
// Singleton
// ============================================

let offrampService: OfframpService | null = null;

export function getOfframpService(config?: Partial<OfframpConfig>): OfframpService {
  if (!offrampService) {
    offrampService = new OfframpService(config);
  }
  return offrampService;
}

export function resetOfframpService(): void {
  offrampService = null;
}

export default OfframpService;
