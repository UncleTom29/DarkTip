/**
 * Privacy Cash SDK Integration
 *
 * Production-ready integration with Privacy Cash for private transactions on Solana.
 * Supports SOL and SPL token (USDC/USDT) private deposits, withdrawals, and balance checks.
 *
 * @see https://github.com/Privacy-Cash/privacy-cash-sdk
 */

import { Keypair, PublicKey, Connection } from "@solana/web3.js";

// Type definitions based on Privacy Cash SDK
export interface PrivacyCashConfig {
  rpcUrl: string;
  owner: Keypair | string | number[] | Uint8Array;
  enableDebug?: boolean;
}

export interface DepositResult {
  signature: string;
  commitment: string;
  nullifierHash: string;
  amount: bigint;
}

export interface WithdrawResult {
  signature: string;
  recipientAddress: string;
  amount: bigint;
  fee: bigint;
}

export interface PrivateBalance {
  totalLamports: bigint;
  utxoCount: number;
  availableForWithdraw: bigint;
}

export interface SPLTokenBalance {
  totalBaseUnits: bigint;
  utxoCount: number;
  availableForWithdraw: bigint;
  mintAddress: string;
}

// Known SPL token mint addresses
export const SPL_TOKENS = {
  USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  USDT: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
} as const;

type SPLTokenKey = keyof typeof SPL_TOKENS;

/**
 * Privacy Cash Client
 *
 * Wrapper around the Privacy Cash SDK for private transactions on Solana.
 * Handles deposit, withdrawal, and balance operations with full privacy.
 */
export class PrivacyCashClient {
  private client: any = null;
  private config: PrivacyCashConfig;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  constructor(config: PrivacyCashConfig) {
    this.config = config;
  }

  /**
   * Initialize the Privacy Cash client
   * Loads the SDK dynamically to support both browser and server environments
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._initialize();
    return this.initPromise;
  }

  private async _initialize(): Promise<void> {
    try {
      // Dynamic import for browser compatibility
      const { PrivacyCash } = await import("privacycash");

      this.client = new PrivacyCash({
        RPC_url: this.config.rpcUrl,
        owner: this.config.owner,
        enableDebug: this.config.enableDebug ?? false,
      });

      this.isInitialized = true;
    } catch (error) {
      console.error("Failed to initialize Privacy Cash client:", error);
      throw new Error("Privacy Cash SDK initialization failed");
    }
  }

  /**
   * Ensure client is initialized before operations
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    if (!this.client) {
      throw new Error("Privacy Cash client not initialized");
    }
  }

  /**
   * Get the public key associated with this client
   */
  get publicKey(): PublicKey | null {
    return this.client?.publicKey ?? null;
  }

  /**
   * Get the RPC connection
   */
  get connection(): Connection | null {
    return this.client?.connection ?? null;
  }

  // ============================================
  // SOL Operations
  // ============================================

  /**
   * Deposit SOL into the privacy pool
   *
   * @param lamports - Amount in lamports to deposit
   * @returns Deposit result with commitment and nullifier
   */
  async depositSOL(lamports: bigint | number): Promise<DepositResult> {
    await this.ensureInitialized();

    try {
      const result = await this.client.deposit({
        lamports: BigInt(lamports),
      });

      return {
        signature: result.signature || result.txSignature,
        commitment: result.commitment,
        nullifierHash: result.nullifierHash,
        amount: BigInt(lamports),
      };
    } catch (error) {
      console.error("SOL deposit failed:", error);
      throw new Error(`Failed to deposit SOL: ${(error as Error).message}`);
    }
  }

  /**
   * Withdraw SOL from the privacy pool
   *
   * @param lamports - Amount in lamports to withdraw
   * @param recipientAddress - Optional recipient (defaults to client owner)
   * @param referrer - Optional referrer address for fee sharing
   * @returns Withdrawal result
   */
  async withdrawSOL(
    lamports: bigint | number,
    recipientAddress?: string,
    referrer?: string
  ): Promise<WithdrawResult> {
    await this.ensureInitialized();

    try {
      const params: {
        lamports: bigint;
        recipientAddress?: string;
        referrer?: string;
      } = {
        lamports: BigInt(lamports),
      };

      if (recipientAddress) {
        params.recipientAddress = recipientAddress;
      }
      if (referrer) {
        params.referrer = referrer;
      }

      const result = await this.client.withdraw(params);

      return {
        signature: result.signature || result.txSignature,
        recipientAddress: recipientAddress || this.publicKey?.toBase58() || "",
        amount: BigInt(lamports),
        fee: BigInt(result.fee || 0),
      };
    } catch (error) {
      console.error("SOL withdrawal failed:", error);
      throw new Error(`Failed to withdraw SOL: ${(error as Error).message}`);
    }
  }

  /**
   * Get private SOL balance
   *
   * @param abortSignal - Optional abort signal for cancellation
   * @returns Private balance information
   */
  async getPrivateSOLBalance(abortSignal?: AbortSignal): Promise<PrivateBalance> {
    await this.ensureInitialized();

    try {
      const result = await this.client.getPrivateBalance(abortSignal);

      return {
        totalLamports: BigInt(result.totalLamports || result.balance || 0),
        utxoCount: result.utxoCount || result.count || 0,
        availableForWithdraw: BigInt(
          result.availableForWithdraw || result.available || 0
        ),
      };
    } catch (error) {
      console.error("Failed to get private SOL balance:", error);
      throw new Error(
        `Failed to get private balance: ${(error as Error).message}`
      );
    }
  }

  // ============================================
  // SPL Token Operations
  // ============================================

  /**
   * Deposit SPL tokens into the privacy pool
   *
   * @param mintAddress - Token mint address
   * @param amount - Amount in base units (decimals already applied)
   * @returns Deposit result
   */
  async depositSPL(
    mintAddress: string,
    amount: bigint | number
  ): Promise<DepositResult> {
    await this.ensureInitialized();

    try {
      const result = await this.client.depositSPL({
        mintAddress,
        base_units: BigInt(amount),
      });

      return {
        signature: result.signature || result.txSignature,
        commitment: result.commitment,
        nullifierHash: result.nullifierHash,
        amount: BigInt(amount),
      };
    } catch (error) {
      console.error("SPL deposit failed:", error);
      throw new Error(
        `Failed to deposit SPL token: ${(error as Error).message}`
      );
    }
  }

  /**
   * Withdraw SPL tokens from the privacy pool
   *
   * @param mintAddress - Token mint address
   * @param amount - Amount in base units
   * @param recipientAddress - Optional recipient address
   * @param referrer - Optional referrer for fee sharing
   * @returns Withdrawal result
   */
  async withdrawSPL(
    mintAddress: string,
    amount: bigint | number,
    recipientAddress?: string,
    referrer?: string
  ): Promise<WithdrawResult> {
    await this.ensureInitialized();

    try {
      const params: {
        mintAddress: string;
        base_units: bigint;
        recipientAddress?: string;
        referrer?: string;
      } = {
        mintAddress,
        base_units: BigInt(amount),
      };

      if (recipientAddress) {
        params.recipientAddress = recipientAddress;
      }
      if (referrer) {
        params.referrer = referrer;
      }

      const result = await this.client.withdrawSPL(params);

      return {
        signature: result.signature || result.txSignature,
        recipientAddress: recipientAddress || this.publicKey?.toBase58() || "",
        amount: BigInt(amount),
        fee: BigInt(result.fee || 0),
      };
    } catch (error) {
      console.error("SPL withdrawal failed:", error);
      throw new Error(
        `Failed to withdraw SPL token: ${(error as Error).message}`
      );
    }
  }

  /**
   * Get private SPL token balance
   *
   * @param mintAddress - Token mint address
   * @returns Private token balance information
   */
  async getPrivateSPLBalance(mintAddress: string): Promise<SPLTokenBalance> {
    await this.ensureInitialized();

    try {
      const result = await this.client.getPrivateBalanceSpl(mintAddress);

      return {
        totalBaseUnits: BigInt(result.totalBaseUnits || result.balance || 0),
        utxoCount: result.utxoCount || result.count || 0,
        availableForWithdraw: BigInt(
          result.availableForWithdraw || result.available || 0
        ),
        mintAddress,
      };
    } catch (error) {
      console.error("Failed to get private SPL balance:", error);
      throw new Error(
        `Failed to get private SPL balance: ${(error as Error).message}`
      );
    }
  }

  // ============================================
  // Convenience Methods for Known Tokens
  // ============================================

  /**
   * Deposit USDC into the privacy pool
   */
  async depositUSDC(amount: bigint | number): Promise<DepositResult> {
    return this.depositSPL(SPL_TOKENS.USDC, amount);
  }

  /**
   * Withdraw USDC from the privacy pool
   */
  async withdrawUSDC(
    amount: bigint | number,
    recipientAddress?: string,
    referrer?: string
  ): Promise<WithdrawResult> {
    return this.withdrawSPL(SPL_TOKENS.USDC, amount, recipientAddress, referrer);
  }

  /**
   * Get private USDC balance
   */
  async getPrivateUSDCBalance(): Promise<SPLTokenBalance> {
    return this.getPrivateSPLBalance(SPL_TOKENS.USDC);
  }

  /**
   * Deposit USDT into the privacy pool
   */
  async depositUSDT(amount: bigint | number): Promise<DepositResult> {
    return this.depositSPL(SPL_TOKENS.USDT, amount);
  }

  /**
   * Withdraw USDT from the privacy pool
   */
  async withdrawUSDT(
    amount: bigint | number,
    recipientAddress?: string,
    referrer?: string
  ): Promise<WithdrawResult> {
    return this.withdrawSPL(SPL_TOKENS.USDT, amount, recipientAddress, referrer);
  }

  /**
   * Get private USDT balance
   */
  async getPrivateUSDTBalance(): Promise<SPLTokenBalance> {
    return this.getPrivateSPLBalance(SPL_TOKENS.USDT);
  }

  // ============================================
  // Utility Methods
  // ============================================

  /**
   * Clear the local UTXO cache
   * Use when you need fresh data from the chain
   */
  async clearCache(): Promise<void> {
    await this.ensureInitialized();
    await this.client.clearCache();
  }

  /**
   * Set a custom logger for debugging
   */
  setLogger(logger: (message: string) => void): void {
    if (this.client) {
      this.client.setLogger(logger);
    }
  }

  /**
   * Check if running in browser environment
   */
  isBrowser(): boolean {
    return this.client?.isBrowser() ?? typeof window !== "undefined";
  }
}

/**
 * Create a Privacy Cash client instance
 */
export function createPrivacyCashClient(
  config: PrivacyCashConfig
): PrivacyCashClient {
  return new PrivacyCashClient(config);
}

/**
 * Singleton instance for app-wide use
 */
let globalClient: PrivacyCashClient | null = null;

export function getPrivacyCashClient(
  config?: PrivacyCashConfig
): PrivacyCashClient | null {
  if (globalClient) return globalClient;

  if (config) {
    globalClient = createPrivacyCashClient(config);
    return globalClient;
  }

  return null;
}

export function setPrivacyCashClient(client: PrivacyCashClient): void {
  globalClient = client;
}
