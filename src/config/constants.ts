// DarkTip Platform Constants

export const PLATFORM_NAME = "DarkTip";
export const PLATFORM_DESCRIPTION = "Privacy-preserving tipping platform for content creators";
export const PLATFORM_URL = "https://darktip.xyz";

// Solana Configuration
export const SOLANA_NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet";
export const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || "https://api.devnet.solana.com";
export const HELIUS_API_KEY = process.env.NEXT_PUBLIC_HELIUS_API_KEY || "";

// Platform Fees
export const PLATFORM_FEE_PERCENTAGE = 2.5; // 2.5% platform fee
export const MIN_TIP_AMOUNT_SOL = 0.01; // Minimum tip: 0.01 SOL
export const MAX_TIP_AMOUNT_SOL = 1000; // Maximum tip: 1000 SOL per transaction

// Privacy Levels
export const PRIVACY_LEVELS = {
  low: {
    hops: 1,
    mixing: false,
    estimatedTime: 5, // seconds
    additionalFee: 0,
  },
  medium: {
    hops: 3,
    mixing: true,
    estimatedTime: 30,
    additionalFee: 0.001, // SOL
  },
  high: {
    hops: 5,
    mixing: true,
    estimatedTime: 180, // 3 minutes
    additionalFee: 0.005,
  },
  maximum: {
    hops: 7,
    mixing: true,
    estimatedTime: 600, // 10 minutes
    additionalFee: 0.01,
  },
} as const;

// Supporter Tiers
export const SUPPORTER_TIERS = {
  bronze: { min: 0, max: 10, label: "Bronze" },
  silver: { min: 10, max: 50, label: "Silver" },
  gold: { min: 50, max: 100, label: "Gold" },
  platinum: { min: 100, max: Infinity, label: "Platinum" },
} as const;

// Quick Tip Amounts
export const QUICK_TIP_AMOUNTS = [1, 5, 10, 20, 50] as const;

// Message Limits
export const MAX_MESSAGE_LENGTH = 280;
export const MAX_BIO_LENGTH = 500;
export const MAX_MILESTONE_DESCRIPTION_LENGTH = 500;

// Timeouts
export const PAYMENT_LINK_EXPIRY_MINUTES = 5;
export const PROOF_SHARE_LINK_EXPIRY_DAYS = 7;

// ZK Proof Configuration
export const ZK_PROOF_CONFIG = {
  generationTimeoutMs: 60000, // 60 seconds max
  maxProofSizeBytes: 2048, // 2KB max proof size
  verificationTimeoutMs: 5000, // 5 seconds max verification
};

// Social Media Integration
export const TWITTER_BOT_USERNAME = "darktip";
export const TWITTER_TIP_COMMAND = "@darktip tip";
export const YOUTUBE_TIP_COMMAND = "!darktip";

// API Rate Limits
export const RATE_LIMITS = {
  tipsPerHour: 10,
  tipsToSameCreatorPerDay: 3,
  commandCooldownSeconds: 10,
};

// Milestone Configuration
export const MILESTONE_CONFIG = {
  minGoalSOL: 1,
  maxGoalSOL: 100000,
  maxStretchGoals: 5,
  defaultDeadlineDays: 30,
};

// Supabase Configuration
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Feature Flags
export const FEATURES = {
  enableRecurringTips: true,
  enableBatchTipping: true,
  enableMilestones: true,
  enableSocialIntegration: true,
  enableZKProofs: true,
  enableEncryptedMessages: true,
  enableAnalytics: true,
};
