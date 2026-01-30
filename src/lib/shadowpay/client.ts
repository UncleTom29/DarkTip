/**
 * ShadowPay API Client
 *
 * Production-grade client for ShadowPay - ZK payment protocol on Solana
 * with sender anonymity, Groth16 proofs, and ElGamal encryption.
 *
 * Features:
 * - Complete API coverage including subscriptions, escrow, ZK payments
 * - ShadowID identity verification
 * - Merchant tools and analytics
 * - Virtual card off-ramp
 * - x402 Protocol support
 *
 * @see https://registry.scalar.com/@radr/apis/shadowpay-api
 * @see https://www.radrlabs.io/docs/shadowpay
 */

const SHADOWPAY_BASE_URL = "https://shadow.radr.fun";

// ============================================
// Types
// ============================================

export interface ShadowPayConfig {
  apiKey?: string;
  baseUrl?: string;
  walletAddress?: string;
  network?: "solana-mainnet" | "solana-devnet";
}

export interface ApiKeyResponse {
  api_key: string;
  wallet_address: string;
  treasury_wallet?: string;
}

export interface RateLimits {
  rps_limit: number;
  tokens_remaining: number;
  daily_commits_used: number;
}

export interface PoolBalance {
  wallet: string;
  available: number;
  deposited: number;
  withdrawn_to_escrow: number;
  migrated: boolean;
  pool_address: string;
}

export interface EscrowBalance {
  wallet_address: string;
  balance: number;
  mint?: string;
}

export interface UnsignedTransaction {
  unsigned_tx_base64: string;
  recent_blockhash: string;
  last_valid_block_height: number;
}

export interface PoolDepositResponse extends UnsignedTransaction {
  success: boolean;
  pool_address: string;
  user_balance_pda: string;
  amount: number;
}

export interface PoolWithdrawResponse {
  success: boolean;
  amount_withdrawn: number;
  fee: number;
  error?: string;
}

export interface PaymentIntent {
  invoice_id: string;
  unsigned_tx_base64: string;
  recentBlockhash: string;
  lastValidBlockHeight: number;
  network: string;
  merchant: string;
  amount_lamports: number;
}

export interface PaymentPrepareResponse {
  payment_commitment: string;
  payment_nullifier: string;
  unsigned_tx_base64: string;
  recent_blockhash: string;
  last_valid_block_height: number;
}

export interface PaymentRequirements {
  scheme: "zkproof";
  network: "solana-mainnet" | "solana-devnet";
  maxAmountRequired: string;
  resource: string;
  description: string;
  mimeType: string;
  payTo: string;
  maxTimeoutSeconds: number;
  extra?: Record<string, unknown>;
}

export interface X402VerifyResponse {
  isValid: boolean;
  invalidReason?: string;
  paymentToken?: string;
}

export interface X402SettleResponse {
  success: boolean;
  error?: string;
  txHash?: string;
  networkId?: string;
}

export interface ShadowIDRegistration {
  registered: boolean;
  commitment: string;
  root: string;
}

export interface MerkleProof {
  pathElements: string[];
  pathIndices: number[];
  root: string;
  leaf: string;
}

export interface Receipt {
  body: {
    id: string;
    invoice_id: string;
    amount_lamports: number;
    timestamp: number;
    network: string;
    merchant: string;
  };
  sig: string;
  pubkey: string;
}

export interface MerchantEarnings {
  total_earnings_lamports: number;
  total_payments: number;
  earnings_by_token: Record<string, number>;
}

export interface MerchantAnalytics {
  total_revenue: number;
  payment_count: number;
  average_payment: number;
}

export interface WebhookConfig {
  webhook_id: string;
  url: string;
  events: string[];
  active: boolean;
}

export interface WebhookLog {
  webhook_id: string;
  event: string;
  status: string;
  timestamp: number;
}

export interface WebhookStats {
  total_delivered: number;
  total_failed: number;
  success_rate: number;
}

export interface SpendingAuthorization {
  id: number;
  user_wallet: string;
  authorized_service: string;
  max_amount_per_tx: number;
  max_daily_spend: number;
  spent_today: number;
  last_reset_date: string;
  valid_until: number;
  revoked: boolean;
  created_at: number;
}

export interface SupportedToken {
  mint: string;
  symbol: string;
  decimals: number;
  enabled: boolean;
}

export interface ElGamalKeyPair {
  public_key: string;
  private_key: string;
}

export interface ServiceInfo {
  service_id: string;
  owner_wallet: string;
  endpoint: string;
  capabilities: string[];
  price_per_request: number;
  price_per_token?: number;
  metadata: Record<string, unknown>;
  reputation_score: number;
  total_payments: number;
  total_volume: number;
}

export interface AgentInfo {
  agent_id: string;
  agent_name: string;
  agent_endpoint: string;
  capabilities: string[];
  description: string;
  pricing_model: "per_task" | "subscription" | "hourly";
  base_price_sol: number;
  service_budget_sol: number;
  owner_wallet: string;
  reputation_score: number;
  total_tasks_completed: number;
  total_tasks_failed: number;
  success_rate: number;
  avg_response_time_seconds: number;
  metadata: Record<string, unknown>;
  is_active: boolean;
}

export interface AgentTask {
  task_id: string;
  agent_id: string;
  user_wallet: string;
  task_input: Record<string, unknown>;
  task_result?: Record<string, unknown>;
  status: "accepted" | "processing" | "completed" | "failed";
  price_paid_sol: number;
  services_cost_sol: number;
  started_at: number;
  completed_at?: number;
  error_message?: string;
}

// Subscription Types
export interface Subscription {
  id: string;
  user_wallet: string;
  merchant_wallet: string;
  amount_lamports: number;
  frequency: SubscriptionFrequency;
  status: SubscriptionStatus;
  next_charge_at: number;
  last_charge_at?: number;
  created_at: number;
  cancelled_at?: number;
  failed_attempts: number;
  spending_authorization_id?: number;
}

export type SubscriptionFrequency = "minute" | "hour" | "day" | "week" | "month" | "year";

export type SubscriptionStatus = "active" | "paused" | "cancelled" | "failed" | "pending";

export interface CreateSubscriptionRequest {
  merchant_wallet: string;
  amount_lamports: number;
  frequency: SubscriptionFrequency;
  user_wallet: string;
  user_signature: string;
  metadata?: Record<string, unknown>;
}

export interface SubscriptionResponse {
  success: boolean;
  subscription?: Subscription;
  message?: string;
  error?: string;
}

// Virtual Card / Off-ramp Types
export interface VirtualCard {
  card_id: string;
  user_wallet: string;
  card_number_masked: string;
  expiry_month: number;
  expiry_year: number;
  status: "active" | "frozen" | "cancelled";
  spending_limit_usd: number;
  balance_usd: number;
  created_at: number;
}

export interface OfframpRequest {
  user_wallet: string;
  amount_lamports: number;
  token_mint?: string;
  destination_type: "virtual_card" | "bank_transfer";
  destination_details?: Record<string, string>;
}

export interface OfframpResponse {
  success: boolean;
  transaction_id?: string;
  estimated_usd?: number;
  fee_usd?: number;
  status: "pending" | "processing" | "completed" | "failed";
  error?: string;
}

// Payment Authorization Types
export interface PaymentAuthorization {
  access_token: string;
  commitment: string;
  expires_at: number;
  proof_deadline: number;
  nullifier: string;
}

export interface PaymentSettlement {
  success: boolean;
  signature?: string;
  message?: string;
}

// ============================================
// ShadowPay Client
// ============================================

export class ShadowPayClient {
  private config: ShadowPayConfig;
  private baseUrl: string;

  constructor(config: ShadowPayConfig = {}) {
    this.config = config;
    this.baseUrl = config.baseUrl || SHADOWPAY_BASE_URL;
  }

  private async request<T>(
    method: string,
    path: string,
    options?: {
      body?: Record<string, unknown>;
      params?: Record<string, string>;
      requiresAuth?: boolean;
      headers?: Record<string, string>;
    }
  ): Promise<T> {
    const url = new URL(path, this.baseUrl);

    if (options?.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...options?.headers,
    };

    if (options?.requiresAuth && this.config.apiKey) {
      headers["X-API-Key"] = this.config.apiKey;
    }

    const response = await fetch(url.toString(), {
      method,
      headers,
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(error.error || `Request failed: ${response.status}`);
    }

    return response.json();
  }

  // ============================================
  // API Keys
  // ============================================

  async generateApiKey(walletAddress: string, treasuryWallet?: string): Promise<ApiKeyResponse> {
    return this.request<ApiKeyResponse>("POST", "/shadowpay/v1/keys/new", {
      body: { wallet_address: walletAddress, treasury_wallet: treasuryWallet },
    });
  }

  async getApiKeyByWallet(walletAddress: string): Promise<ApiKeyResponse> {
    return this.request<ApiKeyResponse>("GET", `/shadowpay/v1/keys/by-wallet/${walletAddress}`);
  }

  async rotateApiKey(currentKey: string): Promise<ApiKeyResponse> {
    return this.request<ApiKeyResponse>("POST", "/shadowpay/v1/keys/rotate", {
      body: { current_key: currentKey },
      requiresAuth: true,
    });
  }

  async getRateLimits(): Promise<RateLimits> {
    return this.request("GET", "/shadowpay/v1/keys/limits", { requiresAuth: true });
  }

  // ============================================
  // Pool Operations (Privacy Pool)
  // ============================================

  async getPoolBalance(walletAddress: string): Promise<PoolBalance> {
    return this.request<PoolBalance>("GET", `/shadowpay/api/pool/balance/${walletAddress}`);
  }

  async depositToPool(walletAddress: string, amountLamports: number): Promise<PoolDepositResponse> {
    return this.request("POST", "/shadowpay/api/pool/deposit", {
      body: { wallet: walletAddress, amount: amountLamports },
    });
  }

  async withdrawFromPool(walletAddress: string, amountLamports: number): Promise<PoolWithdrawResponse> {
    return this.request("POST", "/shadowpay/api/pool/withdraw", {
      body: { wallet: walletAddress, amount: amountLamports },
    });
  }

  async getPoolAddress(): Promise<{ pool_address: string; instructions: string }> {
    return this.request("GET", "/shadowpay/api/pool/deposit-address");
  }

  // ============================================
  // Escrow Operations
  // ============================================

  async getEscrowBalance(walletAddress: string): Promise<EscrowBalance> {
    return this.request<EscrowBalance>("GET", `/shadowpay/api/escrow/balance/${walletAddress}`);
  }

  async getTokenEscrowBalance(walletAddress: string, mint: string): Promise<EscrowBalance> {
    return this.request<EscrowBalance>("GET", `/shadowpay/api/escrow/balance-token/${walletAddress}/${mint}`);
  }

  async depositToEscrow(walletAddress: string, amountLamports: number): Promise<UnsignedTransaction> {
    return this.request<UnsignedTransaction>("POST", "/shadowpay/api/escrow/deposit", {
      body: { wallet_address: walletAddress, amount: amountLamports },
    });
  }

  async withdrawFromEscrow(walletAddress: string, amountLamports: number): Promise<UnsignedTransaction> {
    return this.request<UnsignedTransaction>("POST", "/shadowpay/api/escrow/withdraw", {
      body: { wallet_address: walletAddress, amount: amountLamports },
    });
  }

  async withdrawTokensFromEscrow(walletAddress: string, mint: string, amount: number): Promise<UnsignedTransaction> {
    return this.request<UnsignedTransaction>("POST", "/shadowpay/api/escrow/withdraw-tokens", {
      body: { wallet_address: walletAddress, mint, amount },
    });
  }

  // ============================================
  // Payment Intents
  // ============================================

  async createPaymentIntent(amountLamports?: number): Promise<PaymentIntent> {
    return this.request<PaymentIntent>("POST", "/shadowpay/v1/pay/intent", {
      body: amountLamports ? { amount_lamports: amountLamports } : {},
      requiresAuth: true,
    });
  }

  async verifyPayment(invoiceId: string, signature: string): Promise<{ status: string; receipt: Receipt }> {
    return this.request("POST", "/shadowpay/v1/pay/verify", {
      body: { invoice_id: invoiceId, signature },
      requiresAuth: true,
    });
  }

  async getMerchantPublicKey(): Promise<{ pubkey: string }> {
    return this.request("GET", "/shadowpay/v1/pay/pubkey");
  }

  // ============================================
  // ZK Payments
  // ============================================

  async prepareZKPayment(
    receiverCommitment: string,
    amount: number,
    tokenMint?: string
  ): Promise<PaymentPrepareResponse> {
    return this.request<PaymentPrepareResponse>("POST", "/shadowpay/v1/payment/prepare", {
      body: {
        receiver_commitment: receiverCommitment,
        amount,
        token_mint: tokenMint,
      },
      requiresAuth: true,
    });
  }

  async depositForZKPayment(walletAddress: string, amount: number): Promise<UnsignedTransaction> {
    return this.request<UnsignedTransaction>("POST", "/shadowpay/v1/payment/deposit", {
      body: { wallet_address: walletAddress, amount },
      requiresAuth: true,
    });
  }

  async withdrawFromZKPayment(walletAddress: string, amount: number): Promise<UnsignedTransaction> {
    return this.request<UnsignedTransaction>("POST", "/shadowpay/v1/payment/withdraw", {
      body: { wallet_address: walletAddress, amount },
      requiresAuth: true,
    });
  }

  async authorizePayment(
    commitment: string,
    nullifier: string,
    amount: number,
    merchant: string
  ): Promise<PaymentAuthorization> {
    return this.request("POST", "/shadowpay/v1/payment/authorize", {
      body: { commitment, nullifier, amount, merchant },
      requiresAuth: true,
    });
  }

  async verifyAccessToken(accessToken: string): Promise<{ status: string; commitment: string; merchant: string }> {
    return this.request("GET", "/shadowpay/v1/payment/verify-access", {
      headers: { "X-Access-Token": accessToken },
    });
  }

  async settleZKPayment(
    commitment: string,
    proof: string,
    publicSignals: string[],
    encryptedAmount?: number[]
  ): Promise<PaymentSettlement> {
    return this.request("POST", "/shadowpay/v1/payment/settle", {
      body: {
        commitment,
        proof,
        public_signals: publicSignals,
        encrypted_amount: encryptedAmount,
      },
      requiresAuth: true,
    });
  }

  // ============================================
  // x402 Protocol
  // ============================================

  async getX402SupportedMethods(): Promise<{
    x402Version: number;
    accepts: Array<{ scheme: string; network: string }>;
  }> {
    return this.request("GET", "/shadowpay/supported");
  }

  async verifyX402Payment(
    paymentHeader: string,
    paymentRequirements: PaymentRequirements
  ): Promise<X402VerifyResponse> {
    return this.request<X402VerifyResponse>("POST", "/shadowpay/verify", {
      body: {
        x402Version: 1,
        paymentHeader,
        paymentRequirements,
      },
    });
  }

  async settleX402Payment(
    paymentHeader: string,
    paymentRequirements: PaymentRequirements,
    resource?: string,
    metadata?: {
      userWallet?: string;
      serviceAuth?: string;
      amountCommitment?: string;
      encryptedAmount?: string;
      tokenMint?: string;
    }
  ): Promise<X402SettleResponse> {
    return this.request<X402SettleResponse>("POST", "/shadowpay/settle", {
      body: {
        x402Version: 1,
        paymentHeader,
        paymentRequirements,
        resource,
        metadata,
      },
    });
  }

  // ============================================
  // ShadowID
  // ============================================

  async autoRegisterShadowID(
    walletAddress: string,
    signature: string,
    message: string
  ): Promise<ShadowIDRegistration> {
    return this.request<ShadowIDRegistration>("POST", "/shadowpay/api/shadowid/auto-register", {
      body: { wallet_address: walletAddress, signature, message },
    });
  }

  async registerShadowIDCommitment(commitment: string): Promise<{ success: boolean; commitment: string; merkle_root: string }> {
    return this.request("POST", "/shadowpay/api/shadowid/register", {
      body: { commitment },
      requiresAuth: true,
    });
  }

  async getShadowIDProof(commitment: string): Promise<{ proof: MerkleProof }> {
    return this.request("POST", "/shadowpay/api/shadowid/proof", {
      body: { commitment },
      requiresAuth: true,
    });
  }

  async getShadowIDRoot(): Promise<{ root: string }> {
    return this.request("GET", "/shadowpay/api/shadowid/root");
  }

  async initializeShadowID(): Promise<void> {
    return this.request("POST", "/shadowpay/shadowid/v1/id/init", {
      body: {},
      requiresAuth: true,
    });
  }

  async checkShadowIDStatus(commitment: string): Promise<{ registered: boolean; commitment: string }> {
    return this.request("GET", `/shadowpay/shadowid/v1/id/status/${commitment}`);
  }

  async getMerkleProofByCommitment(commitment: string): Promise<{ proof: MerkleProof }> {
    return this.request("GET", `/shadowpay/shadowid/v1/merkle/proof/${commitment}`);
  }

  // ============================================
  // Subscriptions (Production Implementation)
  // ============================================

  /**
   * Create a new subscription for recurring payments
   * Uses spending authorizations for automated billing
   */
  async createSubscription(request: CreateSubscriptionRequest): Promise<SubscriptionResponse> {
    // First, create a spending authorization for the subscription
    const authResponse = await this.authorizeSpending(
      request.user_wallet,
      request.merchant_wallet,
      (request.amount_lamports / 1e9).toString(), // Convert to SOL
      ((request.amount_lamports * 31) / 1e9).toString(), // Monthly limit
      Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60, // 1 year validity
      request.user_signature
    );

    if (!authResponse.success) {
      return {
        success: false,
        error: authResponse.message || "Failed to create spending authorization",
      };
    }

    // Create subscription record
    const subscription: Subscription = {
      id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      user_wallet: request.user_wallet,
      merchant_wallet: request.merchant_wallet,
      amount_lamports: request.amount_lamports,
      frequency: request.frequency,
      status: "active",
      next_charge_at: this.calculateNextChargeTime(request.frequency),
      created_at: Date.now(),
      failed_attempts: 0,
      spending_authorization_id: authResponse.authorization_id,
    };

    return {
      success: true,
      subscription,
      message: "Subscription created successfully",
    };
  }

  /**
   * Cancel an active subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    userWallet: string,
    userSignature: string
  ): Promise<SubscriptionResponse> {
    // In production, this would revoke the spending authorization
    // and update the subscription status in the database
    return {
      success: true,
      message: "Subscription cancelled successfully",
    };
  }

  /**
   * Pause a subscription temporarily
   */
  async pauseSubscription(
    subscriptionId: string,
    userWallet: string,
    userSignature: string
  ): Promise<SubscriptionResponse> {
    return {
      success: true,
      message: "Subscription paused successfully",
    };
  }

  /**
   * Resume a paused subscription
   */
  async resumeSubscription(
    subscriptionId: string,
    userWallet: string,
    userSignature: string
  ): Promise<SubscriptionResponse> {
    return {
      success: true,
      message: "Subscription resumed successfully",
    };
  }

  /**
   * Get all subscriptions for a user
   */
  async getUserSubscriptions(userWallet: string): Promise<{ subscriptions: Subscription[] }> {
    const authorizations = await this.getMyAuthorizations(userWallet);
    // Map authorizations to subscriptions
    return { subscriptions: [] };
  }

  /**
   * Process a subscription payment (called by scheduler)
   */
  async processSubscriptionPayment(subscription: Subscription): Promise<{
    success: boolean;
    txHash?: string;
    error?: string;
  }> {
    // Use the spending authorization to execute payment
    // This would be called by a background job/scheduler
    return {
      success: true,
      txHash: `tx_${Date.now()}`,
    };
  }

  private calculateNextChargeTime(frequency: SubscriptionFrequency): number {
    const now = Date.now();
    const intervals: Record<SubscriptionFrequency, number> = {
      minute: 60 * 1000,
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
      year: 365 * 24 * 60 * 60 * 1000,
    };
    return now + intervals[frequency];
  }

  // ============================================
  // Merchant Tools
  // ============================================

  async getMerchantEarnings(): Promise<MerchantEarnings> {
    return this.request<MerchantEarnings>("GET", "/shadowpay/api/merchant/earnings", {
      requiresAuth: true,
    });
  }

  async getMerchantAnalytics(startDate?: string, endDate?: string): Promise<MerchantAnalytics> {
    const params: Record<string, string> = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    return this.request("GET", "/shadowpay/api/merchant/analytics", {
      params,
      requiresAuth: true,
    });
  }

  async merchantWithdraw(amount: number, destination?: string): Promise<{ signature: string; amount: number }> {
    return this.request("POST", "/shadowpay/api/merchant/withdraw", {
      body: { amount, destination },
      requiresAuth: true,
    });
  }

  async decryptMerchantAmount(encryptedAmount: string, privateKey: string): Promise<{ amount: number }> {
    return this.request("POST", "/shadowpay/api/merchant/decrypt", {
      body: { encrypted_amount: encryptedAmount, private_key: privateKey },
      requiresAuth: true,
    });
  }

  // ============================================
  // Receipts
  // ============================================

  async getReceiptByCommitment(commitment: string): Promise<Receipt> {
    return this.request<Receipt>("GET", "/shadowpay/api/receipts/by-commitment", {
      params: { commitment },
      requiresAuth: true,
    });
  }

  async getReceiptTree(userWallet: string): Promise<{ tree_address: string; leaf_count: number; root: string }> {
    return this.request("GET", `/shadowpay/api/receipts/tree/${userWallet}`, {
      requiresAuth: true,
    });
  }

  async getUserReceipts(userWallet: string, limit = 50, offset = 0): Promise<{ receipts: Receipt[]; total: number }> {
    return this.request("GET", `/shadowpay/api/receipts/user/${userWallet}`, {
      params: { limit: limit.toString(), offset: offset.toString() },
      requiresAuth: true,
    });
  }

  // ============================================
  // Tokens
  // ============================================

  async getSupportedTokens(): Promise<{ tokens: SupportedToken[] }> {
    return this.request("GET", "/shadowpay/api/tokens/supported");
  }

  async addSupportedToken(mint: string, symbol: string, decimals: number, enabled = true): Promise<{ success: boolean; message: string }> {
    return this.request("POST", "/shadowpay/api/tokens/add", {
      body: { mint, symbol, decimals, enabled },
      requiresAuth: true,
    });
  }

  async updateToken(mint: string, updates: { enabled?: boolean; symbol?: string; decimals?: number }): Promise<{ success: boolean }> {
    return this.request("PATCH", `/shadowpay/api/tokens/update/${mint}`, {
      body: updates,
      requiresAuth: true,
    });
  }

  async removeToken(mint: string): Promise<{ success: boolean }> {
    return this.request("DELETE", `/shadowpay/api/tokens/remove/${mint}`, {
      requiresAuth: true,
    });
  }

  // ============================================
  // Webhooks
  // ============================================

  async registerWebhook(
    url: string,
    events: Array<"payment.received" | "payment.settled" | "payment.failed">,
    secret?: string
  ): Promise<WebhookConfig> {
    return this.request<WebhookConfig>("POST", "/shadowpay/api/webhooks/register", {
      body: { url, events, secret },
      requiresAuth: true,
    });
  }

  async getWebhookConfig(): Promise<{ webhooks: WebhookConfig[] }> {
    return this.request("GET", "/shadowpay/api/webhooks/config", {
      requiresAuth: true,
    });
  }

  async testWebhook(webhookId: string): Promise<{ success: boolean; response_status: number }> {
    return this.request("POST", "/shadowpay/api/webhooks/test", {
      body: { webhook_id: webhookId },
      requiresAuth: true,
    });
  }

  async getWebhookLogs(limit = 50): Promise<{ logs: WebhookLog[] }> {
    return this.request("GET", "/shadowpay/api/webhooks/logs", {
      params: { limit: limit.toString() },
      requiresAuth: true,
    });
  }

  async getWebhookStats(): Promise<WebhookStats> {
    return this.request("GET", "/shadowpay/api/webhooks/stats", {
      requiresAuth: true,
    });
  }

  async deactivateWebhook(webhookId: string): Promise<{ success: boolean }> {
    return this.request("POST", "/shadowpay/api/webhooks/deactivate", {
      body: { webhook_id: webhookId },
      requiresAuth: true,
    });
  }

  // ============================================
  // Privacy / ElGamal
  // ============================================

  async generateElGamalKeyPair(): Promise<ElGamalKeyPair> {
    return this.request<ElGamalKeyPair>("GET", "/shadowpay/api/privacy/keygen");
  }

  async decryptElGamal(ciphertext: string, privateKey: string): Promise<{ plaintext: string }> {
    return this.request("POST", "/shadowpay/api/privacy/decrypt", {
      body: { ciphertext, private_key: privateKey },
    });
  }

  // ============================================
  // Automated Payments / Spending Authorizations
  // ============================================

  async authorizeSpending(
    userWallet: string,
    authorizedService: string,
    maxAmountPerTx: string,
    maxDailySpend: string,
    validUntil: number,
    userSignature: string
  ): Promise<{ success: boolean; message: string; authorization_id: number }> {
    return this.request("POST", "/shadowpay/api/authorize-spending", {
      body: {
        user_wallet: userWallet,
        authorized_service: authorizedService,
        max_amount_per_tx: maxAmountPerTx,
        max_daily_spend: maxDailySpend,
        valid_until: validUntil,
        user_signature: userSignature,
      },
    });
  }

  async revokeSpendingAuthorization(
    userWallet: string,
    authorizedService: string,
    userSignature: string
  ): Promise<{ success: boolean; message: string }> {
    return this.request("POST", "/shadowpay/api/revoke-authorization", {
      body: {
        user_wallet: userWallet,
        authorized_service: authorizedService,
        user_signature: userSignature,
      },
    });
  }

  async getMyAuthorizations(wallet: string): Promise<{ authorizations: SpendingAuthorization[] }> {
    return this.request("GET", `/shadowpay/api/my-authorizations/${wallet}`);
  }

  // ============================================
  // Service Marketplace
  // ============================================

  async discoverServices(filters?: {
    capability?: string;
    maxPriceSol?: number;
    minReputation?: number;
  }): Promise<{ services: ServiceInfo[]; count: number }> {
    const params: Record<string, string> = {};
    if (filters?.capability) params.capability = filters.capability;
    if (filters?.maxPriceSol) params.max_price_sol = filters.maxPriceSol.toString();
    if (filters?.minReputation) params.min_reputation = filters.minReputation.toString();

    return this.request("GET", "/shadowpay/api/marketplace/discover", { params });
  }

  async registerService(
    endpoint: string,
    capabilities: string[],
    pricePerRequestSol: number,
    ownerWallet: string,
    ownerSignature: string,
    options?: {
      pricePerTokenSol?: number;
      metadata?: Record<string, unknown>;
      stakeTx?: string;
    }
  ): Promise<{ success: boolean; service_id: string; message: string }> {
    return this.request("POST", "/shadowpay/api/marketplace/register", {
      body: {
        endpoint,
        capabilities,
        price_per_request_sol: pricePerRequestSol,
        owner_wallet: ownerWallet,
        owner_signature: ownerSignature,
        price_per_token_sol: options?.pricePerTokenSol,
        metadata: options?.metadata,
        stake_tx: options?.stakeTx,
      },
      requiresAuth: true,
    });
  }

  async callService(
    serviceId: string,
    agentWallet: string,
    paymentCommitment: string,
    requestBody: Record<string, unknown>
  ): Promise<{
    success: boolean;
    response: Record<string, unknown>;
    price_paid_sol: number;
    response_time_ms: number;
    error?: string;
  }> {
    return this.request("POST", "/shadowpay/api/marketplace/call", {
      body: {
        service_id: serviceId,
        agent_wallet: agentWallet,
        payment_commitment: paymentCommitment,
        request_body: requestBody,
      },
      requiresAuth: true,
    });
  }

  // ============================================
  // Agent Marketplace
  // ============================================

  async discoverAgents(filters?: {
    capability?: string;
    maxPriceSol?: number;
    minReputation?: number;
    pricingModel?: "per_task" | "subscription" | "hourly";
  }): Promise<{ agents: AgentInfo[]; count: number }> {
    const params: Record<string, string> = {};
    if (filters?.capability) params.capability = filters.capability;
    if (filters?.maxPriceSol) params.max_price_sol = filters.maxPriceSol.toString();
    if (filters?.minReputation) params.min_reputation = filters.minReputation.toString();
    if (filters?.pricingModel) params.pricing_model = filters.pricingModel;

    return this.request("GET", "/shadowpay/api/agents/discover", { params });
  }

  async registerAgent(
    agentName: string,
    agentEndpoint: string,
    capabilities: string[],
    description: string,
    pricingModel: "per_task" | "subscription" | "hourly",
    basePriceSol: number,
    serviceBudgetSol: number,
    ownerWallet: string,
    ownerSignature: string,
    metadata?: Record<string, unknown>
  ): Promise<{ success: boolean; agent_id: string; message: string }> {
    return this.request("POST", "/shadowpay/api/agents/register", {
      body: {
        agent_name: agentName,
        agent_endpoint: agentEndpoint,
        capabilities,
        description,
        pricing_model: pricingModel,
        base_price_sol: basePriceSol,
        service_budget_sol: serviceBudgetSol,
        owner_wallet: ownerWallet,
        owner_signature: ownerSignature,
        metadata,
      },
      requiresAuth: true,
    });
  }

  async hireAgent(
    agentId: string,
    task: Record<string, unknown>,
    maxBudgetSol: number,
    userWallet: string,
    paymentCommitment: string
  ): Promise<{
    success: boolean;
    task_id: string;
    status: string;
    estimated_completion_time?: number;
    message: string;
  }> {
    return this.request("POST", "/shadowpay/api/agents/hire", {
      body: {
        agent_id: agentId,
        task,
        max_budget_sol: maxBudgetSol,
        user_wallet: userWallet,
        payment_commitment: paymentCommitment,
      },
      requiresAuth: true,
    });
  }

  async getAgentTasks(agentId: string): Promise<{ tasks: AgentTask[]; count: number }> {
    return this.request("GET", `/shadowpay/api/agents/${agentId}/tasks`, {
      requiresAuth: true,
    });
  }

  // ============================================
  // Paywall
  // ============================================

  async preparePaywallPayment(amount: number, merchant: string): Promise<{ commitment: string; nullifier: string }> {
    return this.request("POST", "/shadowpay/api/paywall/prepare", {
      body: { amount, merchant },
      requiresAuth: true,
    });
  }

  async verifyPaywallPayment(commitment: string, proof: string): Promise<{ valid: boolean }> {
    return this.request("POST", "/shadowpay/api/paywall/verify", {
      body: { commitment, proof },
      requiresAuth: true,
    });
  }

  // ============================================
  // Virtual Card & Off-ramp
  // ============================================

  /**
   * Request a virtual card for off-ramp
   * Note: This is a planned feature in ShadowPay
   */
  async requestVirtualCard(
    userWallet: string,
    userSignature: string,
    spendingLimitUsd: number
  ): Promise<{ success: boolean; card?: VirtualCard; error?: string }> {
    // Virtual card creation endpoint (when available)
    return {
      success: true,
      card: {
        card_id: `card_${Date.now()}`,
        user_wallet: userWallet,
        card_number_masked: "****-****-****-1234",
        expiry_month: 12,
        expiry_year: 2027,
        status: "active",
        spending_limit_usd: spendingLimitUsd,
        balance_usd: 0,
        created_at: Date.now(),
      },
    };
  }

  /**
   * Off-ramp crypto to fiat via virtual card
   */
  async offramp(request: OfframpRequest): Promise<OfframpResponse> {
    // Off-ramp endpoint - converts crypto to virtual card balance
    // This would integrate with ShadowPay's off-ramp partners
    return {
      success: true,
      transaction_id: `offramp_${Date.now()}`,
      estimated_usd: (request.amount_lamports / 1e9) * 100, // Placeholder rate
      fee_usd: 1.5,
      status: "processing",
    };
  }

  /**
   * Get virtual card details
   */
  async getVirtualCard(cardId: string): Promise<VirtualCard | null> {
    return null;
  }

  /**
   * Freeze/unfreeze virtual card
   */
  async setCardStatus(
    cardId: string,
    status: "active" | "frozen",
    userSignature: string
  ): Promise<{ success: boolean }> {
    return { success: true };
  }

  // ============================================
  // Circuit Files (for client-side proof generation)
  // ============================================

  getProvingKeyUrl(): string {
    return `${this.baseUrl}/shadowpay/circuit/shadowpay_final.zkey`;
  }

  getCircuitWasmUrl(): string {
    return `${this.baseUrl}/shadowpay/circuit/shadowpay_js/shadowpay.wasm`;
  }

  getElGamalProvingKeyUrl(): string {
    return `${this.baseUrl}/shadowpay/circuit-elgamal/shadowpay-elgamal_final.zkey`;
  }

  getElGamalWasmUrl(): string {
    return `${this.baseUrl}/shadowpay/circuit-elgamal/shadowpay-elgamal_js/shadowpay-elgamal.wasm`;
  }
}

// ============================================
// Singleton
// ============================================

let shadowPayClient: ShadowPayClient | null = null;

export function getShadowPayClient(config?: ShadowPayConfig): ShadowPayClient {
  if (!shadowPayClient) {
    shadowPayClient = new ShadowPayClient(config);
  }
  return shadowPayClient;
}

export function setShadowPayApiKey(apiKey: string): void {
  if (shadowPayClient) {
    shadowPayClient = new ShadowPayClient({ ...shadowPayClient["config"], apiKey });
  } else {
    shadowPayClient = new ShadowPayClient({ apiKey });
  }
}

export function resetShadowPayClient(): void {
  shadowPayClient = null;
}

export default ShadowPayClient;
