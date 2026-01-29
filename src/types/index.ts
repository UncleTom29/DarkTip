// DarkTip Core Type Definitions

import { PublicKey } from "@solana/web3.js";

// ============================================
// User & Authentication Types
// ============================================

export interface User {
  id: string;
  walletAddress: string;
  username?: string;
  displayName?: string;
  email?: string;
  avatar?: string;
  bio?: string;
  isCreator: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ============================================
// Creator Types
// ============================================

export interface Creator {
  id: string;
  walletAddress: string;
  username: string;
  displayName: string;
  bio: string;
  avatar?: string;
  bannerImage?: string;
  socials: CreatorSocials;
  categories: CreatorCategory[];
  isVerified: boolean;
  verificationDate?: Date;
  totalTipsReceived: number; // Aggregate only, for display
  supporterCount: number;
  createdAt: Date;
  updatedAt: Date;
  privacySettings: CreatorPrivacySettings;
  payoutSettings: PayoutSettings;
}

export interface CreatorSocials {
  twitter?: string;
  youtube?: string;
  twitch?: string;
  discord?: string;
  website?: string;
  github?: string;
  instagram?: string;
  tiktok?: string;
}

export type CreatorCategory =
  | "podcaster"
  | "artist"
  | "musician"
  | "writer"
  | "developer"
  | "journalist"
  | "activist"
  | "educator"
  | "gamer"
  | "filmmaker"
  | "photographer"
  | "other";

export interface CreatorPrivacySettings {
  showTotalTips: boolean;
  showSupporterCount: boolean;
  requireProofForPerks: boolean;
  minTipAmount?: number;
  allowAnonymousTips: boolean;
}

export interface PayoutSettings {
  primaryWallet: string;
  backupWallets: string[];
  autoWithdrawEnabled: boolean;
  autoWithdrawThreshold?: number;
  preferPrivateWithdraw: boolean;
}

// ============================================
// Supporter Types
// ============================================

export interface Supporter {
  id: string;
  walletAddress: string;
  anonymousId: string; // Used for display without revealing wallet
  username?: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
  isAnonymous: boolean;
  badges: SupporterBadge[];
  totalTipsSent: number; // Aggregate only
  creatorsSupported: number;
  joinedAt: Date;
  supportStreak: number; // Consecutive months
  privacySettings: SupporterPrivacySettings;
}

export interface SupporterPrivacySettings {
  showProfile: boolean;
  showSupportedCreators: boolean;
  showBadges: boolean;
  allowShoutouts: boolean;
}

export type SupporterTier = "bronze" | "silver" | "gold" | "platinum";

export interface SupporterBadge {
  id: string;
  type: BadgeType;
  tier?: SupporterTier;
  creatorId?: string;
  earnedAt: Date;
  isDisplayed: boolean;
}

export type BadgeType =
  | "first_tip"
  | "early_supporter"
  | "loyal_supporter"
  | "multi_supporter"
  | "generous_supporter"
  | "community_supporter"
  | "founding_supporter"
  | "tier_badge";

// ============================================
// Tip Types
// ============================================

export interface Tip {
  id: string;
  creatorId: string;
  supporterId?: string; // Null if fully anonymous
  anonymousSupporterId: string;
  amountLamports: number; // Encrypted in storage
  amountEncrypted: string; // Encrypted amount
  message?: string; // Encrypted message
  messageEncrypted?: string;
  privacyLevel: PrivacyLevel;
  source: TipSource;
  status: TipStatus;
  transactionSignature?: string;
  stealthAddress?: string;
  createdAt: Date;
  completedAt?: Date;
}

export type PrivacyLevel = "low" | "medium" | "high" | "maximum";

export type TipSource =
  | "direct"
  | "twitter"
  | "youtube"
  | "discord"
  | "embed"
  | "api"
  | "milestone";

export type TipStatus =
  | "pending"
  | "processing"
  | "routing"
  | "completed"
  | "failed"
  | "refunded";

export interface TipRequest {
  creatorId: string;
  amountSOL: number;
  message?: string;
  privacyLevel: PrivacyLevel;
  source: TipSource;
}

export interface TipResult {
  success: boolean;
  tipId?: string;
  transactionSignature?: string;
  error?: string;
  proofGenerated?: boolean;
}

// ============================================
// Milestone Types
// ============================================

export interface Milestone {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  goalAmountLamports: number;
  currentAmountLamports: number; // Aggregate only
  contributorCount: number;
  deadline?: Date;
  status: MilestoneStatus;
  type: MilestoneType;
  fundingType: MilestoneFundingType;
  stretchGoals?: StretchGoal[];
  rewards?: MilestoneReward[];
  escrowAddress: string;
  isPublic: boolean;
  createdAt: Date;
  completedAt?: Date;
  deliveredAt?: Date;
}

export type MilestoneStatus =
  | "draft"
  | "active"
  | "funded"
  | "in_progress"
  | "delivered"
  | "failed"
  | "refunded";

export type MilestoneType =
  | "one_time"
  | "recurring"
  | "stretch"
  | "community_vote";

export type MilestoneFundingType =
  | "all_or_nothing"
  | "keep_what_you_raise";

export interface StretchGoal {
  id: string;
  milestoneId: string;
  title: string;
  description: string;
  goalAmountLamports: number;
  isReached: boolean;
  rewards?: MilestoneReward[];
}

export interface MilestoneReward {
  id: string;
  milestoneId: string;
  stretchGoalId?: string;
  title: string;
  description: string;
  tier: SupporterTier;
  type: RewardType;
  quantity?: number; // Limited quantity
  claimed: number;
}

export type RewardType =
  | "content"
  | "badge"
  | "community_access"
  | "voting_rights"
  | "shoutout"
  | "direct_message"
  | "early_access"
  | "custom";

export interface MilestoneContribution {
  id: string;
  milestoneId: string;
  supporterId: string;
  anonymousSupporterId: string;
  amountLamports: number;
  amountEncrypted: string;
  tier: SupporterTier;
  rewardsClaimed: string[];
  createdAt: Date;
}

// ============================================
// Perk Types
// ============================================

export interface Perk {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  tierRequired: SupporterTier;
  type: RewardType;
  isActive: boolean;
  isLimited: boolean;
  maxClaims?: number;
  claimedCount: number;
  expiresAt?: Date;
  createdAt: Date;
}

export interface PerkAccess {
  perkId: string;
  supporterId: string;
  grantedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  proofId?: string;
}

// ============================================
// ZK Proof Types
// ============================================

export interface ZKProof {
  id: string;
  supporterId: string;
  creatorId: string;
  proofType: ProofType;
  tier?: SupporterTier;
  proofData: string; // Serialized proof
  publicInputs: ProofPublicInputs;
  isValid: boolean;
  isRevoked: boolean;
  generatedAt: Date;
  expiresAt?: Date;
  verifiedOnChain: boolean;
  verificationSignature?: string;
}

export type ProofType =
  | "binary_support"      // "I tipped Creator X at least once"
  | "tier_support"        // "My total tips are in tier Y"
  | "aggregate_support"   // "I tipped total amount across all creators"
  | "time_bound_support"; // "I tipped Creator X in the last N days"

export interface ProofPublicInputs {
  creatorId: string;
  proofType: ProofType;
  tier?: SupporterTier;
  timestamp?: number;
  proofHash: string;
}

export interface ProofGenerationRequest {
  creatorId: string;
  proofType: ProofType;
  tier?: SupporterTier;
  timeWindowDays?: number;
}

export interface ProofVerificationResult {
  isValid: boolean;
  proofType: ProofType;
  creatorId: string;
  tier?: SupporterTier;
  error?: string;
}

// ============================================
// Privacy Types
// ============================================

export interface StealthAddress {
  publicKey: string;
  scanKey: string;
  spendKey: string;
}

export interface EncryptedMessage {
  ciphertext: string;
  nonce: string;
  ephemeralPublicKey: string;
}

export interface PrivacyTransaction {
  id: string;
  stealthAddress: string;
  amountCommitment: string; // Pedersen commitment
  rangeProof: string; // ZK range proof
  decoys: string[]; // Decoy outputs
  routingPath: string[]; // Multi-hop routing
  timestamp: number;
}

// ============================================
// Notification Types
// ============================================

export interface Notification {
  id: string;
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: Date;
}

export type NotificationType =
  | "new_tip"
  | "milestone_reached"
  | "milestone_launched"
  | "perk_unlocked"
  | "proof_generated"
  | "message_received"
  | "creator_live"
  | "new_content"
  | "system";

// ============================================
// Social Integration Types
// ============================================

export interface TwitterAccount {
  userId: string;
  handle: string;
  displayName: string;
  profileImage?: string;
  isVerified: boolean;
  accessToken: string;
  refreshToken: string;
  connectedAt: Date;
}

export interface YouTubeChannel {
  channelId: string;
  channelName: string;
  profileImage?: string;
  subscriberCount?: number;
  isVerified: boolean;
  accessToken: string;
  refreshToken: string;
  connectedAt: Date;
}

export interface SocialTipCommand {
  platform: "twitter" | "youtube";
  commandId: string;
  senderHandle: string;
  creatorHandle: string;
  amount?: number;
  paymentLinkId: string;
  status: "pending" | "completed" | "expired" | "failed";
  createdAt: Date;
}

// ============================================
// Analytics Types
// ============================================

export interface CreatorAnalytics {
  creatorId: string;
  period: AnalyticsPeriod;
  totalTips: number;
  tipCount: number;
  uniqueSupporters: number;
  averageTip: number;
  topSources: Record<TipSource, number>;
  growthRate: number;
  updatedAt: Date;
}

export type AnalyticsPeriod = "day" | "week" | "month" | "year" | "all_time";

export interface SupporterAnalytics {
  supporterId: string;
  totalTipsSent: number;
  creatorsSupported: number;
  averageTipSize: number;
  favoriteCreators: string[];
  supportStreak: number;
}

// ============================================
// Subscription Types
// ============================================

export interface Subscription {
  id: string;
  supporterId: string;
  creatorId: string;
  amountLamports: number;
  frequency: SubscriptionFrequency;
  status: SubscriptionStatus;
  nextChargeDate: Date;
  lastChargeDate?: Date;
  failedAttempts: number;
  createdAt: Date;
  cancelledAt?: Date;
}

export type SubscriptionFrequency = "weekly" | "monthly" | "yearly";

export type SubscriptionStatus =
  | "active"
  | "paused"
  | "cancelled"
  | "failed"
  | "pending";

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiMeta {
  page?: number;
  pageSize?: number;
  total?: number;
  hasMore?: boolean;
}

// ============================================
// Form Types
// ============================================

export interface CreateCreatorForm {
  username: string;
  displayName: string;
  bio: string;
  avatar?: File;
  socials: CreatorSocials;
  categories: CreatorCategory[];
}

export interface CreateMilestoneForm {
  title: string;
  description: string;
  goalAmountSOL: number;
  deadline?: Date;
  type: MilestoneType;
  fundingType: MilestoneFundingType;
  rewards?: Omit<MilestoneReward, "id" | "milestoneId" | "claimed">[];
  isPublic: boolean;
}

export interface CreatePerkForm {
  title: string;
  description: string;
  tierRequired: SupporterTier;
  type: RewardType;
  isLimited: boolean;
  maxClaims?: number;
  expiresAt?: Date;
}

// ============================================
// State Types
// ============================================

export interface AppState {
  auth: AuthState;
  ui: UIState;
}

export interface UIState {
  isSidebarOpen: boolean;
  theme: "light" | "dark" | "system";
  notifications: Notification[];
  isLoading: boolean;
}
