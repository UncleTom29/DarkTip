/**
 * YouTube Integration
 *
 * This module handles YouTube integration for:
 * - OAuth authentication
 * - Comment-based tipping commands
 * - Channel verification
 * - Tip link generation
 */

import { v4 as uuidv4 } from "uuid";

export interface YouTubeChannel {
  id: string;
  channelId: string;
  name: string;
  description?: string;
  thumbnailUrl?: string;
  subscriberCount?: number;
  isVerified: boolean;
}

export interface YouTubeTipCommand {
  id: string;
  commentId: string;
  videoId: string;
  channelId: string;
  senderChannelId: string;
  amount?: number;
  status: "pending" | "completed" | "expired" | "failed";
  paymentLinkId: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface YouTubeOAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

// YouTube API Configuration
const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";
const YOUTUBE_OAUTH_BASE = "https://accounts.google.com/o/oauth2/v2/auth";

/**
 * Parse a tip command from a YouTube comment
 * Formats: "!darktip 5" or "!tip 5 SOL"
 */
export function parseTipCommand(commentText: string): {
  amount?: number;
} | null {
  // Pattern 1: !darktip amount
  const pattern1 = /!darktip\s+(\d+(?:\.\d+)?)/i;
  const match1 = commentText.match(pattern1);
  if (match1) {
    return { amount: parseFloat(match1[1]) };
  }

  // Pattern 2: !tip amount SOL
  const pattern2 = /!tip\s+(\d+(?:\.\d+)?)\s*(?:SOL)?/i;
  const match2 = commentText.match(pattern2);
  if (match2) {
    return { amount: parseFloat(match2[1]) };
  }

  return null;
}

/**
 * Generate a unique payment link for a YouTube tip
 */
export function generatePaymentLink(
  channelId: string,
  videoId: string,
  amount?: number
): string {
  const linkId = uuidv4().slice(0, 12);
  const params = new URLSearchParams({
    id: linkId,
    channel: channelId,
    video: videoId,
    source: "youtube",
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
  amount?: number
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
  amount?: number
): string {
  if (amount) {
    return `Click to send ${amount} SOL to this creator anonymously: ${paymentLink}\n\nLink expires in 5 minutes. Powered by DarkTip.`;
  }
  return `Click to tip this creator anonymously: ${paymentLink}\n\nLink expires in 5 minutes. Powered by DarkTip.`;
}

/**
 * Validate YouTube OAuth callback
 */
export async function validateOAuthCallback(
  code: string,
  redirectUri: string
): Promise<YouTubeOAuthTokens | null> {
  // In production, this would exchange the code for tokens
  // using Google's OAuth 2.0 flow

  // Mock implementation
  return {
    accessToken: `ya_${uuidv4()}`,
    refreshToken: `yr_${uuidv4()}`,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
  };
}

/**
 * Fetch YouTube channel details
 */
export async function fetchChannel(
  accessToken: string,
  channelId?: string
): Promise<YouTubeChannel | null> {
  // In production, this would call YouTube Data API
  // Mock implementation
  return {
    id: `ych_${uuidv4().slice(0, 8)}`,
    channelId: channelId || `UC${uuidv4().slice(0, 22)}`,
    name: "Mock Channel",
    isVerified: false,
  };
}

/**
 * Fetch video details to get channel info
 */
export async function fetchVideoChannel(
  videoId: string
): Promise<{ channelId: string; channelName: string } | null> {
  // In production, this would call YouTube Data API
  // Mock implementation
  return {
    channelId: `UC${uuidv4().slice(0, 22)}`,
    channelName: "Mock Channel",
  };
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
 * Generate YouTube OAuth authorization URL
 */
export function generateOAuthUrl(
  clientId: string,
  redirectUri: string,
  state: string
): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.force-ssl",
    state,
    access_type: "offline",
    prompt: "consent",
  });

  return `${YOUTUBE_OAUTH_BASE}?${params.toString()}`;
}

/**
 * Auto-add tip link to video description (for connected creators)
 */
export function generateDescriptionSnippet(creatorUsername: string): string {
  return `\n\n---\nSupport this channel anonymously with DarkTip: https://darktip.xyz/@${creatorUsername}`;
}

/**
 * Rate limiting check
 */
export function checkRateLimit(
  userId: string,
  action: "tip_command" | "verification"
): { allowed: boolean; resetAt?: Date } {
  // In production, this would check Redis or similar
  return { allowed: true };
}
