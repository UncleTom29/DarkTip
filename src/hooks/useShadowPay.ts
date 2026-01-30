"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ShadowPayClient,
  getShadowPayClient,
  setShadowPayApiKey,
  type ShadowPayConfig,
  type PoolBalance,
  type EscrowBalance,
  type PaymentIntent,
  type PaymentAuthorization,
  type Receipt,
  type SupportedToken,
} from "@/lib/shadowpay/client";

// ============================================
// Types
// ============================================

export interface UseShadowPayConfig {
  apiKey?: string;
  walletAddress?: string;
  network?: "solana-mainnet" | "solana-devnet";
  autoInitialize?: boolean;
}

export interface UseShadowPayReturn {
  // State
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  poolBalance: PoolBalance | null;
  escrowBalance: EscrowBalance | null;

  // API Key Management
  generateApiKey: (walletAddress: string, treasuryWallet?: string) => Promise<string>;
  setApiKey: (apiKey: string) => void;

  // Pool Operations
  getPoolBalance: (walletAddress: string) => Promise<PoolBalance>;
  depositToPool: (walletAddress: string, amount: number) => Promise<{ unsignedTx: string }>;
  withdrawFromPool: (walletAddress: string, amount: number) => Promise<{ success: boolean; amountWithdrawn: number }>;

  // Escrow Operations
  getEscrowBalance: (walletAddress: string) => Promise<EscrowBalance>;
  depositToEscrow: (walletAddress: string, amount: number) => Promise<{ unsignedTx: string }>;
  withdrawFromEscrow: (walletAddress: string, amount: number) => Promise<{ unsignedTx: string }>;

  // Payment Intents
  createPaymentIntent: (amount?: number) => Promise<PaymentIntent>;
  verifyPayment: (invoiceId: string, signature: string) => Promise<{ status: string; receipt: Receipt }>;

  // ZK Payments
  prepareZKPayment: (receiverCommitment: string, amount: number, tokenMint?: string) => Promise<{
    commitment: string;
    nullifier: string;
    unsignedTx: string;
  }>;
  authorizePayment: (commitment: string, nullifier: string, amount: number, merchant: string) => Promise<PaymentAuthorization>;
  settleZKPayment: (commitment: string, proof: string, publicSignals: string[]) => Promise<{ success: boolean; signature?: string }>;

  // Refresh
  refreshBalances: (walletAddress: string) => Promise<void>;
}

// ============================================
// Hook
// ============================================

export function useShadowPay(config?: UseShadowPayConfig): UseShadowPayReturn {
  const [client, setClient] = useState<ShadowPayClient | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [poolBalance, setPoolBalance] = useState<PoolBalance | null>(null);
  const [escrowBalance, setEscrowBalance] = useState<EscrowBalance | null>(null);

  // Initialize client
  useEffect(() => {
    const initClient = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const shadowPayConfig: ShadowPayConfig = {
          apiKey: config?.apiKey,
          walletAddress: config?.walletAddress,
          network: config?.network || "solana-mainnet",
        };

        const newClient = getShadowPayClient(shadowPayConfig);
        setClient(newClient);
        setIsInitialized(true);

        // Auto-fetch balances if wallet provided
        if (config?.walletAddress && config?.autoInitialize !== false) {
          try {
            const [pool, escrow] = await Promise.all([
              newClient.getPoolBalance(config.walletAddress),
              newClient.getEscrowBalance(config.walletAddress),
            ]);
            setPoolBalance(pool);
            setEscrowBalance(escrow);
          } catch {
            // Balances may not exist yet
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to initialize ShadowPay";
        setError(message);
        console.error("ShadowPay initialization error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    initClient();
  }, [config?.apiKey, config?.walletAddress, config?.network, config?.autoInitialize]);

  // ============================================
  // API Key Management
  // ============================================

  const generateApiKey = useCallback(
    async (walletAddress: string, treasuryWallet?: string): Promise<string> => {
      if (!client) throw new Error("ShadowPay not initialized");

      setIsLoading(true);
      setError(null);

      try {
        const result = await client.generateApiKey(walletAddress, treasuryWallet);
        setShadowPayApiKey(result.api_key);
        return result.api_key;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to generate API key";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  const setApiKey = useCallback((apiKey: string) => {
    setShadowPayApiKey(apiKey);
  }, []);

  // ============================================
  // Pool Operations
  // ============================================

  const getPoolBalance = useCallback(
    async (walletAddress: string): Promise<PoolBalance> => {
      if (!client) throw new Error("ShadowPay not initialized");

      const balance = await client.getPoolBalance(walletAddress);
      setPoolBalance(balance);
      return balance;
    },
    [client]
  );

  const depositToPool = useCallback(
    async (walletAddress: string, amount: number): Promise<{ unsignedTx: string }> => {
      if (!client) throw new Error("ShadowPay not initialized");

      setIsLoading(true);
      setError(null);

      try {
        const lamports = Math.floor(amount * 1e9);
        const result = await client.depositToPool(walletAddress, lamports);
        return { unsignedTx: result.unsigned_tx_base64 };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to deposit to pool";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  const withdrawFromPool = useCallback(
    async (walletAddress: string, amount: number): Promise<{ success: boolean; amountWithdrawn: number }> => {
      if (!client) throw new Error("ShadowPay not initialized");

      setIsLoading(true);
      setError(null);

      try {
        const lamports = Math.floor(amount * 1e9);
        const result = await client.withdrawFromPool(walletAddress, lamports);
        return {
          success: result.success,
          amountWithdrawn: result.amount_withdrawn / 1e9,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to withdraw from pool";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  // ============================================
  // Escrow Operations
  // ============================================

  const getEscrowBalance = useCallback(
    async (walletAddress: string): Promise<EscrowBalance> => {
      if (!client) throw new Error("ShadowPay not initialized");

      const balance = await client.getEscrowBalance(walletAddress);
      setEscrowBalance(balance);
      return balance;
    },
    [client]
  );

  const depositToEscrow = useCallback(
    async (walletAddress: string, amount: number): Promise<{ unsignedTx: string }> => {
      if (!client) throw new Error("ShadowPay not initialized");

      setIsLoading(true);
      setError(null);

      try {
        const lamports = Math.floor(amount * 1e9);
        const result = await client.depositToEscrow(walletAddress, lamports);
        return { unsignedTx: result.unsigned_tx_base64 };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to deposit to escrow";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  const withdrawFromEscrow = useCallback(
    async (walletAddress: string, amount: number): Promise<{ unsignedTx: string }> => {
      if (!client) throw new Error("ShadowPay not initialized");

      setIsLoading(true);
      setError(null);

      try {
        const lamports = Math.floor(amount * 1e9);
        const result = await client.withdrawFromEscrow(walletAddress, lamports);
        return { unsignedTx: result.unsigned_tx_base64 };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to withdraw from escrow";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  // ============================================
  // Payment Intents
  // ============================================

  const createPaymentIntent = useCallback(
    async (amount?: number): Promise<PaymentIntent> => {
      if (!client) throw new Error("ShadowPay not initialized");

      setIsLoading(true);
      setError(null);

      try {
        const lamports = amount ? Math.floor(amount * 1e9) : undefined;
        return await client.createPaymentIntent(lamports);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create payment intent";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  const verifyPayment = useCallback(
    async (invoiceId: string, signature: string): Promise<{ status: string; receipt: Receipt }> => {
      if (!client) throw new Error("ShadowPay not initialized");

      return client.verifyPayment(invoiceId, signature);
    },
    [client]
  );

  // ============================================
  // ZK Payments
  // ============================================

  const prepareZKPayment = useCallback(
    async (
      receiverCommitment: string,
      amount: number,
      tokenMint?: string
    ): Promise<{ commitment: string; nullifier: string; unsignedTx: string }> => {
      if (!client) throw new Error("ShadowPay not initialized");

      setIsLoading(true);
      setError(null);

      try {
        const lamports = Math.floor(amount * 1e9);
        const result = await client.prepareZKPayment(receiverCommitment, lamports, tokenMint);
        return {
          commitment: result.payment_commitment,
          nullifier: result.payment_nullifier,
          unsignedTx: result.unsigned_tx_base64,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to prepare ZK payment";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  const authorizePayment = useCallback(
    async (
      commitment: string,
      nullifier: string,
      amount: number,
      merchant: string
    ): Promise<PaymentAuthorization> => {
      if (!client) throw new Error("ShadowPay not initialized");

      setIsLoading(true);
      setError(null);

      try {
        const lamports = Math.floor(amount * 1e9);
        return await client.authorizePayment(commitment, nullifier, lamports, merchant);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to authorize payment";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  const settleZKPayment = useCallback(
    async (
      commitment: string,
      proof: string,
      publicSignals: string[]
    ): Promise<{ success: boolean; signature?: string }> => {
      if (!client) throw new Error("ShadowPay not initialized");

      setIsLoading(true);
      setError(null);

      try {
        const result = await client.settleZKPayment(commitment, proof, publicSignals);
        return {
          success: result.success,
          signature: result.signature,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to settle ZK payment";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  // ============================================
  // Refresh
  // ============================================

  const refreshBalances = useCallback(
    async (walletAddress: string): Promise<void> => {
      if (!client) return;

      try {
        const [pool, escrow] = await Promise.all([
          client.getPoolBalance(walletAddress),
          client.getEscrowBalance(walletAddress),
        ]);
        setPoolBalance(pool);
        setEscrowBalance(escrow);
      } catch (err) {
        console.error("Failed to refresh balances:", err);
      }
    },
    [client]
  );

  return {
    // State
    isInitialized,
    isLoading,
    error,
    poolBalance,
    escrowBalance,

    // API Key Management
    generateApiKey,
    setApiKey,

    // Pool Operations
    getPoolBalance,
    depositToPool,
    withdrawFromPool,

    // Escrow Operations
    getEscrowBalance,
    depositToEscrow,
    withdrawFromEscrow,

    // Payment Intents
    createPaymentIntent,
    verifyPayment,

    // ZK Payments
    prepareZKPayment,
    authorizePayment,
    settleZKPayment,

    // Refresh
    refreshBalances,
  };
}

export default useShadowPay;
