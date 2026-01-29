"use client";

import { useCallback, useEffect, useState } from "react";
import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  PrivacyCashClient,
  createPrivacyCashClient,
  type PrivateBalance,
  type SPLTokenBalance,
  type DepositResult,
  type WithdrawResult,
  SPL_TOKENS,
} from "@/lib/privacy/privacy-cash-client";

const RPC_ENDPOINT =
  process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || "https://api.devnet.solana.com";

export interface UsePrivacyCashReturn {
  // State
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;

  // Balances
  privateSOLBalance: PrivateBalance | null;
  privateUSDCBalance: SPLTokenBalance | null;
  privateUSDTBalance: SPLTokenBalance | null;

  // SOL Operations
  depositSOL: (amount: number) => Promise<DepositResult>;
  withdrawSOL: (amount: number, recipient?: string) => Promise<WithdrawResult>;
  refreshSOLBalance: () => Promise<void>;

  // USDC Operations
  depositUSDC: (amount: number) => Promise<DepositResult>;
  withdrawUSDC: (amount: number, recipient?: string) => Promise<WithdrawResult>;
  refreshUSDCBalance: () => Promise<void>;

  // USDT Operations
  depositUSDT: (amount: number) => Promise<DepositResult>;
  withdrawUSDT: (amount: number, recipient?: string) => Promise<WithdrawResult>;
  refreshUSDTBalance: () => Promise<void>;

  // Generic SPL Operations
  depositSPL: (mintAddress: string, amount: number) => Promise<DepositResult>;
  withdrawSPL: (
    mintAddress: string,
    amount: number,
    recipient?: string
  ) => Promise<WithdrawResult>;
  getSPLBalance: (mintAddress: string) => Promise<SPLTokenBalance>;

  // Utilities
  clearCache: () => Promise<void>;
  refreshAllBalances: () => Promise<void>;
}

export function usePrivacyCash(
  ownerKeypair?: Keypair | string
): UsePrivacyCashReturn {
  const [client, setClient] = useState<PrivacyCashClient | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Balances
  const [privateSOLBalance, setPrivateSOLBalance] =
    useState<PrivateBalance | null>(null);
  const [privateUSDCBalance, setPrivateUSDCBalance] =
    useState<SPLTokenBalance | null>(null);
  const [privateUSDTBalance, setPrivateUSDTBalance] =
    useState<SPLTokenBalance | null>(null);

  // Initialize client when keypair is available
  useEffect(() => {
    if (!ownerKeypair) return;

    const initClient = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const newClient = createPrivacyCashClient({
          rpcUrl: RPC_ENDPOINT,
          owner: ownerKeypair,
          enableDebug: process.env.NODE_ENV === "development",
        });

        await newClient.initialize();
        setClient(newClient);
        setIsInitialized(true);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to initialize Privacy Cash";
        setError(message);
        console.error("Privacy Cash initialization error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    initClient();
  }, [ownerKeypair]);

  // ============================================
  // SOL Operations
  // ============================================

  const depositSOL = useCallback(
    async (amount: number): Promise<DepositResult> => {
      if (!client) throw new Error("Privacy Cash not initialized");

      setIsLoading(true);
      setError(null);

      try {
        const lamports = BigInt(Math.floor(amount * LAMPORTS_PER_SOL));
        const result = await client.depositSOL(lamports);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Deposit failed";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  const withdrawSOL = useCallback(
    async (amount: number, recipient?: string): Promise<WithdrawResult> => {
      if (!client) throw new Error("Privacy Cash not initialized");

      setIsLoading(true);
      setError(null);

      try {
        const lamports = BigInt(Math.floor(amount * LAMPORTS_PER_SOL));
        const result = await client.withdrawSOL(lamports, recipient);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Withdrawal failed";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  const refreshSOLBalance = useCallback(async () => {
    if (!client) return;

    try {
      const balance = await client.getPrivateSOLBalance();
      setPrivateSOLBalance(balance);
    } catch (err) {
      console.error("Failed to refresh SOL balance:", err);
    }
  }, [client]);

  // ============================================
  // USDC Operations
  // ============================================

  const depositUSDC = useCallback(
    async (amount: number): Promise<DepositResult> => {
      if (!client) throw new Error("Privacy Cash not initialized");

      setIsLoading(true);
      setError(null);

      try {
        // USDC has 6 decimals
        const baseUnits = BigInt(Math.floor(amount * 1_000_000));
        const result = await client.depositUSDC(baseUnits);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "USDC deposit failed";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  const withdrawUSDC = useCallback(
    async (amount: number, recipient?: string): Promise<WithdrawResult> => {
      if (!client) throw new Error("Privacy Cash not initialized");

      setIsLoading(true);
      setError(null);

      try {
        const baseUnits = BigInt(Math.floor(amount * 1_000_000));
        const result = await client.withdrawUSDC(baseUnits, recipient);
        return result;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "USDC withdrawal failed";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  const refreshUSDCBalance = useCallback(async () => {
    if (!client) return;

    try {
      const balance = await client.getPrivateUSDCBalance();
      setPrivateUSDCBalance(balance);
    } catch (err) {
      console.error("Failed to refresh USDC balance:", err);
    }
  }, [client]);

  // ============================================
  // USDT Operations
  // ============================================

  const depositUSDT = useCallback(
    async (amount: number): Promise<DepositResult> => {
      if (!client) throw new Error("Privacy Cash not initialized");

      setIsLoading(true);
      setError(null);

      try {
        // USDT has 6 decimals
        const baseUnits = BigInt(Math.floor(amount * 1_000_000));
        const result = await client.depositUSDT(baseUnits);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "USDT deposit failed";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  const withdrawUSDT = useCallback(
    async (amount: number, recipient?: string): Promise<WithdrawResult> => {
      if (!client) throw new Error("Privacy Cash not initialized");

      setIsLoading(true);
      setError(null);

      try {
        const baseUnits = BigInt(Math.floor(amount * 1_000_000));
        const result = await client.withdrawUSDT(baseUnits, recipient);
        return result;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "USDT withdrawal failed";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  const refreshUSDTBalance = useCallback(async () => {
    if (!client) return;

    try {
      const balance = await client.getPrivateUSDTBalance();
      setPrivateUSDTBalance(balance);
    } catch (err) {
      console.error("Failed to refresh USDT balance:", err);
    }
  }, [client]);

  // ============================================
  // Generic SPL Operations
  // ============================================

  const depositSPL = useCallback(
    async (mintAddress: string, amount: number): Promise<DepositResult> => {
      if (!client) throw new Error("Privacy Cash not initialized");

      setIsLoading(true);
      setError(null);

      try {
        // Assume 6 decimals for most SPL tokens (adjust per token as needed)
        const baseUnits = BigInt(Math.floor(amount * 1_000_000));
        const result = await client.depositSPL(mintAddress, baseUnits);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "SPL deposit failed";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  const withdrawSPL = useCallback(
    async (
      mintAddress: string,
      amount: number,
      recipient?: string
    ): Promise<WithdrawResult> => {
      if (!client) throw new Error("Privacy Cash not initialized");

      setIsLoading(true);
      setError(null);

      try {
        const baseUnits = BigInt(Math.floor(amount * 1_000_000));
        const result = await client.withdrawSPL(
          mintAddress,
          baseUnits,
          recipient
        );
        return result;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "SPL withdrawal failed";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  const getSPLBalance = useCallback(
    async (mintAddress: string): Promise<SPLTokenBalance> => {
      if (!client) throw new Error("Privacy Cash not initialized");

      return client.getPrivateSPLBalance(mintAddress);
    },
    [client]
  );

  // ============================================
  // Utilities
  // ============================================

  const clearCache = useCallback(async () => {
    if (!client) return;
    await client.clearCache();
  }, [client]);

  const refreshAllBalances = useCallback(async () => {
    await Promise.all([
      refreshSOLBalance(),
      refreshUSDCBalance(),
      refreshUSDTBalance(),
    ]);
  }, [refreshSOLBalance, refreshUSDCBalance, refreshUSDTBalance]);

  return {
    // State
    isInitialized,
    isLoading,
    error,

    // Balances
    privateSOLBalance,
    privateUSDCBalance,
    privateUSDTBalance,

    // SOL Operations
    depositSOL,
    withdrawSOL,
    refreshSOLBalance,

    // USDC Operations
    depositUSDC,
    withdrawUSDC,
    refreshUSDCBalance,

    // USDT Operations
    depositUSDT,
    withdrawUSDT,
    refreshUSDTBalance,

    // Generic SPL Operations
    depositSPL,
    withdrawSPL,
    getSPLBalance,

    // Utilities
    clearCache,
    refreshAllBalances,
  };
}

export default usePrivacyCash;
