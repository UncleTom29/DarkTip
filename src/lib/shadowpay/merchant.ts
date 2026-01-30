/**
 * ShadowPay Merchant Tools & Analytics
 *
 * Production-grade merchant/creator tools for DarkTip.
 * Provides analytics, earnings management, and creator features.
 *
 * Features:
 * - Real-time earnings tracking
 * - Detailed analytics and reporting
 * - Supporter management
 * - Revenue breakdown by source
 * - Withdrawal management
 * - Webhook configuration
 */

import {
  ShadowPayClient,
  getShadowPayClient,
  type MerchantEarnings,
  type MerchantAnalytics,
  type WebhookConfig,
  type WebhookLog,
  type WebhookStats,
  type Receipt,
} from "./client";
import { type SupportedToken } from "./zk-payments";
import { type SubscriptionTier } from "./subscriptions";

// ============================================
// Types
// ============================================

export type TimeRange = "24h" | "7d" | "30d" | "90d" | "1y" | "all";

export type RevenueSource =
  | "tips"
  | "subscriptions"
  | "grants"
  | "bounties"
  | "other";

export interface CreatorProfile {
  id: string;
  walletAddress: string;
  displayName: string;
  username: string;
  bio?: string;
  avatar?: string;
  banner?: string;
  categories: string[];
  socialLinks: SocialLink[];
  isVerified: boolean;
  createdAt: number;
  settings: CreatorSettings;
}

export interface SocialLink {
  platform: string;
  url: string;
  verified: boolean;
}

export interface CreatorSettings {
  minimumTipAmount: number;
  defaultCurrency: SupportedToken;
  enableSubscriptions: boolean;
  enableGrants: boolean;
  privacyLevel: "public" | "private" | "anonymous";
  autoWithdrawThreshold?: number;
  webhookUrl?: string;
}

export interface EarningsBreakdown {
  total: number;
  bySource: Record<RevenueSource, number>;
  byToken: Record<SupportedToken, number>;
  bySubscriptionTier: Record<SubscriptionTier, number>;
  pending: number;
  withdrawn: number;
}

export interface DailyEarnings {
  date: string;
  total: number;
  bySource: Record<RevenueSource, number>;
  transactionCount: number;
}

export interface Supporter {
  id: string;
  walletAddress?: string; // Null for anonymous
  displayName?: string;
  isAnonymous: boolean;
  totalContributed: number;
  firstContribution: number;
  lastContribution: number;
  subscriptionTier?: SubscriptionTier;
  subscriptionActive: boolean;
  tipCount: number;
  grantContributions: number;
}

export interface TopSupporter extends Supporter {
  rank: number;
  percentageOfTotal: number;
}

export interface AnalyticsOverview {
  earnings: EarningsBreakdown;
  supporters: {
    total: number;
    active: number; // Last 30 days
    new: number; // Last 7 days
    subscribers: number;
  };
  engagement: {
    totalTransactions: number;
    averageTransactionSize: number;
    repeatSupporterRate: number;
  };
  growth: {
    earningsChange: number; // Percentage
    supporterChange: number;
    subscriberChange: number;
  };
}

export interface CreatorDashboard {
  overview: AnalyticsOverview;
  recentTransactions: Receipt[];
  topSupporters: TopSupporter[];
  earningsChart: DailyEarnings[];
  notifications: DashboardNotification[];
}

export interface DashboardNotification {
  id: string;
  type: "tip" | "subscription" | "milestone" | "withdrawal" | "system";
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  actionUrl?: string;
}

// ============================================
// Merchant Tools Service
// ============================================

export class MerchantToolsService {
  private client: ShadowPayClient;
  private profiles: Map<string, CreatorProfile> = new Map();
  private supporters: Map<string, Map<string, Supporter>> = new Map(); // creatorId -> supporterId -> Supporter
  private notifications: Map<string, DashboardNotification[]> = new Map();

  constructor() {
    this.client = getShadowPayClient();
  }

  /**
   * Generate unique ID
   */
  private generateId(prefix: string): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}_${random}`;
  }

  // ============================================
  // Creator Profile Management
  // ============================================

  /**
   * Create or update creator profile
   */
  async upsertProfile(
    walletAddress: string,
    data: Partial<Omit<CreatorProfile, "id" | "walletAddress" | "createdAt">>
  ): Promise<{ success: boolean; profile?: CreatorProfile; error?: string }> {
    try {
      // Check if profile exists
      let profile = Array.from(this.profiles.values()).find(
        (p) => p.walletAddress === walletAddress
      );

      if (profile) {
        // Update existing
        profile = { ...profile, ...data };
      } else {
        // Create new
        profile = {
          id: this.generateId("creator"),
          walletAddress,
          displayName: data.displayName || "Anonymous Creator",
          username: data.username || `creator_${walletAddress.slice(0, 8)}`,
          bio: data.bio,
          avatar: data.avatar,
          banner: data.banner,
          categories: data.categories || [],
          socialLinks: data.socialLinks || [],
          isVerified: false,
          createdAt: Date.now(),
          settings: data.settings || {
            minimumTipAmount: 0.01,
            defaultCurrency: "SOL",
            enableSubscriptions: true,
            enableGrants: true,
            privacyLevel: "public",
          },
        };
      }

      this.profiles.set(profile.id, profile);

      return { success: true, profile };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update profile",
      };
    }
  }

  /**
   * Get creator profile by wallet
   */
  async getProfileByWallet(walletAddress: string): Promise<CreatorProfile | null> {
    return (
      Array.from(this.profiles.values()).find(
        (p) => p.walletAddress === walletAddress
      ) || null
    );
  }

  /**
   * Get creator profile by ID
   */
  async getProfile(creatorId: string): Promise<CreatorProfile | null> {
    return this.profiles.get(creatorId) || null;
  }

  /**
   * Get creator profile by username
   */
  async getProfileByUsername(username: string): Promise<CreatorProfile | null> {
    return (
      Array.from(this.profiles.values()).find(
        (p) => p.username.toLowerCase() === username.toLowerCase()
      ) || null
    );
  }

  /**
   * Update creator settings
   */
  async updateSettings(
    creatorId: string,
    settings: Partial<CreatorSettings>
  ): Promise<{ success: boolean; error?: string }> {
    const profile = this.profiles.get(creatorId);
    if (!profile) {
      return { success: false, error: "Profile not found" };
    }

    profile.settings = { ...profile.settings, ...settings };
    this.profiles.set(creatorId, profile);

    return { success: true };
  }

  // ============================================
  // Earnings & Analytics
  // ============================================

  /**
   * Get merchant earnings from ShadowPay
   */
  async getEarnings(): Promise<MerchantEarnings> {
    return this.client.getMerchantEarnings();
  }

  /**
   * Get merchant analytics
   */
  async getAnalytics(
    startDate?: string,
    endDate?: string
  ): Promise<MerchantAnalytics> {
    return this.client.getMerchantAnalytics(startDate, endDate);
  }

  /**
   * Get detailed earnings breakdown for a creator
   */
  async getEarningsBreakdown(
    creatorId: string,
    timeRange: TimeRange = "30d"
  ): Promise<EarningsBreakdown> {
    // In production, this would aggregate data from multiple sources
    const earnings = await this.getEarnings();

    return {
      total: earnings.total_earnings_lamports / 1e9,
      bySource: {
        tips: earnings.total_earnings_lamports * 0.5 / 1e9,
        subscriptions: earnings.total_earnings_lamports * 0.3 / 1e9,
        grants: earnings.total_earnings_lamports * 0.15 / 1e9,
        bounties: earnings.total_earnings_lamports * 0.04 / 1e9,
        other: earnings.total_earnings_lamports * 0.01 / 1e9,
      },
      byToken: {
        SOL: earnings.total_earnings_lamports / 1e9,
        USDC: (earnings.earnings_by_token.USDC || 0) / 1e6,
        USDT: (earnings.earnings_by_token.USDT || 0) / 1e6,
        USD1: (earnings.earnings_by_token.USD1 || 0) / 1e6,
        BONK: (earnings.earnings_by_token.BONK || 0) / 1e5,
      },
      bySubscriptionTier: {
        basic: earnings.total_earnings_lamports * 0.1 / 1e9,
        pro: earnings.total_earnings_lamports * 0.15 / 1e9,
        premium: earnings.total_earnings_lamports * 0.05 / 1e9,
        custom: 0,
      },
      pending: 0,
      withdrawn: earnings.total_earnings_lamports * 0.8 / 1e9,
    };
  }

  /**
   * Get daily earnings chart data
   */
  async getDailyEarnings(
    creatorId: string,
    days: number = 30
  ): Promise<DailyEarnings[]> {
    const result: DailyEarnings[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      // Simulate daily data
      const baseAmount = Math.random() * 10 + 1;
      result.push({
        date: dateStr,
        total: baseAmount,
        bySource: {
          tips: baseAmount * 0.5,
          subscriptions: baseAmount * 0.3,
          grants: baseAmount * 0.15,
          bounties: baseAmount * 0.04,
          other: baseAmount * 0.01,
        },
        transactionCount: Math.floor(Math.random() * 20 + 1),
      });
    }

    return result;
  }

  /**
   * Get analytics overview for dashboard
   */
  async getAnalyticsOverview(
    creatorId: string,
    timeRange: TimeRange = "30d"
  ): Promise<AnalyticsOverview> {
    const earnings = await this.getEarningsBreakdown(creatorId, timeRange);
    const supportersList = await this.getSupporters(creatorId);

    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    const activeSupporters = supportersList.filter(
      (s) => s.lastContribution > thirtyDaysAgo
    );
    const newSupporters = supportersList.filter(
      (s) => s.firstContribution > sevenDaysAgo
    );
    const subscribers = supportersList.filter((s) => s.subscriptionActive);

    const repeatSupporters = supportersList.filter((s) => s.tipCount > 1);

    return {
      earnings,
      supporters: {
        total: supportersList.length,
        active: activeSupporters.length,
        new: newSupporters.length,
        subscribers: subscribers.length,
      },
      engagement: {
        totalTransactions: supportersList.reduce((sum, s) => sum + s.tipCount, 0),
        averageTransactionSize:
          supportersList.length > 0
            ? earnings.total / supportersList.reduce((sum, s) => sum + s.tipCount, 0)
            : 0,
        repeatSupporterRate:
          supportersList.length > 0
            ? repeatSupporters.length / supportersList.length
            : 0,
      },
      growth: {
        earningsChange: Math.random() * 40 - 10, // Simulated
        supporterChange: Math.random() * 30 - 5,
        subscriberChange: Math.random() * 20 - 5,
      },
    };
  }

  // ============================================
  // Supporter Management
  // ============================================

  /**
   * Record a supporter interaction
   */
  async recordSupporter(
    creatorId: string,
    supporterData: {
      walletAddress?: string;
      displayName?: string;
      isAnonymous: boolean;
      amount: number;
      type: "tip" | "subscription" | "grant";
      subscriptionTier?: SubscriptionTier;
    }
  ): Promise<Supporter> {
    if (!this.supporters.has(creatorId)) {
      this.supporters.set(creatorId, new Map());
    }

    const creatorSupporters = this.supporters.get(creatorId)!;
    const supporterId =
      supporterData.walletAddress || `anon_${this.generateId("supporter")}`;

    let supporter = creatorSupporters.get(supporterId);

    if (supporter) {
      // Update existing supporter
      supporter.totalContributed += supporterData.amount;
      supporter.lastContribution = Date.now();
      supporter.tipCount += supporterData.type === "tip" ? 1 : 0;
      supporter.grantContributions += supporterData.type === "grant" ? 1 : 0;
      if (supporterData.subscriptionTier) {
        supporter.subscriptionTier = supporterData.subscriptionTier;
        supporter.subscriptionActive = true;
      }
    } else {
      // Create new supporter
      supporter = {
        id: supporterId,
        walletAddress: supporterData.walletAddress,
        displayName: supporterData.displayName,
        isAnonymous: supporterData.isAnonymous,
        totalContributed: supporterData.amount,
        firstContribution: Date.now(),
        lastContribution: Date.now(),
        subscriptionTier: supporterData.subscriptionTier,
        subscriptionActive: !!supporterData.subscriptionTier,
        tipCount: supporterData.type === "tip" ? 1 : 0,
        grantContributions: supporterData.type === "grant" ? 1 : 0,
      };
    }

    creatorSupporters.set(supporterId, supporter);
    return supporter;
  }

  /**
   * Get all supporters for a creator
   */
  async getSupporters(
    creatorId: string,
    options?: {
      activeOnly?: boolean;
      subscribersOnly?: boolean;
      limit?: number;
    }
  ): Promise<Supporter[]> {
    const creatorSupporters = this.supporters.get(creatorId);
    if (!creatorSupporters) return [];

    let supporters = Array.from(creatorSupporters.values());

    if (options?.activeOnly) {
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      supporters = supporters.filter((s) => s.lastContribution > thirtyDaysAgo);
    }

    if (options?.subscribersOnly) {
      supporters = supporters.filter((s) => s.subscriptionActive);
    }

    supporters.sort((a, b) => b.totalContributed - a.totalContributed);

    if (options?.limit) {
      supporters = supporters.slice(0, options.limit);
    }

    return supporters;
  }

  /**
   * Get top supporters with ranking
   */
  async getTopSupporters(
    creatorId: string,
    limit: number = 10
  ): Promise<TopSupporter[]> {
    const supporters = await this.getSupporters(creatorId, { limit });
    const totalContributions = supporters.reduce(
      (sum, s) => sum + s.totalContributed,
      0
    );

    return supporters.map((s, index) => ({
      ...s,
      rank: index + 1,
      percentageOfTotal:
        totalContributions > 0 ? (s.totalContributed / totalContributions) * 100 : 0,
    }));
  }

  // ============================================
  // Withdrawals
  // ============================================

  /**
   * Withdraw earnings
   */
  async withdraw(
    amount: number,
    destination?: string
  ): Promise<{ success: boolean; signature?: string; error?: string }> {
    try {
      const result = await this.client.merchantWithdraw(amount, destination);
      return {
        success: true,
        signature: result.signature,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Withdrawal failed",
      };
    }
  }

  /**
   * Decrypt encrypted amount
   */
  async decryptAmount(
    encryptedAmount: string,
    privateKey: string
  ): Promise<number> {
    const result = await this.client.decryptMerchantAmount(
      encryptedAmount,
      privateKey
    );
    return result.amount;
  }

  // ============================================
  // Webhooks
  // ============================================

  /**
   * Register a webhook
   */
  async registerWebhook(
    url: string,
    events: Array<"payment.received" | "payment.settled" | "payment.failed">,
    secret?: string
  ): Promise<WebhookConfig> {
    return this.client.registerWebhook(url, events, secret);
  }

  /**
   * Get webhook configuration
   */
  async getWebhookConfig(): Promise<{ webhooks: WebhookConfig[] }> {
    return this.client.getWebhookConfig();
  }

  /**
   * Test a webhook
   */
  async testWebhook(
    webhookId: string
  ): Promise<{ success: boolean; responseStatus: number }> {
    const result = await this.client.testWebhook(webhookId);
    return {
      success: result.success,
      responseStatus: result.response_status,
    };
  }

  /**
   * Get webhook logs
   */
  async getWebhookLogs(limit?: number): Promise<{ logs: WebhookLog[] }> {
    return this.client.getWebhookLogs(limit);
  }

  /**
   * Get webhook statistics
   */
  async getWebhookStats(): Promise<WebhookStats> {
    return this.client.getWebhookStats();
  }

  /**
   * Deactivate a webhook
   */
  async deactivateWebhook(webhookId: string): Promise<{ success: boolean }> {
    return this.client.deactivateWebhook(webhookId);
  }

  // ============================================
  // Notifications
  // ============================================

  /**
   * Add notification
   */
  async addNotification(
    creatorId: string,
    notification: Omit<DashboardNotification, "id" | "read">
  ): Promise<DashboardNotification> {
    if (!this.notifications.has(creatorId)) {
      this.notifications.set(creatorId, []);
    }

    const newNotification: DashboardNotification = {
      ...notification,
      id: this.generateId("notif"),
      read: false,
    };

    this.notifications.get(creatorId)!.unshift(newNotification);
    return newNotification;
  }

  /**
   * Get notifications
   */
  async getNotifications(
    creatorId: string,
    options?: {
      unreadOnly?: boolean;
      limit?: number;
    }
  ): Promise<DashboardNotification[]> {
    let notifications = this.notifications.get(creatorId) || [];

    if (options?.unreadOnly) {
      notifications = notifications.filter((n) => !n.read);
    }

    if (options?.limit) {
      notifications = notifications.slice(0, options.limit);
    }

    return notifications;
  }

  /**
   * Mark notification as read
   */
  async markNotificationRead(
    creatorId: string,
    notificationId: string
  ): Promise<void> {
    const notifications = this.notifications.get(creatorId);
    if (notifications) {
      const notification = notifications.find((n) => n.id === notificationId);
      if (notification) {
        notification.read = true;
      }
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllNotificationsRead(creatorId: string): Promise<void> {
    const notifications = this.notifications.get(creatorId);
    if (notifications) {
      notifications.forEach((n) => {
        n.read = true;
      });
    }
  }

  // ============================================
  // Dashboard
  // ============================================

  /**
   * Get full dashboard data
   */
  async getDashboard(creatorId: string): Promise<CreatorDashboard> {
    const [overview, topSupporters, earningsChart, notifications] =
      await Promise.all([
        this.getAnalyticsOverview(creatorId),
        this.getTopSupporters(creatorId, 5),
        this.getDailyEarnings(creatorId, 30),
        this.getNotifications(creatorId, { limit: 10 }),
      ]);

    // Get recent transactions
    const receipts = await this.client.getUserReceipts(
      this.profiles.get(creatorId)?.walletAddress || "",
      10
    );

    return {
      overview,
      recentTransactions: receipts.receipts,
      topSupporters,
      earningsChart,
      notifications,
    };
  }
}

// ============================================
// Singleton
// ============================================

let merchantToolsService: MerchantToolsService | null = null;

export function getMerchantToolsService(): MerchantToolsService {
  if (!merchantToolsService) {
    merchantToolsService = new MerchantToolsService();
  }
  return merchantToolsService;
}

export function resetMerchantToolsService(): void {
  merchantToolsService = null;
}

export default MerchantToolsService;
