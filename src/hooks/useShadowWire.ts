"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ShadowWireClient,
  getShadowWireClient,
  type SupportedToken,
  type ShieldedBalance,
  type PrivateTransferResult,
  type ViewKey,
} from "@/lib/shadowwire";

// ============================================
// Types
// ============================================

export interface UseShadowWireConfig {
  walletAddress?: string;
  autoInitialize?: boolean;
}

export interface UseShadowWireReturn {
  // State
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  shieldedBalances: Map<SupportedToken, ShieldedBalance>;

  // Balance Operations
  getShieldedBalance: (wallet: string, token: SupportedToken) => Promise<ShieldedBalance | null>;
  getAllShieldedBalances: (wallet: string) => Promise<Map<SupportedToken, ShieldedBalance>>;
  refreshBalances: () => Promise<void>;

  // Shield/Unshield Operations
  shieldTokens: (wallet: string, amount: number, token: SupportedToken) => Promise<{
    success: boolean;
    commitment?: string;
    error?: string;
  }>;
  unshieldTokens: (wallet: string, amount: number, token: SupportedToken) => Promise<{
    success: boolean;
    txSignature?: string;
    error?: string;
  }>;

  // Private Transfers
  privateTransfer: (
    sender: string,
    recipient: string,
    amount: number,
    token: SupportedToken,
    memo?: string
  ) => Promise<PrivateTransferResult>;

  // View Keys
  exportViewKey: (wallet: string, token: SupportedToken) => Promise<ViewKey | null>;
  importViewKey: (viewKey: ViewKey) => Promise<boolean>;

  // Compliance
  generateComplianceProof: (wallet: string, token: SupportedToken) => Promise<{
    proof: { commitment: string; timestamp: number } | null;
  }>;
}

// ============================================
// Hook
// ============================================

export function useShadowWire(config?: UseShadowWireConfig): UseShadowWireReturn {
  const [client, setClient] = useState<ShadowWireClient | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shieldedBalances, setShieldedBalances] = useState<Map<SupportedToken, ShieldedBalance>>(
    new Map()
  );

  const walletAddress = config?.walletAddress;

  // Initialize client
  useEffect(() => {
    const initClient = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const newClient = getShadowWireClient();
        setClient(newClient);
        setIsInitialized(true);

        // Auto-fetch balances if wallet provided
        if (walletAddress && config?.autoInitialize !== false) {
          const balances = await newClient.getAllShieldedBalances(walletAddress);
          setShieldedBalances(balances);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to initialize ShadowWire";
        setError(message);
        console.error("ShadowWire initialization error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    initClient();
  }, [walletAddress, config?.autoInitialize]);

  // ============================================
  // Balance Operations
  // ============================================

  const getShieldedBalance = useCallback(
    async (wallet: string, token: SupportedToken): Promise<ShieldedBalance | null> => {
      if (!client) throw new Error("ShadowWire not initialized");

      try {
        const balance = await client.getShieldedBalance(wallet, token);
        if (balance) {
          setShieldedBalances((prev) => {
            const newMap = new Map(prev);
            newMap.set(token, balance);
            return newMap;
          });
        }
        return balance;
      } catch (err) {
        console.error("Failed to get shielded balance:", err);
        return null;
      }
    },
    [client]
  );

  const getAllShieldedBalances = useCallback(
    async (wallet: string): Promise<Map<SupportedToken, ShieldedBalance>> => {
      if (!client) throw new Error("ShadowWire not initialized");

      const balances = await client.getAllShieldedBalances(wallet);
      setShieldedBalances(balances);
      return balances;
    },
    [client]
  );

  const refreshBalances = useCallback(async () => {
    if (!client || !walletAddress) return;

    try {
      const balances = await client.getAllShieldedBalances(walletAddress);
      setShieldedBalances(balances);
    } catch (err) {
      console.error("Failed to refresh balances:", err);
    }
  }, [client, walletAddress]);

  // ============================================
  // Shield/Unshield Operations
  // ============================================

  const shieldTokens = useCallback(
    async (
      wallet: string,
      amount: number,
      token: SupportedToken
    ): Promise<{ success: boolean; commitment?: string; error?: string }> => {
      if (!client) throw new Error("ShadowWire not initialized");

      setIsLoading(true);
      setError(null);

      try {
        const result = await client.shieldTokens(wallet, amount, token);

        // Refresh balance after shielding
        if (result.success) {
          await getShieldedBalance(wallet, token);
        }

        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to shield tokens";
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    [client, getShieldedBalance]
  );

  const unshieldTokens = useCallback(
    async (
      wallet: string,
      amount: number,
      token: SupportedToken
    ): Promise<{ success: boolean; txSignature?: string; error?: string }> => {
      if (!client) throw new Error("ShadowWire not initialized");

      setIsLoading(true);
      setError(null);

      try {
        const result = await client.unshieldTokens(wallet, amount, token);

        // Refresh balance after unshielding
        if (result.success) {
          await getShieldedBalance(wallet, token);
        }

        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to unshield tokens";
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    [client, getShieldedBalance]
  );

  // ============================================
  // Private Transfers
  // ============================================

  const privateTransfer = useCallback(
    async (
      sender: string,
      recipient: string,
      amount: number,
      token: SupportedToken,
      memo?: string
    ): Promise<PrivateTransferResult> => {
      if (!client) throw new Error("ShadowWire not initialized");

      setIsLoading(true);
      setError(null);

      try {
        const result = await client.privateTransfer(sender, recipient, amount, token, memo);

        // Refresh sender balance after transfer
        if (result.success) {
          await getShieldedBalance(sender, token);
        }

        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to execute private transfer";
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    [client, getShieldedBalance]
  );

  // ============================================
  // View Keys
  // ============================================

  const exportViewKey = useCallback(
    async (wallet: string, token: SupportedToken): Promise<ViewKey | null> => {
      if (!client) throw new Error("ShadowWire not initialized");

      try {
        return await client.exportViewKey(wallet, token);
      } catch (err) {
        console.error("Failed to export view key:", err);
        return null;
      }
    },
    [client]
  );

  const importViewKey = useCallback(
    async (viewKey: ViewKey): Promise<boolean> => {
      if (!client) throw new Error("ShadowWire not initialized");

      try {
        return await client.importViewKey(viewKey);
      } catch (err) {
        console.error("Failed to import view key:", err);
        return false;
      }
    },
    [client]
  );

  // ============================================
  // Compliance
  // ============================================

  const generateComplianceProof = useCallback(
    async (
      wallet: string,
      token: SupportedToken
    ): Promise<{ proof: { commitment: string; timestamp: number } | null }> => {
      if (!client) throw new Error("ShadowWire not initialized");

      try {
        const result = await client.generateComplianceProof(wallet, token);
        return {
          proof: result.proof
            ? {
                commitment: result.proof.commitment,
                timestamp: Date.now(),
              }
            : null,
        };
      } catch (err) {
        console.error("Failed to generate compliance proof:", err);
        return { proof: null };
      }
    },
    [client]
  );

  return {
    // State
    isInitialized,
    isLoading,
    error,
    shieldedBalances,

    // Balance Operations
    getShieldedBalance,
    getAllShieldedBalances,
    refreshBalances,

    // Shield/Unshield Operations
    shieldTokens,
    unshieldTokens,

    // Private Transfers
    privateTransfer,

    // View Keys
    exportViewKey,
    importViewKey,

    // Compliance
    generateComplianceProof,
  };
}

export default useShadowWire;
