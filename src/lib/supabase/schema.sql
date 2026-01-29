-- DarkTip Database Schema
-- Run this SQL in Supabase SQL Editor to create the database schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Creators table
CREATE TABLE IF NOT EXISTS creators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  socials JSONB DEFAULT '{}',
  categories TEXT[] DEFAULT '{}',
  is_verified BOOLEAN DEFAULT FALSE,
  verification_date TIMESTAMPTZ,
  total_tips_received BIGINT DEFAULT 0,
  supporter_count INTEGER DEFAULT 0,
  privacy_settings JSONB DEFAULT '{"showTotalTips": true, "showSupporterCount": true, "requireProofForPerks": true, "allowAnonymousTips": true}',
  payout_settings JSONB DEFAULT '{"autoWithdrawEnabled": false, "preferPrivateWithdraw": true}',
  scan_public_key TEXT,
  spend_public_key TEXT,
  encryption_public_key TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Supporters table
CREATE TABLE IF NOT EXISTS supporters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT UNIQUE NOT NULL,
  anonymous_id TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  is_anonymous BOOLEAN DEFAULT TRUE,
  badges JSONB DEFAULT '[]',
  total_tips_sent BIGINT DEFAULT 0,
  creators_supported INTEGER DEFAULT 0,
  support_streak INTEGER DEFAULT 0,
  privacy_settings JSONB DEFAULT '{"showProfile": false, "showSupportedCreators": false, "showBadges": true, "allowShoutouts": false}',
  encryption_public_key TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tips table
CREATE TABLE IF NOT EXISTS tips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  supporter_id UUID REFERENCES supporters(id) ON DELETE SET NULL,
  anonymous_supporter_id TEXT NOT NULL,
  amount_encrypted TEXT NOT NULL,
  message_encrypted TEXT,
  privacy_level TEXT NOT NULL CHECK (privacy_level IN ('low', 'medium', 'high', 'maximum')),
  source TEXT NOT NULL CHECK (source IN ('direct', 'twitter', 'youtube', 'discord', 'embed', 'api', 'milestone')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'routing', 'completed', 'failed', 'refunded')),
  transaction_signature TEXT,
  stealth_address TEXT,
  ephemeral_public_key TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Milestones table
CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  goal_amount_lamports BIGINT NOT NULL,
  current_amount_lamports BIGINT DEFAULT 0,
  contributor_count INTEGER DEFAULT 0,
  deadline TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'funded', 'in_progress', 'delivered', 'failed', 'refunded')),
  type TEXT NOT NULL CHECK (type IN ('one_time', 'recurring', 'stretch', 'community_vote')),
  funding_type TEXT NOT NULL CHECK (funding_type IN ('all_or_nothing', 'keep_what_you_raise')),
  stretch_goals JSONB DEFAULT '[]',
  rewards JSONB DEFAULT '[]',
  escrow_address TEXT NOT NULL,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ
);

-- Milestone contributions table
CREATE TABLE IF NOT EXISTS milestone_contributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  milestone_id UUID NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
  supporter_id UUID NOT NULL REFERENCES supporters(id) ON DELETE CASCADE,
  anonymous_supporter_id TEXT NOT NULL,
  amount_encrypted TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  rewards_claimed TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Proofs table
CREATE TABLE IF NOT EXISTS proofs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supporter_id UUID NOT NULL REFERENCES supporters(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  proof_type TEXT NOT NULL CHECK (proof_type IN ('binary_support', 'tier_support', 'aggregate_support', 'time_bound_support')),
  tier TEXT CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  proof_data TEXT NOT NULL,
  public_inputs JSONB NOT NULL,
  is_valid BOOLEAN DEFAULT TRUE,
  is_revoked BOOLEAN DEFAULT FALSE,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  verified_on_chain BOOLEAN DEFAULT FALSE,
  verification_signature TEXT
);

-- Perks table
CREATE TABLE IF NOT EXISTS perks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  tier_required TEXT NOT NULL CHECK (tier_required IN ('bronze', 'silver', 'gold', 'platinum')),
  type TEXT NOT NULL CHECK (type IN ('content', 'badge', 'community_access', 'voting_rights', 'shoutout', 'direct_message', 'early_access', 'custom')),
  is_active BOOLEAN DEFAULT TRUE,
  is_limited BOOLEAN DEFAULT FALSE,
  max_claims INTEGER,
  claimed_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Perk access table
CREATE TABLE IF NOT EXISTS perk_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  perk_id UUID NOT NULL REFERENCES perks(id) ON DELETE CASCADE,
  supporter_id UUID NOT NULL REFERENCES supporters(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  proof_id UUID REFERENCES proofs(id) ON DELETE SET NULL,
  UNIQUE(perk_id, supporter_id)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('new_tip', 'milestone_reached', 'milestone_launched', 'perk_unlocked', 'proof_generated', 'message_received', 'creator_live', 'new_content', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supporter_id UUID NOT NULL REFERENCES supporters(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  amount_lamports BIGINT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'yearly')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'failed', 'pending')),
  next_charge_date TIMESTAMPTZ NOT NULL,
  last_charge_date TIMESTAMPTZ,
  failed_attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ,
  UNIQUE(supporter_id, creator_id)
);

-- Social connections table
CREATE TABLE IF NOT EXISTS social_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'youtube', 'discord', 'twitch')),
  platform_user_id TEXT NOT NULL,
  handle TEXT NOT NULL,
  display_name TEXT,
  profile_image TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_creators_username ON creators(username);
CREATE INDEX IF NOT EXISTS idx_creators_wallet ON creators(wallet_address);
CREATE INDEX IF NOT EXISTS idx_supporters_wallet ON supporters(wallet_address);
CREATE INDEX IF NOT EXISTS idx_tips_creator ON tips(creator_id);
CREATE INDEX IF NOT EXISTS idx_tips_status ON tips(status);
CREATE INDEX IF NOT EXISTS idx_tips_created ON tips(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_milestones_creator ON milestones(creator_id);
CREATE INDEX IF NOT EXISTS idx_milestones_status ON milestones(status);
CREATE INDEX IF NOT EXISTS idx_proofs_supporter ON proofs(supporter_id);
CREATE INDEX IF NOT EXISTS idx_proofs_creator ON proofs(creator_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(recipient_id) WHERE is_read = FALSE;

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_creators_updated_at
  BEFORE UPDATE ON creators
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_supporters_updated_at
  BEFORE UPDATE ON supporters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Row Level Security (RLS) Policies
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE supporters ENABLE ROW LEVEL SECURITY;
ALTER TABLE tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Public read access for creators (public profiles)
CREATE POLICY "Creators are viewable by everyone"
  ON creators FOR SELECT
  USING (true);

-- Creators can update their own profile
CREATE POLICY "Creators can update own profile"
  ON creators FOR UPDATE
  USING (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- Public milestones are viewable
CREATE POLICY "Public milestones are viewable"
  ON milestones FOR SELECT
  USING (is_public = true);

-- Notifications are only viewable by recipient
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (recipient_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- Enable realtime subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE tips;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE milestones;
