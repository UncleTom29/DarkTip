/**
 * Twitter/X Integration
 *
 * This module handles Twitter integration for:
 * - OAuth authentication
 * - Tweet-based tipping commands
 * - Profile verification
 * - Badge display
 */

import { v4 as uuidv4 } from "uuid";

export interface TwitterUser {
  id: string;
  username: string;
  displayName: string;
  profileImage?: string;
  isVerified: boolean;
}

export interface TwitterTipCommand {
  id: string;
  tweetId: string;
  senderHandle: string;
  creatorHandle: string;
  amount?: number;
  status: "pending" | "completed" | "expired" | "failed";
  paymentLinkId: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface TwitterOAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

// Twitter API Configuration
const TWITTER_API_BASE = "https://api.twitter.com/2";
const TWITTER_OAUTH_BASE = "https://twitter.com/i/oauth2";

/**
 * Parse a tip command from a tweet
 * Formats: "@darktip tip @creator 5" or "@darktip 5"
 */
export function parseTipCommand(tweetText: string): {
  creatorHandle?: string;
  amount?: number;
} | null {
  // Pattern 1: @darktip tip @creator amount
  const fullPattern = /@darktip\s+tip\s+@(\w+)\s+(\d+(?:\.\d+)?)/i;
  const fullMatch = tweetText.match(fullPattern);
  if (fullMatch) {
    return {
      creatorHandle: fullMatch[1],
      amount: parseFloat(fullMatch[2]),
    };
  }

  // Pattern 2: @darktip amount (reply context)
  const shortPattern = /@darktip\s+(\d+(?:\.\d+)?)/i;
  const shortMatch = tweetText.match(shortPattern);
  if (shortMatch) {
    return {
      amount: parseFloat(shortMatch[1]),
    };
  }

  // Pattern 3: @darktip tip @creator (default amount)
  const noAmountPattern = /@darktip\s+tip\s+@(\w+)/i;
  const noAmountMatch = tweetText.match(noAmountPattern);
  if (noAmountMatch) {
    return {
      creatorHandle: noAmountMatch[1],
    };
  }

  return null;
}

/**
 * Generate a unique payment link for a tip command
 */
export function generatePaymentLink(
  creatorHandle: string,
  amount?: number,
  senderHandle?: string
): string {
  const linkId = uuidv4().slice(0, 12);
  const params = new URLSearchParams({
    id: linkId,
    creator: creatorHandle,
    source: "twitter",
  });
  if (amount) params.set("amount", amount.toString());
  if (senderHandle) params.set("from", senderHandle);

  return `https://darktip.xyz/t/${linkId}`;
}

/**
 * Create a tip command record
 */
export function createTipCommand(
  tweetId: string,
  senderHandle: string,
  creatorHandle: string,
  amount?: number
): TwitterTipCommand {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes

  return {
    id: `tc_${uuidv4().replace(/-/g, "")}`,
    tweetId,
    senderHandle,
    creatorHandle,
    amount,
    status: "pending",
    paymentLinkId: uuidv4().slice(0, 12),
    createdAt: now,
    expiresAt,
  };
}

/**
 * Generate bot reply message
 */
export function generateBotReply(
  senderHandle: string,
  creatorHandle: string,
  paymentLink: string,
  amount?: number
): string {
  if (amount) {
    return `@${senderHandle} Click to send ${amount} SOL to @${creatorHandle} anonymously: ${paymentLink}\n\nLink expires in 5 minutes.`;
  }
  return `@${senderHandle} Click to tip @${creatorHandle} anonymously: ${paymentLink}\n\nLink expires in 5 minutes.`;
}

/**
 * Generate confirmation tweet
 */
export function generateConfirmationTweet(
  senderHandle: string,
  creatorHandle: string
): string {
  return `Anonymous tip sent! @${senderHandle} has supported @${creatorHandle} via DarkTip.\n\nTip creators anonymously at https://darktip.xyz`;
}

/**
 * Validate Twitter OAuth callback
 */
export async function validateOAuthCallback(
  code: string,
  codeVerifier: string
): Promise<TwitterOAuthTokens | null> {
  // In production, this would exchange the code for tokens
  // using Twitter's OAuth 2.0 PKCE flow

  // Mock implementation
  return {
    accessToken: `at_${uuidv4()}`,
    refreshToken: `rt_${uuidv4()}`,
    expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
  };
}

/**
 * Fetch Twitter user profile
 */
export async function fetchTwitterUser(
  accessToken: string,
  username: string
): Promise<TwitterUser | null> {
  // In production, this would call Twitter API
  // Mock implementation
  return {
    id: `tw_${uuidv4().slice(0, 8)}`,
    username,
    displayName: username,
    isVerified: false,
  };
}

/**
 * Verify Twitter account ownership
 */
export async function verifyTwitterOwnership(
  accessToken: string,
  expectedUsername: string
): Promise<boolean> {
  const user = await fetchTwitterUser(accessToken, expectedUsername);
  return user?.username.toLowerCase() === expectedUsername.toLowerCase();
}

/**
 * Generate Twitter OAuth authorization URL
 */
export function generateOAuthUrl(
  clientId: string,
  redirectUri: string,
  state: string,
  codeChallenge: string
): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "tweet.read tweet.write users.read offline.access",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  return `${TWITTER_OAUTH_BASE}/authorize?${params.toString()}`;
}

/**
 * Rate limiting check
 */
export function checkRateLimit(
  userId: string,
  action: "tip_command" | "verification"
): { allowed: boolean; resetAt?: Date } {
  // In production, this would check Redis or similar
  // for rate limit status
  return { allowed: true };
}
