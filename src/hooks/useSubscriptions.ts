"use client";

import { useCallback, useEffect, useState } from "react";
import {
  SubscriptionsService,
  getSubscriptionsService,
  type SubscriptionPlan,
  type SubscriptionWithPlan,
  type SubscriptionTier,
  type SubscriptionAnalytics,
} from "@/lib/shadowpay/subscriptions";
import { type SubscriptionFrequency } from "@/lib/shadowpay/client";

// ============================================
// Types
// ============================================

export interface UseSubscriptionsConfig {
  walletAddress?: string;
  creatorWallet?: string;
  autoLoad?: boolean;
}

export interface UseSubscriptionsReturn {
  // State
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  userSubscriptions: SubscriptionWithPlan[];
  creatorPlans: SubscriptionPlan[];
  creatorSubscribers: SubscriptionWithPlan[];
  analytics: SubscriptionAnalytics | null;

  // Plan Management (for creators)
  createPlan: (params: {
    name: string;
    description: string;
    tier: SubscriptionTier;
    amountLamports: number;
    frequency: SubscriptionFrequency;
    features: string[];
    maxSubscribers?: number;
  }) => Promise<{ success: boolean; plan?: SubscriptionPlan; error?: string }>;
  createDefaultPlans: () => Promise<SubscriptionPlan[]>;
  updatePlan: (
    planId: string,
    updates: Partial<SubscriptionPlan>
  ) => Promise<{ success: boolean; error?: string }>;
  deactivatePlan: (planId: string) => Promise<{ success: boolean; error?: string }>;

  // Subscription Management (for users)
  subscribe: (
    planId: string,
    signature: string,
    customAmount?: number
  ) => Promise<{ success: boolean; subscription?: SubscriptionWithPlan; error?: string }>;
  cancelSubscription: (
    subscriptionId: string,
    signature: string
  ) => Promise<{ success: boolean; error?: string }>;
  pauseSubscription: (
    subscriptionId: string,
    signature: string
  ) => Promise<{ success: boolean; error?: string }>;
  resumeSubscription: (
    subscriptionId: string,
    signature: string
  ) => Promise<{ success: boolean; error?: string }>;
  changePlan: (
    subscriptionId: string,
    newPlanId: string,
    signature: string
  ) => Promise<{ success: boolean; subscription?: SubscriptionWithPlan; error?: string }>;

  // Queries
  hasActiveSubscription: (
    creatorWallet: string,
    minimumTier?: SubscriptionTier
  ) => Promise<{ hasSubscription: boolean; subscription?: SubscriptionWithPlan }>;
  getCreatorAnalytics: () => Promise<SubscriptionAnalytics>;

  // Refresh
  refreshUserSubscriptions: () => Promise<void>;
  refreshCreatorData: () => Promise<void>;
}

// ============================================
// Hook
// ============================================

export function useSubscriptions(config?: UseSubscriptionsConfig): UseSubscriptionsReturn {
  const [service, setService] = useState<SubscriptionsService | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userSubscriptions, setUserSubscriptions] = useState<SubscriptionWithPlan[]>([]);
  const [creatorPlans, setCreatorPlans] = useState<SubscriptionPlan[]>([]);
  const [creatorSubscribers, setCreatorSubscribers] = useState<SubscriptionWithPlan[]>([]);
  const [analytics, setAnalytics] = useState<SubscriptionAnalytics | null>(null);

  const walletAddress = config?.walletAddress;
  const creatorWallet = config?.creatorWallet;

  // Initialize service
  useEffect(() => {
    const initService = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const subscriptionsService = getSubscriptionsService();
        setService(subscriptionsService);
        setIsInitialized(true);

        // Auto-load data if configured
        if (config?.autoLoad !== false) {
          if (walletAddress) {
            const subs = await subscriptionsService.getUserSubscriptions(walletAddress);
            setUserSubscriptions(subs);
          }

          if (creatorWallet) {
            const [plans, subscribers, stats] = await Promise.all([
              subscriptionsService.getCreatorPlans(creatorWallet),
              subscriptionsService.getCreatorSubscribers(creatorWallet),
              subscriptionsService.getCreatorAnalytics(creatorWallet),
            ]);
            setCreatorPlans(plans);
            setCreatorSubscribers(subscribers);
            setAnalytics(stats);
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to initialize subscriptions";
        setError(message);
        console.error("Subscriptions initialization error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    initService();
  }, [walletAddress, creatorWallet, config?.autoLoad]);

  // ============================================
  // Plan Management
  // ============================================

  const createPlan = useCallback(
    async (params: {
      name: string;
      description: string;
      tier: SubscriptionTier;
      amountLamports: number;
      frequency: SubscriptionFrequency;
      features: string[];
      maxSubscribers?: number;
    }): Promise<{ success: boolean; plan?: SubscriptionPlan; error?: string }> => {
      if (!service) return { success: false, error: "Service not initialized" };
      if (!creatorWallet) return { success: false, error: "Creator wallet not set" };

      setIsLoading(true);
      setError(null);

      try {
        const result = await service.createPlan({
          ...params,
          creatorWallet,
        });

        if (result.success && result.plan) {
          setCreatorPlans((prev) => [...prev, result.plan!]);
        }

        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create plan";
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    [service, creatorWallet]
  );

  const createDefaultPlans = useCallback(async (): Promise<SubscriptionPlan[]> => {
    if (!service) throw new Error("Service not initialized");
    if (!creatorWallet) throw new Error("Creator wallet not set");

    setIsLoading(true);
    setError(null);

    try {
      const plans = await service.createDefaultPlans(creatorWallet);
      setCreatorPlans(plans);
      return plans;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create default plans";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [service, creatorWallet]);

  const updatePlan = useCallback(
    async (
      planId: string,
      updates: Partial<SubscriptionPlan>
    ): Promise<{ success: boolean; error?: string }> => {
      if (!service) return { success: false, error: "Service not initialized" };

      setIsLoading(true);
      setError(null);

      try {
        const result = await service.updatePlan(planId, updates);

        if (result.success && result.plan) {
          setCreatorPlans((prev) =>
            prev.map((p) => (p.id === planId ? result.plan! : p))
          );
        }

        return { success: result.success, error: result.error };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update plan";
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    [service]
  );

  const deactivatePlan = useCallback(
    async (planId: string): Promise<{ success: boolean; error?: string }> => {
      if (!service) return { success: false, error: "Service not initialized" };

      setIsLoading(true);
      setError(null);

      try {
        const result = await service.deactivatePlan(planId);

        if (result.success) {
          setCreatorPlans((prev) =>
            prev.map((p) => (p.id === planId ? { ...p, isActive: false } : p))
          );
        }

        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to deactivate plan";
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    [service]
  );

  // ============================================
  // Subscription Management
  // ============================================

  const subscribe = useCallback(
    async (
      planId: string,
      signature: string,
      customAmount?: number
    ): Promise<{ success: boolean; subscription?: SubscriptionWithPlan; error?: string }> => {
      if (!service) return { success: false, error: "Service not initialized" };
      if (!walletAddress) return { success: false, error: "Wallet not connected" };

      setIsLoading(true);
      setError(null);

      try {
        const result = await service.subscribe({
          planId,
          userWallet: walletAddress,
          userSignature: signature,
          customAmount,
        });

        if (result.success && result.subscription) {
          setUserSubscriptions((prev) => [...prev, result.subscription!]);
        }

        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to subscribe";
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    [service, walletAddress]
  );

  const cancelSubscription = useCallback(
    async (
      subscriptionId: string,
      signature: string
    ): Promise<{ success: boolean; error?: string }> => {
      if (!service) return { success: false, error: "Service not initialized" };
      if (!walletAddress) return { success: false, error: "Wallet not connected" };

      setIsLoading(true);
      setError(null);

      try {
        const result = await service.cancelSubscription(
          subscriptionId,
          walletAddress,
          signature
        );

        if (result.success) {
          setUserSubscriptions((prev) =>
            prev.map((s) =>
              s.id === subscriptionId ? { ...s, status: "cancelled" as const } : s
            )
          );
        }

        return { success: result.success, error: result.error };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to cancel subscription";
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    [service, walletAddress]
  );

  const pauseSubscription = useCallback(
    async (
      subscriptionId: string,
      signature: string
    ): Promise<{ success: boolean; error?: string }> => {
      if (!service) return { success: false, error: "Service not initialized" };
      if (!walletAddress) return { success: false, error: "Wallet not connected" };

      setIsLoading(true);
      setError(null);

      try {
        const result = await service.pauseSubscription(
          subscriptionId,
          walletAddress,
          signature
        );

        if (result.success) {
          setUserSubscriptions((prev) =>
            prev.map((s) =>
              s.id === subscriptionId ? { ...s, status: "paused" as const } : s
            )
          );
        }

        return { success: result.success, error: result.error };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to pause subscription";
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    [service, walletAddress]
  );

  const resumeSubscription = useCallback(
    async (
      subscriptionId: string,
      signature: string
    ): Promise<{ success: boolean; error?: string }> => {
      if (!service) return { success: false, error: "Service not initialized" };
      if (!walletAddress) return { success: false, error: "Wallet not connected" };

      setIsLoading(true);
      setError(null);

      try {
        const result = await service.resumeSubscription(
          subscriptionId,
          walletAddress,
          signature
        );

        if (result.success) {
          setUserSubscriptions((prev) =>
            prev.map((s) =>
              s.id === subscriptionId ? { ...s, status: "active" as const } : s
            )
          );
        }

        return { success: result.success, error: result.error };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to resume subscription";
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    [service, walletAddress]
  );

  const changePlan = useCallback(
    async (
      subscriptionId: string,
      newPlanId: string,
      signature: string
    ): Promise<{ success: boolean; subscription?: SubscriptionWithPlan; error?: string }> => {
      if (!service) return { success: false, error: "Service not initialized" };
      if (!walletAddress) return { success: false, error: "Wallet not connected" };

      setIsLoading(true);
      setError(null);

      try {
        const result = await service.changePlan(
          subscriptionId,
          newPlanId,
          walletAddress,
          signature
        );

        if (result.success && result.subscription) {
          setUserSubscriptions((prev) =>
            prev
              .filter((s) => s.id !== subscriptionId)
              .concat([result.subscription!])
          );
        }

        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to change plan";
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

  const hasActiveSubscription = useCallback(
    async (
      targetCreatorWallet: string,
      minimumTier?: SubscriptionTier
    ): Promise<{ hasSubscription: boolean; subscription?: SubscriptionWithPlan }> => {
      if (!service) return { hasSubscription: false };
      if (!walletAddress) return { hasSubscription: false };

      return service.hasActiveSubscription(walletAddress, targetCreatorWallet, minimumTier);
    },
    [service, walletAddress]
  );

  const getCreatorAnalytics = useCallback(async (): Promise<SubscriptionAnalytics> => {
    if (!service) throw new Error("Service not initialized");
    if (!creatorWallet) throw new Error("Creator wallet not set");

    const stats = await service.getCreatorAnalytics(creatorWallet);
    setAnalytics(stats);
    return stats;
  }, [service, creatorWallet]);

  // ============================================
  // Refresh
  // ============================================

  const refreshUserSubscriptions = useCallback(async () => {
    if (!service || !walletAddress) return;

    try {
      const subs = await service.getUserSubscriptions(walletAddress);
      setUserSubscriptions(subs);
    } catch (err) {
      console.error("Failed to refresh user subscriptions:", err);
    }
  }, [service, walletAddress]);

  const refreshCreatorData = useCallback(async () => {
    if (!service || !creatorWallet) return;

    try {
      const [plans, subscribers, stats] = await Promise.all([
        service.getCreatorPlans(creatorWallet),
        service.getCreatorSubscribers(creatorWallet),
        service.getCreatorAnalytics(creatorWallet),
      ]);
      setCreatorPlans(plans);
      setCreatorSubscribers(subscribers);
      setAnalytics(stats);
    } catch (err) {
      console.error("Failed to refresh creator data:", err);
    }
  }, [service, creatorWallet]);

  return {
    // State
    isInitialized,
    isLoading,
    error,
    userSubscriptions,
    creatorPlans,
    creatorSubscribers,
    analytics,

    // Plan Management
    createPlan,
    createDefaultPlans,
    updatePlan,
    deactivatePlan,

    // Subscription Management
    subscribe,
    cancelSubscription,
    pauseSubscription,
    resumeSubscription,
    changePlan,

    // Queries
    hasActiveSubscription,
    getCreatorAnalytics,

    // Refresh
    refreshUserSubscriptions,
    refreshCreatorData,
  };
}

export default useSubscriptions;
