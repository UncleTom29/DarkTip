/**
 * ShadowPay Subscriptions Service
 *
 * Production-grade subscription service for DarkTip using ShadowPay.
 * Handles recurring payments for creator support, premium tiers, and grants.
 *
 * Features:
 * - Multiple subscription tiers (Basic, Pro, Premium)
 * - Flexible billing frequencies (minute, hour, day, week, month, year)
 * - Automatic billing via spending authorizations
 * - Grace periods and retry logic
 * - Subscription analytics
 */

import {
  ShadowPayClient,
  getShadowPayClient,
  type Subscription,
  type SubscriptionFrequency,
  type SubscriptionStatus,
  type SpendingAuthorization,
} from "./client";

// ============================================
// Types
// ============================================

export type SubscriptionTier = "basic" | "pro" | "premium" | "custom";

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  tier: SubscriptionTier;
  amountLamports: number;
  frequency: SubscriptionFrequency;
  features: string[];
  isActive: boolean;
  creatorWallet: string;
  maxSubscribers?: number;
  currentSubscribers: number;
  createdAt: number;
}

export interface SubscriptionWithPlan extends Subscription {
  plan?: SubscriptionPlan;
  gracePeriodEndsAt?: number;
  nextRetryAt?: number;
}

export interface CreateSubscriptionParams {
  planId: string;
  userWallet: string;
  userSignature: string;
  customAmount?: number;
  metadata?: Record<string, unknown>;
}

export interface SubscriptionResult {
  success: boolean;
  subscription?: SubscriptionWithPlan;
  authorizationRequired?: boolean;
  unsignedAuthTx?: string;
  error?: string;
}

export interface SubscriptionAnalytics {
  totalSubscribers: number;
  activeSubscribers: number;
  churnRate: number;
  mrr: number; // Monthly Recurring Revenue in lamports
  arr: number; // Annual Recurring Revenue in lamports
  byTier: Record<SubscriptionTier, number>;
  byFrequency: Record<SubscriptionFrequency, number>;
  recentCancellations: number;
  averageSubscriptionLength: number; // In days
}

// ============================================
// Subscriptions Service
// ============================================

export class SubscriptionsService {
  private client: ShadowPayClient;
  private plans: Map<string, SubscriptionPlan> = new Map();
  private subscriptions: Map<string, SubscriptionWithPlan> = new Map();

  constructor() {
    this.client = getShadowPayClient();
  }

  /**
   * Generate unique plan ID
   */
  private generatePlanId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `plan_${timestamp}_${random}`;
  }

  /**
   * Calculate interval in milliseconds
   */
  private getIntervalMs(frequency: SubscriptionFrequency): number {
    const intervals: Record<SubscriptionFrequency, number> = {
      minute: 60 * 1000,
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
      year: 365 * 24 * 60 * 60 * 1000,
    };
    return intervals[frequency];
  }

  /**
   * Convert to monthly equivalent for MRR calculation
   */
  private toMonthlyAmount(amount: number, frequency: SubscriptionFrequency): number {
    const multipliers: Record<SubscriptionFrequency, number> = {
      minute: 43200, // 30 days * 24 hours * 60 minutes
      hour: 720, // 30 days * 24 hours
      day: 30,
      week: 4.33,
      month: 1,
      year: 1 / 12,
    };
    return amount * multipliers[frequency];
  }

  // ============================================
  // Plan Management
  // ============================================

  /**
   * Create a new subscription plan
   */
  async createPlan(params: {
    name: string;
    description: string;
    tier: SubscriptionTier;
    amountLamports: number;
    frequency: SubscriptionFrequency;
    features: string[];
    creatorWallet: string;
    maxSubscribers?: number;
  }): Promise<{ success: boolean; plan?: SubscriptionPlan; error?: string }> {
    try {
      const plan: SubscriptionPlan = {
        id: this.generatePlanId(),
        name: params.name,
        description: params.description,
        tier: params.tier,
        amountLamports: params.amountLamports,
        frequency: params.frequency,
        features: params.features,
        isActive: true,
        creatorWallet: params.creatorWallet,
        maxSubscribers: params.maxSubscribers,
        currentSubscribers: 0,
        createdAt: Date.now(),
      };

      this.plans.set(plan.id, plan);

      return {
        success: true,
        plan,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create plan",
      };
    }
  }

  /**
   * Create default tier plans for a creator
   */
  async createDefaultPlans(creatorWallet: string): Promise<SubscriptionPlan[]> {
    const defaultPlans = [
      {
        name: "Basic Support",
        description: "Support the creator with a small monthly contribution",
        tier: "basic" as SubscriptionTier,
        amountLamports: 100_000_000, // 0.1 SOL
        frequency: "month" as SubscriptionFrequency,
        features: ["Supporter badge", "Name in credits"],
      },
      {
        name: "Pro Supporter",
        description: "Enhanced support with exclusive perks",
        tier: "pro" as SubscriptionTier,
        amountLamports: 500_000_000, // 0.5 SOL
        frequency: "month" as SubscriptionFrequency,
        features: [
          "All Basic features",
          "Early access to content",
          "Monthly Q&A access",
          "Exclusive Discord role",
        ],
      },
      {
        name: "Premium Patron",
        description: "Maximum support with all premium benefits",
        tier: "premium" as SubscriptionTier,
        amountLamports: 2_000_000_000, // 2 SOL
        frequency: "month" as SubscriptionFrequency,
        features: [
          "All Pro features",
          "1-on-1 monthly call",
          "Input on future content",
          "Merchandise discounts",
          "NFT airdrops",
        ],
      },
    ];

    const createdPlans: SubscriptionPlan[] = [];

    for (const planConfig of defaultPlans) {
      const result = await this.createPlan({
        ...planConfig,
        creatorWallet,
      });
      if (result.plan) {
        createdPlans.push(result.plan);
      }
    }

    return createdPlans;
  }

  /**
   * Get plan by ID
   */
  async getPlan(planId: string): Promise<SubscriptionPlan | null> {
    return this.plans.get(planId) || null;
  }

  /**
   * Get all plans for a creator
   */
  async getCreatorPlans(creatorWallet: string): Promise<SubscriptionPlan[]> {
    return Array.from(this.plans.values()).filter(
      (plan) => plan.creatorWallet === creatorWallet && plan.isActive
    );
  }

  /**
   * Update a plan
   */
  async updatePlan(
    planId: string,
    updates: Partial<Omit<SubscriptionPlan, "id" | "creatorWallet" | "createdAt">>
  ): Promise<{ success: boolean; plan?: SubscriptionPlan; error?: string }> {
    const plan = this.plans.get(planId);
    if (!plan) {
      return { success: false, error: "Plan not found" };
    }

    const updatedPlan = { ...plan, ...updates };
    this.plans.set(planId, updatedPlan);

    return { success: true, plan: updatedPlan };
  }

  /**
   * Deactivate a plan (existing subscribers keep it)
   */
  async deactivatePlan(planId: string): Promise<{ success: boolean; error?: string }> {
    const plan = this.plans.get(planId);
    if (!plan) {
      return { success: false, error: "Plan not found" };
    }

    plan.isActive = false;
    this.plans.set(planId, plan);

    return { success: true };
  }

  // ============================================
  // Subscription Management
  // ============================================

  /**
   * Subscribe to a plan
   */
  async subscribe(params: CreateSubscriptionParams): Promise<SubscriptionResult> {
    try {
      const plan = this.plans.get(params.planId);
      if (!plan) {
        return { success: false, error: "Plan not found" };
      }

      if (!plan.isActive) {
        return { success: false, error: "Plan is no longer available" };
      }

      if (plan.maxSubscribers && plan.currentSubscribers >= plan.maxSubscribers) {
        return { success: false, error: "Plan has reached maximum subscribers" };
      }

      const amount = params.customAmount || plan.amountLamports;

      // Create subscription via ShadowPay
      const result = await this.client.createSubscription({
        merchant_wallet: plan.creatorWallet,
        amount_lamports: amount,
        frequency: plan.frequency,
        user_wallet: params.userWallet,
        user_signature: params.userSignature,
        metadata: {
          ...params.metadata,
          planId: plan.id,
          planName: plan.name,
          tier: plan.tier,
        },
      });

      if (!result.success) {
        return {
          success: false,
          error: result.error || "Failed to create subscription",
        };
      }

      // Update plan subscriber count
      plan.currentSubscribers++;
      this.plans.set(plan.id, plan);

      // Store subscription with plan info
      const subscriptionWithPlan: SubscriptionWithPlan = {
        ...result.subscription!,
        plan,
      };
      this.subscriptions.set(subscriptionWithPlan.id, subscriptionWithPlan);

      return {
        success: true,
        subscription: subscriptionWithPlan,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to subscribe",
      };
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    userWallet: string,
    userSignature: string,
    reason?: string
  ): Promise<SubscriptionResult> {
    try {
      const subscription = this.subscriptions.get(subscriptionId);
      if (!subscription) {
        return { success: false, error: "Subscription not found" };
      }

      if (subscription.user_wallet !== userWallet) {
        return { success: false, error: "Unauthorized" };
      }

      const result = await this.client.cancelSubscription(
        subscriptionId,
        userWallet,
        userSignature
      );

      if (!result.success) {
        return { success: false, error: result.error };
      }

      subscription.status = "cancelled";
      subscription.cancelled_at = Date.now();
      this.subscriptions.set(subscriptionId, subscription);

      // Update plan subscriber count
      if (subscription.plan) {
        subscription.plan.currentSubscribers--;
        this.plans.set(subscription.plan.id, subscription.plan);
      }

      return {
        success: true,
        subscription,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to cancel subscription",
      };
    }
  }

  /**
   * Pause a subscription
   */
  async pauseSubscription(
    subscriptionId: string,
    userWallet: string,
    userSignature: string
  ): Promise<SubscriptionResult> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      return { success: false, error: "Subscription not found" };
    }

    if (subscription.user_wallet !== userWallet) {
      return { success: false, error: "Unauthorized" };
    }

    const result = await this.client.pauseSubscription(
      subscriptionId,
      userWallet,
      userSignature
    );

    if (!result.success) {
      return { success: false, error: result.error };
    }

    subscription.status = "paused";
    this.subscriptions.set(subscriptionId, subscription);

    return { success: true, subscription };
  }

  /**
   * Resume a paused subscription
   */
  async resumeSubscription(
    subscriptionId: string,
    userWallet: string,
    userSignature: string
  ): Promise<SubscriptionResult> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      return { success: false, error: "Subscription not found" };
    }

    if (subscription.user_wallet !== userWallet) {
      return { success: false, error: "Unauthorized" };
    }

    if (subscription.status !== "paused") {
      return { success: false, error: "Subscription is not paused" };
    }

    const result = await this.client.resumeSubscription(
      subscriptionId,
      userWallet,
      userSignature
    );

    if (!result.success) {
      return { success: false, error: result.error };
    }

    subscription.status = "active";
    subscription.next_charge_at = Date.now() + this.getIntervalMs(subscription.frequency);
    this.subscriptions.set(subscriptionId, subscription);

    return { success: true, subscription };
  }

  /**
   * Upgrade/downgrade subscription tier
   */
  async changePlan(
    subscriptionId: string,
    newPlanId: string,
    userWallet: string,
    userSignature: string
  ): Promise<SubscriptionResult> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      return { success: false, error: "Subscription not found" };
    }

    const newPlan = this.plans.get(newPlanId);
    if (!newPlan) {
      return { success: false, error: "New plan not found" };
    }

    if (!newPlan.isActive) {
      return { success: false, error: "New plan is not available" };
    }

    // Cancel old subscription and create new one
    await this.cancelSubscription(subscriptionId, userWallet, userSignature, "Plan change");

    return this.subscribe({
      planId: newPlanId,
      userWallet,
      userSignature,
    });
  }

  // ============================================
  // Queries
  // ============================================

  /**
   * Get subscription by ID
   */
  async getSubscription(subscriptionId: string): Promise<SubscriptionWithPlan | null> {
    return this.subscriptions.get(subscriptionId) || null;
  }

  /**
   * Get user's subscriptions
   */
  async getUserSubscriptions(userWallet: string): Promise<SubscriptionWithPlan[]> {
    return Array.from(this.subscriptions.values()).filter(
      (sub) => sub.user_wallet === userWallet
    );
  }

  /**
   * Get creator's subscribers
   */
  async getCreatorSubscribers(
    creatorWallet: string,
    options?: {
      status?: SubscriptionStatus;
      tier?: SubscriptionTier;
    }
  ): Promise<SubscriptionWithPlan[]> {
    return Array.from(this.subscriptions.values()).filter((sub) => {
      const matchesCreator = sub.merchant_wallet === creatorWallet;
      const matchesStatus = !options?.status || sub.status === options.status;
      const matchesTier = !options?.tier || sub.plan?.tier === options.tier;
      return matchesCreator && matchesStatus && matchesTier;
    });
  }

  /**
   * Check if user has active subscription to creator
   */
  async hasActiveSubscription(
    userWallet: string,
    creatorWallet: string,
    minimumTier?: SubscriptionTier
  ): Promise<{
    hasSubscription: boolean;
    subscription?: SubscriptionWithPlan;
  }> {
    const tierRanks: Record<SubscriptionTier, number> = {
      basic: 1,
      pro: 2,
      premium: 3,
      custom: 4,
    };

    const subscriptions = await this.getUserSubscriptions(userWallet);
    const activeSubscription = subscriptions.find((sub) => {
      if (sub.merchant_wallet !== creatorWallet) return false;
      if (sub.status !== "active") return false;
      if (minimumTier && sub.plan) {
        return tierRanks[sub.plan.tier] >= tierRanks[minimumTier];
      }
      return true;
    });

    return {
      hasSubscription: !!activeSubscription,
      subscription: activeSubscription,
    };
  }

  // ============================================
  // Analytics
  // ============================================

  /**
   * Get subscription analytics for a creator
   */
  async getCreatorAnalytics(creatorWallet: string): Promise<SubscriptionAnalytics> {
    const subscriptions = await this.getCreatorSubscribers(creatorWallet);
    const activeSubscriptions = subscriptions.filter((s) => s.status === "active");

    // Calculate MRR
    let mrr = 0;
    const byTier: Record<SubscriptionTier, number> = {
      basic: 0,
      pro: 0,
      premium: 0,
      custom: 0,
    };
    const byFrequency: Record<SubscriptionFrequency, number> = {
      minute: 0,
      hour: 0,
      day: 0,
      week: 0,
      month: 0,
      year: 0,
    };

    for (const sub of activeSubscriptions) {
      mrr += this.toMonthlyAmount(sub.amount_lamports, sub.frequency);
      if (sub.plan) {
        byTier[sub.plan.tier]++;
      }
      byFrequency[sub.frequency]++;
    }

    // Calculate churn rate (last 30 days)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentCancellations = subscriptions.filter(
      (s) => s.status === "cancelled" && s.cancelled_at && s.cancelled_at > thirtyDaysAgo
    ).length;

    const churnRate =
      activeSubscriptions.length > 0
        ? recentCancellations / activeSubscriptions.length
        : 0;

    // Calculate average subscription length
    const completedSubscriptions = subscriptions.filter(
      (s) => s.cancelled_at && s.created_at
    );
    const avgLength =
      completedSubscriptions.length > 0
        ? completedSubscriptions.reduce(
            (sum, s) => sum + ((s.cancelled_at || 0) - s.created_at),
            0
          ) /
          completedSubscriptions.length /
          (24 * 60 * 60 * 1000)
        : 0;

    return {
      totalSubscribers: subscriptions.length,
      activeSubscribers: activeSubscriptions.length,
      churnRate,
      mrr,
      arr: mrr * 12,
      byTier,
      byFrequency,
      recentCancellations,
      averageSubscriptionLength: avgLength,
    };
  }

  // ============================================
  // Billing
  // ============================================

  /**
   * Process due subscription payments
   */
  async processDuePayments(): Promise<{
    processed: number;
    successful: number;
    failed: number;
    errors: Array<{ subscriptionId: string; error: string }>;
  }> {
    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: [] as Array<{ subscriptionId: string; error: string }>,
    };

    const now = Date.now();

    for (const subscription of this.subscriptions.values()) {
      if (subscription.status !== "active") continue;
      if (subscription.next_charge_at > now) continue;

      results.processed++;

      try {
        const paymentResult = await this.client.processSubscriptionPayment(subscription);

        if (paymentResult.success) {
          results.successful++;
          subscription.last_charge_at = now;
          subscription.next_charge_at = now + this.getIntervalMs(subscription.frequency);
          subscription.failed_attempts = 0;
        } else {
          results.failed++;
          subscription.failed_attempts++;

          // Handle failed payment
          if (subscription.failed_attempts >= 3) {
            subscription.status = "failed";
          } else {
            // Set retry with exponential backoff
            subscription.nextRetryAt =
              now + Math.pow(2, subscription.failed_attempts) * 60 * 60 * 1000;
          }

          results.errors.push({
            subscriptionId: subscription.id,
            error: paymentResult.error || "Payment failed",
          });
        }

        this.subscriptions.set(subscription.id, subscription);
      } catch (error) {
        results.failed++;
        results.errors.push({
          subscriptionId: subscription.id,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return results;
  }
}

// ============================================
// Singleton
// ============================================

let subscriptionsService: SubscriptionsService | null = null;

export function getSubscriptionsService(): SubscriptionsService {
  if (!subscriptionsService) {
    subscriptionsService = new SubscriptionsService();
  }
  return subscriptionsService;
}

export function resetSubscriptionsService(): void {
  subscriptionsService = null;
}

export default SubscriptionsService;
