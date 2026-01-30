"use client";

import { useCallback, useEffect, useState } from "react";
import {
  EscrowService,
  getEscrowService,
  type Escrow,
  type EscrowType,
  type EscrowStatus,
  type EscrowConfig,
  type ReleaseCondition,
} from "@/lib/shadowpay/escrow";
import { type SupportedToken } from "@/lib/shadowpay/zk-payments";

// ============================================
// Types
// ============================================

export interface UseEscrowConfig {
  walletAddress?: string;
  autoLoad?: boolean;
}

export interface UseEscrowReturn {
  // State
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  escrows: Escrow[];
  stats: EscrowStats | null;

  // Create Escrow
  createTipEscrow: (
    recipient: string,
    amount: number,
    token?: SupportedToken,
    options?: {
      message?: string;
      expiresInHours?: number;
      requireRecipientAction?: boolean;
    }
  ) => Promise<{ success: boolean; escrow?: Escrow; unsignedTx?: string; error?: string }>;

  createGrantEscrow: (
    recipient: string,
    totalAmount: number,
    token: SupportedToken,
    milestones: Array<{
      description: string;
      percentage: number;
      dueDate?: number;
    }>
  ) => Promise<{ success: boolean; escrow?: Escrow; unsignedTx?: string; error?: string }>;

  createBountyEscrow: (
    amount: number,
    token: SupportedToken,
    options: {
      title: string;
      description: string;
      expiresInDays: number;
      requiredSkills?: string[];
    }
  ) => Promise<{ success: boolean; escrow?: Escrow; unsignedTx?: string; error?: string }>;

  // Escrow Operations
  confirmFunding: (escrowId: string, txSignature: string) => Promise<{ success: boolean; error?: string }>;
  releaseEscrow: (escrowId: string, partialAmount?: number) => Promise<{ success: boolean; amountReleased?: number; error?: string }>;
  releaseMilestone: (escrowId: string, milestoneIndex: number) => Promise<{ success: boolean; amountReleased?: number; error?: string }>;
  refundEscrow: (escrowId: string, reason?: string) => Promise<{ success: boolean; error?: string }>;

  // Disputes
  openDispute: (escrowId: string, reason: string) => Promise<{ success: boolean; disputeId?: string; error?: string }>;
  resolveDispute: (escrowId: string, resolution: "release" | "refund") => Promise<{ success: boolean; error?: string }>;

  // Queries
  getEscrow: (escrowId: string) => Promise<Escrow | null>;
  getEscrowsForWallet: (options?: {
    type?: EscrowType;
    status?: EscrowStatus;
    role?: "sender" | "recipient" | "both";
  }) => Promise<Escrow[]>;
  getEscrowStats: () => Promise<EscrowStats>;

  // Refresh
  refreshEscrows: () => Promise<void>;
}

export interface EscrowStats {
  totalCreated: number;
  totalReceived: number;
  totalValueCreated: Record<SupportedToken, number>;
  totalValueReceived: Record<SupportedToken, number>;
  activeEscrows: number;
  completedEscrows: number;
  disputedEscrows: number;
}

// ============================================
// Hook
// ============================================

export function useEscrow(config?: UseEscrowConfig): UseEscrowReturn {
  const [service, setService] = useState<EscrowService | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [escrows, setEscrows] = useState<Escrow[]>([]);
  const [stats, setStats] = useState<EscrowStats | null>(null);

  const walletAddress = config?.walletAddress;

  // Initialize service
  useEffect(() => {
    const initService = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const escrowService = getEscrowService();
        setService(escrowService);
        setIsInitialized(true);

        // Auto-load escrows if wallet provided
        if (walletAddress && config?.autoLoad !== false) {
          const userEscrows = await escrowService.getEscrowsForWallet(walletAddress);
          setEscrows(userEscrows);

          const userStats = await escrowService.getEscrowStats(walletAddress);
          setStats(userStats);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to initialize escrow service";
        setError(message);
        console.error("Escrow initialization error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    initService();
  }, [walletAddress, config?.autoLoad]);

  // ============================================
  // Create Escrow
  // ============================================

  const createTipEscrow = useCallback(
    async (
      recipient: string,
      amount: number,
      token: SupportedToken = "SOL",
      options?: {
        message?: string;
        expiresInHours?: number;
        requireRecipientAction?: boolean;
      }
    ): Promise<{ success: boolean; escrow?: Escrow; unsignedTx?: string; error?: string }> => {
      if (!service) return { success: false, error: "Service not initialized" };
      if (!walletAddress) return { success: false, error: "Wallet not connected" };

      setIsLoading(true);
      setError(null);

      try {
        const result = await service.createTipEscrow(
          walletAddress,
          recipient,
          amount,
          token,
          options
        );

        if (result.success && result.escrow) {
          setEscrows((prev) => [...prev, result.escrow!]);
        }

        return {
          success: result.success,
          escrow: result.escrow,
          unsignedTx: result.unsignedTx?.unsigned_tx_base64,
          error: result.error,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create tip escrow";
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    [service, walletAddress]
  );

  const createGrantEscrow = useCallback(
    async (
      recipient: string,
      totalAmount: number,
      token: SupportedToken,
      milestones: Array<{
        description: string;
        percentage: number;
        dueDate?: number;
      }>
    ): Promise<{ success: boolean; escrow?: Escrow; unsignedTx?: string; error?: string }> => {
      if (!service) return { success: false, error: "Service not initialized" };
      if (!walletAddress) return { success: false, error: "Wallet not connected" };

      setIsLoading(true);
      setError(null);

      try {
        const result = await service.createGrantEscrow(
          walletAddress,
          recipient,
          totalAmount,
          token,
          milestones
        );

        if (result.success && result.escrow) {
          setEscrows((prev) => [...prev, result.escrow!]);
        }

        return {
          success: result.success,
          escrow: result.escrow,
          unsignedTx: result.unsignedTx?.unsigned_tx_base64,
          error: result.error,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create grant escrow";
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    [service, walletAddress]
  );

  const createBountyEscrow = useCallback(
    async (
      amount: number,
      token: SupportedToken,
      options: {
        title: string;
        description: string;
        expiresInDays: number;
        requiredSkills?: string[];
      }
    ): Promise<{ success: boolean; escrow?: Escrow; unsignedTx?: string; error?: string }> => {
      if (!service) return { success: false, error: "Service not initialized" };
      if (!walletAddress) return { success: false, error: "Wallet not connected" };

      setIsLoading(true);
      setError(null);

      try {
        const result = await service.createBountyEscrow(
          walletAddress,
          amount,
          token,
          options
        );

        if (result.success && result.escrow) {
          setEscrows((prev) => [...prev, result.escrow!]);
        }

        return {
          success: result.success,
          escrow: result.escrow,
          unsignedTx: result.unsignedTx?.unsigned_tx_base64,
          error: result.error,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create bounty escrow";
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    [service, walletAddress]
  );

  // ============================================
  // Escrow Operations
  // ============================================

  const confirmFunding = useCallback(
    async (
      escrowId: string,
      txSignature: string
    ): Promise<{ success: boolean; error?: string }> => {
      if (!service) return { success: false, error: "Service not initialized" };

      setIsLoading(true);
      setError(null);

      try {
        const result = await service.confirmFunding(escrowId, txSignature);

        if (result.success && result.escrow) {
          setEscrows((prev) =>
            prev.map((e) => (e.id === escrowId ? result.escrow! : e))
          );
        }

        return { success: result.success, error: result.error };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to confirm funding";
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    [service]
  );

  const releaseEscrow = useCallback(
    async (
      escrowId: string,
      partialAmount?: number
    ): Promise<{ success: boolean; amountReleased?: number; error?: string }> => {
      if (!service) return { success: false, error: "Service not initialized" };
      if (!walletAddress) return { success: false, error: "Wallet not connected" };

      setIsLoading(true);
      setError(null);

      try {
        const result = await service.releaseEscrow(escrowId, walletAddress, partialAmount);

        if (result.success) {
          // Refresh escrow state
          const updatedEscrow = await service.getEscrow(escrowId);
          if (updatedEscrow) {
            setEscrows((prev) =>
              prev.map((e) => (e.id === escrowId ? updatedEscrow : e))
            );
          }
        }

        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to release escrow";
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    [service, walletAddress]
  );

  const releaseMilestone = useCallback(
    async (
      escrowId: string,
      milestoneIndex: number
    ): Promise<{ success: boolean; amountReleased?: number; error?: string }> => {
      if (!service) return { success: false, error: "Service not initialized" };
      if (!walletAddress) return { success: false, error: "Wallet not connected" };

      setIsLoading(true);
      setError(null);

      try {
        const result = await service.releaseMilestone(escrowId, milestoneIndex, walletAddress);

        if (result.success) {
          // Refresh escrow state
          const updatedEscrow = await service.getEscrow(escrowId);
          if (updatedEscrow) {
            setEscrows((prev) =>
              prev.map((e) => (e.id === escrowId ? updatedEscrow : e))
            );
          }
        }

        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to release milestone";
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    [service, walletAddress]
  );

  const refundEscrow = useCallback(
    async (
      escrowId: string,
      reason?: string
    ): Promise<{ success: boolean; error?: string }> => {
      if (!service) return { success: false, error: "Service not initialized" };

      setIsLoading(true);
      setError(null);

      try {
        const result = await service.refundEscrow(escrowId, reason);

        if (result.success) {
          // Refresh escrow state
          const updatedEscrow = await service.getEscrow(escrowId);
          if (updatedEscrow) {
            setEscrows((prev) =>
              prev.map((e) => (e.id === escrowId ? updatedEscrow : e))
            );
          }
        }

        return { success: result.success, error: result.error };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to refund escrow";
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    [service]
  );

  // ============================================
  // Disputes
  // ============================================

  const openDispute = useCallback(
    async (
      escrowId: string,
      reason: string
    ): Promise<{ success: boolean; disputeId?: string; error?: string }> => {
      if (!service) return { success: false, error: "Service not initialized" };
      if (!walletAddress) return { success: false, error: "Wallet not connected" };

      setIsLoading(true);
      setError(null);

      try {
        const result = await service.openDispute(escrowId, walletAddress, reason);

        if (result.success) {
          // Refresh escrow state
          const updatedEscrow = await service.getEscrow(escrowId);
          if (updatedEscrow) {
            setEscrows((prev) =>
              prev.map((e) => (e.id === escrowId ? updatedEscrow : e))
            );
          }
        }

        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to open dispute";
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    [service, walletAddress]
  );

  const resolveDispute = useCallback(
    async (
      escrowId: string,
      resolution: "release" | "refund"
    ): Promise<{ success: boolean; error?: string }> => {
      if (!service) return { success: false, error: "Service not initialized" };
      if (!walletAddress) return { success: false, error: "Wallet not connected" };

      setIsLoading(true);
      setError(null);

      try {
        const result = await service.resolveDispute(escrowId, resolution, walletAddress);

        if (result.success) {
          // Refresh escrow state
          const updatedEscrow = await service.getEscrow(escrowId);
          if (updatedEscrow) {
            setEscrows((prev) =>
              prev.map((e) => (e.id === escrowId ? updatedEscrow : e))
            );
          }
        }

        return { success: result.success, error: result.error };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to resolve dispute";
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    [service, walletAddress]
  );

  // ============================================
  // Queries
  // ============================================

  const getEscrow = useCallback(
    async (escrowId: string): Promise<Escrow | null> => {
      if (!service) return null;
      return service.getEscrow(escrowId);
    },
    [service]
  );

  const getEscrowsForWallet = useCallback(
    async (options?: {
      type?: EscrowType;
      status?: EscrowStatus;
      role?: "sender" | "recipient" | "both";
    }): Promise<Escrow[]> => {
      if (!service) return [];
      if (!walletAddress) return [];

      return service.getEscrowsForWallet(walletAddress, options);
    },
    [service, walletAddress]
  );

  const getEscrowStats = useCallback(async (): Promise<EscrowStats> => {
    if (!service) throw new Error("Service not initialized");
    if (!walletAddress) throw new Error("Wallet not connected");

    const escrowStats = await service.getEscrowStats(walletAddress);
    setStats(escrowStats);
    return escrowStats;
  }, [service, walletAddress]);

  // ============================================
  // Refresh
  // ============================================

  const refreshEscrows = useCallback(async () => {
    if (!service || !walletAddress) return;

    try {
      const [userEscrows, userStats] = await Promise.all([
        service.getEscrowsForWallet(walletAddress),
        service.getEscrowStats(walletAddress),
      ]);
      setEscrows(userEscrows);
      setStats(userStats);
    } catch (err) {
      console.error("Failed to refresh escrows:", err);
    }
  }, [service, walletAddress]);

  return {
    // State
    isInitialized,
    isLoading,
    error,
    escrows,
    stats,

    // Create Escrow
    createTipEscrow,
    createGrantEscrow,
    createBountyEscrow,

    // Escrow Operations
    confirmFunding,
    releaseEscrow,
    releaseMilestone,
    refundEscrow,

    // Disputes
    openDispute,
    resolveDispute,

    // Queries
    getEscrow,
    getEscrowsForWallet,
    getEscrowStats,

    // Refresh
    refreshEscrows,
  };
}

export default useEscrow;
