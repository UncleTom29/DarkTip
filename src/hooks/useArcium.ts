"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArciumClient,
  createArciumClient,
  type ArciumConfig,
  type EncryptedAmount,
  type SubscriptionState,
  type TipRecord,
  type MilestoneProgress,
  type ArciumProof,
  type EncryptedState,
} from "@/lib/arcium";

const DEFAULT_CONFIG: ArciumConfig = {
  network:
    (process.env.NEXT_PUBLIC_SOLANA_NETWORK as ArciumConfig["network"]) ||
    "devnet",
  rpcUrl:
    process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT ||
    "https://api.devnet.solana.com",
};

export interface UseArciumReturn {
  // State
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;

  // Amount Operations
  encryptAmount: (amount: bigint) => Promise<EncryptedAmount>;
  addEncryptedAmounts: (
    a: EncryptedAmount,
    b: EncryptedAmount
  ) => Promise<EncryptedAmount>;

  // Subscription Operations
  createSubscription: (
    subscriberId: string,
    creatorId: string,
    tier: SubscriptionState["tier"],
    durationDays: number
  ) => Promise<{ state: EncryptedState; accountAddress: string }>;
  verifySubscription: (
    subscriberId: string,
    creatorId: string
  ) => Promise<boolean>;
  proveSubscriptionTier: (
    subscriberId: string,
    creatorId: string,
    minimumTier: SubscriptionState["tier"]
  ) => Promise<ArciumProof>;

  // Tip Operations
  createPrivateTip: (
    senderId: string,
    recipientId: string,
    amount: bigint,
    memo?: string
  ) => Promise<TipRecord>;
  aggregateTips: (
    creatorId: string,
    tips: TipRecord[]
  ) => Promise<EncryptedAmount>;

  // Milestone Operations
  createMilestone: (
    milestoneId: string,
    targetAmount: number
  ) => Promise<MilestoneProgress>;
  contributeTomilestone: (
    progress: MilestoneProgress,
    amount: bigint
  ) => Promise<MilestoneProgress>;
  proveMilestoneCompletion: (milestoneId: string) => Promise<ArciumProof>;

  // Supporter Verification
  generateSupporterProof: (
    supporterId: string,
    creatorId: string,
    minimumAmount: bigint
  ) => Promise<ArciumProof>;
  verifySupporterProof: (proof: ArciumProof) => Promise<boolean>;
}

export function useArcium(config?: Partial<ArciumConfig>): UseArciumReturn {
  const [client, setClient] = useState<ArciumClient | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize client
  useEffect(() => {
    const initClient = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const fullConfig: ArciumConfig = {
          ...DEFAULT_CONFIG,
          ...config,
        };

        const newClient = createArciumClient(fullConfig);
        await newClient.initialize();

        setClient(newClient);
        setIsInitialized(true);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to initialize Arcium";
        setError(message);
        console.error("Arcium initialization error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    initClient();
  }, [config]);

  // ============================================
  // Amount Operations
  // ============================================

  const encryptAmount = useCallback(
    async (amount: bigint): Promise<EncryptedAmount> => {
      if (!client) throw new Error("Arcium not initialized");
      return client.encryptAmount(amount);
    },
    [client]
  );

  const addEncryptedAmounts = useCallback(
    async (a: EncryptedAmount, b: EncryptedAmount): Promise<EncryptedAmount> => {
      if (!client) throw new Error("Arcium not initialized");
      return client.addEncryptedAmounts(a, b);
    },
    [client]
  );

  // ============================================
  // Subscription Operations
  // ============================================

  const createSubscription = useCallback(
    async (
      subscriberId: string,
      creatorId: string,
      tier: SubscriptionState["tier"],
      durationDays: number
    ) => {
      if (!client) throw new Error("Arcium not initialized");

      setIsLoading(true);
      setError(null);

      try {
        const result = await client.createSubscriptionState(
          subscriberId,
          creatorId,
          tier,
          durationDays
        );
        return {
          state: result.state,
          accountAddress: result.account.toBase58(),
        };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to create subscription";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  const verifySubscription = useCallback(
    async (subscriberId: string, creatorId: string): Promise<boolean> => {
      if (!client) throw new Error("Arcium not initialized");

      try {
        const result = await client.verifySubscriptionActive(
          subscriberId,
          creatorId
        );
        return result.result;
      } catch (err) {
        console.error("Subscription verification failed:", err);
        return false;
      }
    },
    [client]
  );

  const proveSubscriptionTier = useCallback(
    async (
      subscriberId: string,
      creatorId: string,
      minimumTier: SubscriptionState["tier"]
    ): Promise<ArciumProof> => {
      if (!client) throw new Error("Arcium not initialized");
      return client.proveSubscriptionTier(subscriberId, creatorId, minimumTier);
    },
    [client]
  );

  // ============================================
  // Tip Operations
  // ============================================

  const createPrivateTip = useCallback(
    async (
      senderId: string,
      recipientId: string,
      amount: bigint,
      memo?: string
    ): Promise<TipRecord> => {
      if (!client) throw new Error("Arcium not initialized");

      setIsLoading(true);
      setError(null);

      try {
        return await client.createPrivateTip(senderId, recipientId, amount, memo);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to create private tip";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  const aggregateTips = useCallback(
    async (creatorId: string, tips: TipRecord[]): Promise<EncryptedAmount> => {
      if (!client) throw new Error("Arcium not initialized");
      return client.aggregateTips(creatorId, tips);
    },
    [client]
  );

  // ============================================
  // Milestone Operations
  // ============================================

  const createMilestone = useCallback(
    async (
      milestoneId: string,
      targetAmount: number
    ): Promise<MilestoneProgress> => {
      if (!client) throw new Error("Arcium not initialized");

      setIsLoading(true);
      setError(null);

      try {
        return await client.createMilestoneTracker(milestoneId, targetAmount);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to create milestone";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  const contributeTomilestone = useCallback(
    async (
      progress: MilestoneProgress,
      amount: bigint
    ): Promise<MilestoneProgress> => {
      if (!client) throw new Error("Arcium not initialized");

      setIsLoading(true);
      setError(null);

      try {
        return await client.addMilestoneContribution(progress, amount);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to contribute to milestone";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  const proveMilestoneCompletion = useCallback(
    async (milestoneId: string): Promise<ArciumProof> => {
      if (!client) throw new Error("Arcium not initialized");
      return client.proveMilestoneCompletion(milestoneId);
    },
    [client]
  );

  // ============================================
  // Supporter Verification
  // ============================================

  const generateSupporterProof = useCallback(
    async (
      supporterId: string,
      creatorId: string,
      minimumAmount: bigint
    ): Promise<ArciumProof> => {
      if (!client) throw new Error("Arcium not initialized");

      setIsLoading(true);
      setError(null);

      try {
        return await client.generateSupporterProof(
          supporterId,
          creatorId,
          minimumAmount
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to generate proof";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  const verifySupporterProof = useCallback(
    async (proof: ArciumProof): Promise<boolean> => {
      if (!client) throw new Error("Arcium not initialized");
      return client.verifySupporterProof(proof);
    },
    [client]
  );

  return {
    // State
    isInitialized,
    isLoading,
    error,

    // Amount Operations
    encryptAmount,
    addEncryptedAmounts,

    // Subscription Operations
    createSubscription,
    verifySubscription,
    proveSubscriptionTier,

    // Tip Operations
    createPrivateTip,
    aggregateTips,

    // Milestone Operations
    createMilestone,
    contributeTomilestone,
    proveMilestoneCompletion,

    // Supporter Verification
    generateSupporterProof,
    verifySupporterProof,
  };
}

export default useArcium;
