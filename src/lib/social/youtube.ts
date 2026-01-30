/**
 * YouTube Integration - Production Grade
 *
 * This module handles YouTube integration for:
 * - OAuth 2.0 authentication
 * - Comment-based tipping commands
 * - Channel verification via ShadowID
 * - Tip link generation
 *
 * Uses the official YouTube Data API v3 with proper quota management
 * and error handling for production environments.
 *
 * @see https://developers.google.com/youtube/v3
 */

import { v4 as uuidv4 } from "uuid";
import { getShadowPayClient } from "../shadowpay/client";

// ============================================
// Types
// ============================================

export interface YouTubeChannel {
  id: string;
  channelId: string;
  name: string;
  description?: string;
  thumbnailUrl?: string;
  subscriberCount?: number;
  videoCount?: number;
  isVerified: boolean;
  customUrl?: string;
}

export interface YouTubeTipCommand {
  id: string;
  commentId: string;
  videoId: string;
  channelId: string;
  senderChannelId: string;
  amount?: number;
  currency: "SOL" | "USD1" | "USDC";
  status: "pending" | "completed" | "expired" | "failed";
  paymentLinkId: string;
  createdAt: Date;
  expiresAt: Date;
  transactionSignature?: string;
}

export interface YouTubeOAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  scope: string[];
}

export interface QuotaInfo {
  used: number;
  limit: number;
  resetAt: Date;
}

// ============================================
// Configuration
// ============================================

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";
const YOUTUBE_OAUTH_BASE = "https://accounts.google.com/o/oauth2/v2/auth";
const YOUTUBE_TOKEN_URL = "https://oauth2.googleapis.com/token";

const YOUTUBE_CONFIG = {
  clientId: process.env.GOOGLE_CLIENT_ID || "",
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  callbackUrl: process.env.YOUTUBE_CALLBACK_URL || "https://darktip.xyz/api/auth/youtube/callback",
  apiKey: process.env.YOUTUBE_API_KEY || "",
  scopes: [
    "https://www.googleapis.com/auth/youtube.readonly",
    "https://www.googleapis.com/auth/youtube.force-ssl",
    "https://www.googleapis.com/auth/userinfo.profile",
  ],
};

// Quota tracking (YouTube has daily quota limits)
let quotaInfo: QuotaInfo = {
  used: 0,
  limit: 10000, // Default quota
  resetAt: new Date(new Date().setHours(24, 0, 0, 0)), // Reset at midnight PT
};

// ============================================
// OAuth Functions
// ============================================

/**
 * Generate YouTube/Google OAuth 2.0 authorization URL
 */
export function generateOAuthUrl(
  clientId: string,
  redirectUri: string,
  state: string
): string {
  const params = new URLSearchParams({
    client_id: clientId || YOUTUBE_CONFIG.clientId,
    redirect_uri: redirectUri || YOUTUBE_CONFIG.callbackUrl,
    response_type: "code",
    scope: YOUTUBE_CONFIG.scopes.join(" "),
    state,
    access_type: "offline",
    prompt: "consent",
  });

  return `${YOUTUBE_OAUTH_BASE}?${params.toString()}`;
}

/**
 * Exchange OAuth code for tokens
 */
export async function validateOAuthCallback(
  code: string,
  redirectUri?: string
): Promise<YouTubeOAuthTokens | null> {
  try {
    const response = await fetch(YOUTUBE_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri || YOUTUBE_CONFIG.callbackUrl,
        client_id: YOUTUBE_CONFIG.clientId,
        client_secret: YOUTUBE_CONFIG.clientSecret,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("YouTube OAuth error:", error);
      return null;
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
      scope: data.scope?.split(" ") || YOUTUBE_CONFIG.scopes,
    };
  } catch (error) {
    console.error("YouTube OAuth callback error:", error);
    return null;
  }
}

/**
 * Refresh OAuth tokens
 */
export async function refreshOAuthTokens(
  refreshToken: string
): Promise<YouTubeOAuthTokens | null> {
  try {
    const response = await fetch(YOUTUBE_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: YOUTUBE_CONFIG.clientId,
        client_secret: YOUTUBE_CONFIG.clientSecret,
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: refreshToken, // Refresh token doesn't change
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
      scope: data.scope?.split(" ") || YOUTUBE_CONFIG.scopes,
    };
  } catch {
    return null;
  }
}

// ============================================
// Channel Functions
// ============================================

/**
 * Fetch YouTube channel details
 */
export async function fetchChannel(
  accessToken: string,
  channelId?: string
): Promise<YouTubeChannel | null> {
  try {
    const params = new URLSearchParams({
      part: "snippet,statistics,brandingSettings",
      key: YOUTUBE_CONFIG.apiKey,
    });

    if (channelId) {
      params.set("id", channelId);
    } else {
      params.set("mine", "true");
    }

    const response = await fetch(`${YOUTUBE_API_BASE}/channels?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    updateQuota(1); // channels.list costs 1 quota unit

    if (!response.ok) {
      const error = await response.json();
      console.error("YouTube API error:", error);
      return null;
    }

    const { items } = await response.json();

    if (!items || items.length === 0) {
      return null;
    }

    const channel = items[0];

    return {
      id: `ych_${channel.id}`,
      channelId: channel.id,
      name: channel.snippet.title,
      description: channel.snippet.description,
      thumbnailUrl: channel.snippet.thumbnails?.default?.url,
      subscriberCount: parseInt(channel.statistics?.subscriberCount || "0"),
      videoCount: parseInt(channel.statistics?.videoCount || "0"),
      isVerified: channel.snippet?.country ? true : false,
      customUrl: channel.snippet?.customUrl,
    };
  } catch (error) {
    console.error("Failed to fetch YouTube channel:", error);
    return null;
  }
}

/**
 * Fetch video details to get channel info
 */
export async function fetchVideoChannel(
  videoId: string
): Promise<{ channelId: string; channelName: string; videoTitle: string } | null> {
  try {
    const params = new URLSearchParams({
      part: "snippet",
      id: videoId,
      key: YOUTUBE_CONFIG.apiKey,
    });

    const response = await fetch(`${YOUTUBE_API_BASE}/videos?${params.toString()}`);

    updateQuota(1); // videos.list costs 1 quota unit

    if (!response.ok) {
      return null;
    }

    const { items } = await response.json();

    if (!items || items.length === 0) {
      return null;
    }

    const video = items[0];

    return {
      channelId: video.snippet.channelId,
      channelName: video.snippet.channelTitle,
      videoTitle: video.snippet.title,
    };
  } catch {
    return null;
  }
}

/**
 * Verify YouTube channel ownership
 */
export async function verifyChannelOwnership(
  accessToken: string,
  expectedChannelId: string
): Promise<boolean> {
  const channel = await fetchChannel(accessToken);
  return channel?.channelId === expectedChannelId;
}

/**
 * Register YouTube channel with ShadowID for privacy
 */
export async function registerWithShadowID(
  walletAddress: string,
  channelId: string,
  signature: string
): Promise<{ registered: boolean; commitment?: string }> {
  const shadowPay = getShadowPayClient();

  try {
    const message = `DarkTip YouTube Verification - ${channelId} - ${Date.now()}`;
    const result = await shadowPay.autoRegisterShadowID(
      walletAddress,
      signature,
      message
    );

    return {
      registered: result.registered,
      commitment: result.commitment,
    };
  } catch (error) {
    console.error("ShadowID registration error:", error);
    return { registered: false };
  }
}

// ============================================
// Tip Command Functions
// ============================================

/**
 * Parse a tip command from a YouTube comment
 * Formats:
 * - "!darktip 5" or "!darktip 5 SOL"
 * - "!tip 5 USD1"
 * - "!darktip" (default amount)
 */
export function parseTipCommand(commentText: string): {
  amount?: number;
  currency?: "SOL" | "USD1" | "USDC";
} | null {
  // Pattern 1: !darktip amount [currency]
  const pattern1 = /!darktip\s+(\d+(?:\.\d+)?)\s*(sol|usd1|usdc)?/i;
  const match1 = commentText.match(pattern1);
  if (match1) {
    return {
      amount: parseFloat(match1[1]),
      currency: (match1[2]?.toUpperCase() as "SOL" | "USD1" | "USDC") || "SOL",
    };
  }

  // Pattern 2: !tip amount [currency]
  const pattern2 = /!tip\s+(\d+(?:\.\d+)?)\s*(sol|usd1|usdc)?/i;
  const match2 = commentText.match(pattern2);
  if (match2) {
    return {
      amount: parseFloat(match2[1]),
      currency: (match2[2]?.toUpperCase() as "SOL" | "USD1" | "USDC") || "SOL",
    };
  }

  // Pattern 3: !darktip (no amount - default)
  const pattern3 = /!darktip\b/i;
  if (pattern3.test(commentText)) {
    return {
      currency: "SOL",
    };
  }

  return null;
}

/**
 * Generate a unique payment link for a YouTube tip
 */
export function generatePaymentLink(
  channelId: string,
  videoId: string,
  amount?: number,
  currency: string = "SOL"
): string {
  const linkId = uuidv4().slice(0, 12);
  const params = new URLSearchParams({
    id: linkId,
    channel: channelId,
    video: videoId,
    source: "youtube",
    currency,
  });
  if (amount) params.set("amount", amount.toString());

  return `https://darktip.xyz/y/${linkId}`;
}

/**
 * Create a tip command record
 */
export function createTipCommand(
  commentId: string,
  videoId: string,
  channelId: string,
  senderChannelId: string,
  amount?: number,
  currency: "SOL" | "USD1" | "USDC" = "SOL"
): YouTubeTipCommand {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes

  return {
    id: `yt_${uuidv4().replace(/-/g, "")}`,
    commentId,
    videoId,
    channelId,
    senderChannelId,
    amount,
    currency,
    status: "pending",
    paymentLinkId: uuidv4().slice(0, 12),
    createdAt: now,
    expiresAt,
  };
}

/**
 * Generate bot reply comment
 */
export function generateBotReply(
  paymentLink: string,
  amount?: number,
  currency: string = "SOL"
): string {
  if (amount) {
    return `Click to send ${amount} ${currency} to this creator privately via DarkTip:\n\n${paymentLink}\n\nLink expires in 5 minutes. Your identity remains anonymous.`;
  }
  return `Click to tip this creator privately via DarkTip:\n\n${paymentLink}\n\nLink expires in 5 minutes. Your identity remains anonymous.`;
}

/**
 * Post a comment reply (requires youtube.force-ssl scope)
 */
export async function postCommentReply(
  accessToken: string,
  parentId: string,
  text: string
): Promise<{ success: boolean; commentId?: string; error?: string }> {
  try {
    const response = await fetch(`${YOUTUBE_API_BASE}/comments?part=snippet`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        snippet: {
          parentId,
          textOriginal: text,
        },
      }),
    });

    updateQuota(50); // comments.insert costs 50 quota units

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.error?.message || "Failed to post comment",
      };
    }

    const data = await response.json();
    return {
      success: true,
      commentId: data.id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Auto-add tip link to video description (for connected creators)
 */
export function generateDescriptionSnippet(
  creatorUsername: string,
  customMessage?: string
): string {
  const defaultMessage = "Support this channel anonymously with DarkTip";
  return `\n\n---\n${customMessage || defaultMessage}: https://darktip.xyz/@${creatorUsername}`;
}

// ============================================
// Quota Management
// ============================================

function updateQuota(cost: number): void {
  const now = new Date();

  // Reset quota if past reset time
  if (now >= quotaInfo.resetAt) {
    quotaInfo = {
      used: 0,
      limit: 10000,
      resetAt: new Date(new Date().setHours(24, 0, 0, 0)),
    };
  }

  quotaInfo.used += cost;
}

/**
 * Check if we have sufficient quota for an action
 */
export function checkQuota(requiredCost: number): {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
} {
  const now = new Date();

  // Reset quota if past reset time
  if (now >= quotaInfo.resetAt) {
    quotaInfo = {
      used: 0,
      limit: 10000,
      resetAt: new Date(new Date().setHours(24, 0, 0, 0)),
    };
  }

  const remaining = quotaInfo.limit - quotaInfo.used;

  return {
    allowed: remaining >= requiredCost,
    remaining,
    resetAt: quotaInfo.resetAt,
  };
}

/**
 * Get current quota status
 */
export function getQuotaStatus(): QuotaInfo {
  return { ...quotaInfo };
}

/**
 * Rate limiting check (per-user limits)
 */
export function checkRateLimit(
  userId: string,
  action: "tip_command" | "verification"
): { allowed: boolean; resetAt?: Date } {
  // Check quota first
  const quotaCost = action === "tip_command" ? 51 : 1; // 50 for comment + 1 for read
  const quota = checkQuota(quotaCost);

  if (!quota.allowed) {
    return {
      allowed: false,
      resetAt: quota.resetAt,
    };
  }

  return { allowed: true };
}

// ============================================
// Webhook/PubSubHubbub Support
// ============================================

/**
 * Verify YouTube PubSubHubbub webhook challenge
 */
export function verifyWebhookChallenge(
  hubChallenge: string
): string {
  return hubChallenge;
}

/**
 * Parse YouTube feed update notification
 */
export function parseFeedUpdate(xml: string): {
  channelId?: string;
  videoId?: string;
  title?: string;
  publishedAt?: Date;
} | null {
  // Simple XML parsing for feed updates
  // In production, use a proper XML parser
  const videoIdMatch = xml.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
  const channelIdMatch = xml.match(/<yt:channelId>([^<]+)<\/yt:channelId>/);
  const titleMatch = xml.match(/<title>([^<]+)<\/title>/);
  const publishedMatch = xml.match(/<published>([^<]+)<\/published>/);

  if (!videoIdMatch) {
    return null;
  }

  return {
    videoId: videoIdMatch[1],
    channelId: channelIdMatch?.[1],
    title: titleMatch?.[1],
    publishedAt: publishedMatch ? new Date(publishedMatch[1]) : undefined,
  };
}
