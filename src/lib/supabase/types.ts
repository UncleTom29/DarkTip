/**
 * Supabase Database Types
 *
 * These types represent the database schema for DarkTip.
 * Generate from Supabase CLI: npx supabase gen types typescript
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      creators: {
        Row: {
          id: string;
          wallet_address: string;
          username: string;
          display_name: string;
          bio: string | null;
          avatar_url: string | null;
          banner_url: string | null;
          socials: Json | null;
          categories: string[] | null;
          is_verified: boolean;
          verification_date: string | null;
          total_tips_received: number;
          supporter_count: number;
          privacy_settings: Json | null;
          payout_settings: Json | null;
          scan_public_key: string | null;
          spend_public_key: string | null;
          encryption_public_key: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          wallet_address: string;
          username: string;
          display_name: string;
          bio?: string | null;
          avatar_url?: string | null;
          banner_url?: string | null;
          socials?: Json | null;
          categories?: string[] | null;
          is_verified?: boolean;
          verification_date?: string | null;
          total_tips_received?: number;
          supporter_count?: number;
          privacy_settings?: Json | null;
          payout_settings?: Json | null;
          scan_public_key?: string | null;
          spend_public_key?: string | null;
          encryption_public_key?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          wallet_address?: string;
          username?: string;
          display_name?: string;
          bio?: string | null;
          avatar_url?: string | null;
          banner_url?: string | null;
          socials?: Json | null;
          categories?: string[] | null;
          is_verified?: boolean;
          verification_date?: string | null;
          total_tips_received?: number;
          supporter_count?: number;
          privacy_settings?: Json | null;
          payout_settings?: Json | null;
          scan_public_key?: string | null;
          spend_public_key?: string | null;
          encryption_public_key?: string | null;
          updated_at?: string;
        };
      };
      supporters: {
        Row: {
          id: string;
          wallet_address: string;
          anonymous_id: string;
          username: string | null;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          is_anonymous: boolean;
          badges: Json | null;
          total_tips_sent: number;
          creators_supported: number;
          support_streak: number;
          privacy_settings: Json | null;
          encryption_public_key: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          wallet_address: string;
          anonymous_id: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          is_anonymous?: boolean;
          badges?: Json | null;
          total_tips_sent?: number;
          creators_supported?: number;
          support_streak?: number;
          privacy_settings?: Json | null;
          encryption_public_key?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          wallet_address?: string;
          anonymous_id?: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          is_anonymous?: boolean;
          badges?: Json | null;
          total_tips_sent?: number;
          creators_supported?: number;
          support_streak?: number;
          privacy_settings?: Json | null;
          encryption_public_key?: string | null;
          updated_at?: string;
        };
      };
      tips: {
        Row: {
          id: string;
          creator_id: string;
          supporter_id: string | null;
          anonymous_supporter_id: string;
          amount_encrypted: string;
          message_encrypted: string | null;
          privacy_level: string;
          source: string;
          status: string;
          transaction_signature: string | null;
          stealth_address: string | null;
          ephemeral_public_key: string | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          creator_id: string;
          supporter_id?: string | null;
          anonymous_supporter_id: string;
          amount_encrypted: string;
          message_encrypted?: string | null;
          privacy_level: string;
          source: string;
          status: string;
          transaction_signature?: string | null;
          stealth_address?: string | null;
          ephemeral_public_key?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          creator_id?: string;
          supporter_id?: string | null;
          anonymous_supporter_id?: string;
          amount_encrypted?: string;
          message_encrypted?: string | null;
          privacy_level?: string;
          source?: string;
          status?: string;
          transaction_signature?: string | null;
          stealth_address?: string | null;
          ephemeral_public_key?: string | null;
          completed_at?: string | null;
        };
      };
      milestones: {
        Row: {
          id: string;
          creator_id: string;
          title: string;
          description: string;
          goal_amount_lamports: number;
          current_amount_lamports: number;
          contributor_count: number;
          deadline: string | null;
          status: string;
          type: string;
          funding_type: string;
          stretch_goals: Json | null;
          rewards: Json | null;
          escrow_address: string;
          is_public: boolean;
          created_at: string;
          completed_at: string | null;
          delivered_at: string | null;
        };
        Insert: {
          id?: string;
          creator_id: string;
          title: string;
          description: string;
          goal_amount_lamports: number;
          current_amount_lamports?: number;
          contributor_count?: number;
          deadline?: string | null;
          status?: string;
          type: string;
          funding_type: string;
          stretch_goals?: Json | null;
          rewards?: Json | null;
          escrow_address: string;
          is_public?: boolean;
          created_at?: string;
          completed_at?: string | null;
          delivered_at?: string | null;
        };
        Update: {
          creator_id?: string;
          title?: string;
          description?: string;
          goal_amount_lamports?: number;
          current_amount_lamports?: number;
          contributor_count?: number;
          deadline?: string | null;
          status?: string;
          type?: string;
          funding_type?: string;
          stretch_goals?: Json | null;
          rewards?: Json | null;
          escrow_address?: string;
          is_public?: boolean;
          completed_at?: string | null;
          delivered_at?: string | null;
        };
      };
      milestone_contributions: {
        Row: {
          id: string;
          milestone_id: string;
          supporter_id: string;
          anonymous_supporter_id: string;
          amount_encrypted: string;
          tier: string;
          rewards_claimed: string[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          milestone_id: string;
          supporter_id: string;
          anonymous_supporter_id: string;
          amount_encrypted: string;
          tier: string;
          rewards_claimed?: string[] | null;
          created_at?: string;
        };
        Update: {
          milestone_id?: string;
          supporter_id?: string;
          anonymous_supporter_id?: string;
          amount_encrypted?: string;
          tier?: string;
          rewards_claimed?: string[] | null;
        };
      };
      proofs: {
        Row: {
          id: string;
          supporter_id: string;
          creator_id: string;
          proof_type: string;
          tier: string | null;
          proof_data: string;
          public_inputs: Json;
          is_valid: boolean;
          is_revoked: boolean;
          generated_at: string;
          expires_at: string | null;
          verified_on_chain: boolean;
          verification_signature: string | null;
        };
        Insert: {
          id?: string;
          supporter_id: string;
          creator_id: string;
          proof_type: string;
          tier?: string | null;
          proof_data: string;
          public_inputs: Json;
          is_valid?: boolean;
          is_revoked?: boolean;
          generated_at?: string;
          expires_at?: string | null;
          verified_on_chain?: boolean;
          verification_signature?: string | null;
        };
        Update: {
          supporter_id?: string;
          creator_id?: string;
          proof_type?: string;
          tier?: string | null;
          proof_data?: string;
          public_inputs?: Json;
          is_valid?: boolean;
          is_revoked?: boolean;
          expires_at?: string | null;
          verified_on_chain?: boolean;
          verification_signature?: string | null;
        };
      };
      perks: {
        Row: {
          id: string;
          creator_id: string;
          title: string;
          description: string;
          tier_required: string;
          type: string;
          is_active: boolean;
          is_limited: boolean;
          max_claims: number | null;
          claimed_count: number;
          expires_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          title: string;
          description: string;
          tier_required: string;
          type: string;
          is_active?: boolean;
          is_limited?: boolean;
          max_claims?: number | null;
          claimed_count?: number;
          expires_at?: string | null;
          created_at?: string;
        };
        Update: {
          creator_id?: string;
          title?: string;
          description?: string;
          tier_required?: string;
          type?: string;
          is_active?: boolean;
          is_limited?: boolean;
          max_claims?: number | null;
          claimed_count?: number;
          expires_at?: string | null;
        };
      };
      perk_access: {
        Row: {
          id: string;
          perk_id: string;
          supporter_id: string;
          granted_at: string;
          expires_at: string | null;
          is_active: boolean;
          proof_id: string | null;
        };
        Insert: {
          id?: string;
          perk_id: string;
          supporter_id: string;
          granted_at?: string;
          expires_at?: string | null;
          is_active?: boolean;
          proof_id?: string | null;
        };
        Update: {
          perk_id?: string;
          supporter_id?: string;
          expires_at?: string | null;
          is_active?: boolean;
          proof_id?: string | null;
        };
      };
      notifications: {
        Row: {
          id: string;
          recipient_id: string;
          type: string;
          title: string;
          message: string;
          data: Json | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          recipient_id: string;
          type: string;
          title: string;
          message: string;
          data?: Json | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          recipient_id?: string;
          type?: string;
          title?: string;
          message?: string;
          data?: Json | null;
          is_read?: boolean;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          supporter_id: string;
          creator_id: string;
          amount_lamports: number;
          frequency: string;
          status: string;
          next_charge_date: string;
          last_charge_date: string | null;
          failed_attempts: number;
          created_at: string;
          cancelled_at: string | null;
        };
        Insert: {
          id?: string;
          supporter_id: string;
          creator_id: string;
          amount_lamports: number;
          frequency: string;
          status?: string;
          next_charge_date: string;
          last_charge_date?: string | null;
          failed_attempts?: number;
          created_at?: string;
          cancelled_at?: string | null;
        };
        Update: {
          supporter_id?: string;
          creator_id?: string;
          amount_lamports?: number;
          frequency?: string;
          status?: string;
          next_charge_date?: string;
          last_charge_date?: string | null;
          failed_attempts?: number;
          cancelled_at?: string | null;
        };
      };
      social_connections: {
        Row: {
          id: string;
          user_id: string;
          platform: string;
          platform_user_id: string;
          handle: string;
          display_name: string | null;
          profile_image: string | null;
          is_verified: boolean;
          access_token_encrypted: string | null;
          refresh_token_encrypted: string | null;
          token_expires_at: string | null;
          connected_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          platform: string;
          platform_user_id: string;
          handle: string;
          display_name?: string | null;
          profile_image?: string | null;
          is_verified?: boolean;
          access_token_encrypted?: string | null;
          refresh_token_encrypted?: string | null;
          token_expires_at?: string | null;
          connected_at?: string;
        };
        Update: {
          user_id?: string;
          platform?: string;
          platform_user_id?: string;
          handle?: string;
          display_name?: string | null;
          profile_image?: string | null;
          is_verified?: boolean;
          access_token_encrypted?: string | null;
          refresh_token_encrypted?: string | null;
          token_expires_at?: string | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
