"use client";

import React from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Shield,
  Twitter,
  Youtube,
  Globe,
  Github,
  Users,
  TrendingUp,
  Calendar,
  CheckCircle,
  Target,
  MessageSquare,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { TipModal } from "@/components/tip/TipModal";
import { TipButton } from "@/components/tip/TipButton";
import type { Creator, Milestone, Perk } from "@/types";

// Mock data - in production, this would come from API
const mockCreator: Creator = {
  id: "1",
  walletAddress: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  username: "alice_dev",
  displayName: "Alice Developer",
  bio: "Building the future of decentralized applications. Open source advocate and privacy enthusiast. I create tutorials, build tools, and contribute to the Solana ecosystem. Your support helps me stay independent.",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alice",
  bannerImage: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200",
  categories: ["developer", "educator"],
  isVerified: true,
  verificationDate: new Date("2024-02-01"),
  totalTipsReceived: 125000000000,
  supporterCount: 342,
  createdAt: new Date("2024-01-15"),
  updatedAt: new Date(),
  socials: {
    twitter: "alice_dev",
    github: "alicedev",
    youtube: "alicedevtutorials",
    website: "https://alice.dev",
  },
  privacySettings: {
    showTotalTips: true,
    showSupporterCount: true,
    requireProofForPerks: true,
    allowAnonymousTips: true,
  },
  payoutSettings: {
    primaryWallet: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    backupWallets: [],
    autoWithdrawEnabled: false,
    preferPrivateWithdraw: true,
  },
};

const mockMilestones: Milestone[] = [
  {
    id: "1",
    creatorId: "1",
    title: "Open Source ZK Toolkit",
    description: "Build and release a comprehensive ZK proof toolkit for Solana developers",
    goalAmountLamports: 50000000000,
    currentAmountLamports: 32500000000,
    contributorCount: 45,
    deadline: new Date("2025-03-15"),
    status: "active",
    type: "one_time",
    fundingType: "all_or_nothing",
    escrowAddress: "EscrowXXXXXX",
    isPublic: true,
    createdAt: new Date("2025-01-01"),
  },
  {
    id: "2",
    creatorId: "1",
    title: "Monthly Tutorial Videos",
    description: "Create 4 in-depth tutorial videos per month on privacy tech",
    goalAmountLamports: 10000000000,
    currentAmountLamports: 8500000000,
    contributorCount: 28,
    status: "active",
    type: "recurring",
    fundingType: "keep_what_you_raise",
    escrowAddress: "EscrowYYYYYY",
    isPublic: true,
    createdAt: new Date("2025-01-15"),
  },
];

const mockPerks: Perk[] = [
  {
    id: "1",
    creatorId: "1",
    title: "Early Access",
    description: "Get early access to all tutorials and tools before public release",
    tierRequired: "bronze",
    type: "early_access",
    isActive: true,
    isLimited: false,
    claimedCount: 156,
    createdAt: new Date("2024-01-15"),
  },
  {
    id: "2",
    creatorId: "1",
    title: "Supporter Discord",
    description: "Access to private Discord channel for supporters only",
    tierRequired: "silver",
    type: "community_access",
    isActive: true,
    isLimited: false,
    claimedCount: 89,
    createdAt: new Date("2024-01-15"),
  },
  {
    id: "3",
    creatorId: "1",
    title: "Monthly Office Hours",
    description: "1-on-1 video call for code review or Q&A (30 min/month)",
    tierRequired: "gold",
    type: "direct_message",
    isActive: true,
    isLimited: true,
    maxClaims: 10,
    claimedCount: 8,
    createdAt: new Date("2024-01-15"),
  },
  {
    id: "4",
    creatorId: "1",
    title: "Founding Supporter Badge",
    description: "Exclusive NFT badge for platinum supporters",
    tierRequired: "platinum",
    type: "badge",
    isActive: true,
    isLimited: true,
    maxClaims: 25,
    claimedCount: 12,
    createdAt: new Date("2024-01-15"),
  },
];

function formatSOL(lamports: number): string {
  return (lamports / 1e9).toFixed(2);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  }).format(date);
}

const socialIcons: Record<string, typeof Twitter> = {
  twitter: Twitter,
  youtube: Youtube,
  github: Github,
  website: Globe,
};

export default function CreatorProfilePage() {
  const params = useParams();
  const username = params.username as string;

  // In production, fetch creator by username
  const creator = mockCreator;
  const milestones = mockMilestones;
  const perks = mockPerks;

  if (!creator) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Creator not found</h1>
          <p className="text-gray-400">The creator @{username} does not exist</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Header />
      <TipModal />

      {/* Banner */}
      <div className="relative h-64 md:h-80 bg-gray-900">
        {creator.bannerImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={creator.bannerImage}
            alt="Banner"
            className="w-full h-full object-cover opacity-50"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/50 to-transparent" />
      </div>

      <main className="container mx-auto px-4 -mt-32 relative pb-20">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-end mb-8">
          <Avatar
            src={creator.avatar}
            alt={creator.displayName}
            size="xl"
            className="w-32 h-32 border-4 border-gray-950"
          />
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{creator.displayName}</h1>
              {creator.isVerified && (
                <Badge variant="default">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
            <p className="text-gray-400 mb-4">@{creator.username}</p>
            <div className="flex flex-wrap gap-4 text-sm">
              {creator.privacySettings.showSupporterCount && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-400" />
                  <span>{creator.supporterCount} supporters</span>
                </div>
              )}
              {creator.privacySettings.showTotalTips && (
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-400" />
                  <span>{formatSOL(creator.totalTipsReceived)} SOL received</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-gray-400">
                  Joined {formatDate(creator.createdAt)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            {Object.entries(creator.socials).map(([platform, handle]) => {
              if (!handle) return null;
              const Icon = socialIcons[platform] || Globe;
              const url = platform === "website" ? handle :
                platform === "twitter" ? `https://twitter.com/${handle}` :
                platform === "youtube" ? `https://youtube.com/@${handle}` :
                platform === "github" ? `https://github.com/${handle}` : "#";
              return (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
                >
                  <Icon className="h-5 w-5" />
                </a>
              );
            })}
            <TipButton creator={creator} size="lg" />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 whitespace-pre-wrap">{creator.bio}</p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {creator.categories.map((cat) => (
                    <Badge key={cat} variant="secondary">
                      {cat}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Active Milestones */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-400" />
                  Active Milestones
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {milestones.filter(m => m.status === "active").map((milestone) => {
                  const progress = (milestone.currentAmountLamports / milestone.goalAmountLamports) * 100;
                  return (
                    <div key={milestone.id} className="p-4 bg-gray-800/50 rounded-xl">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{milestone.title}</h4>
                          <p className="text-sm text-gray-400 mt-1">
                            {milestone.description}
                          </p>
                        </div>
                        <Badge variant={milestone.type === "recurring" ? "secondary" : "default"}>
                          {milestone.type === "recurring" ? "Monthly" : "One-time"}
                        </Badge>
                      </div>
                      <Progress value={progress} showLabel size="md" variant="gradient" />
                      <div className="flex justify-between items-center mt-3 text-sm">
                        <span className="text-gray-400">
                          {formatSOL(milestone.currentAmountLamports)} / {formatSOL(milestone.goalAmountLamports)} SOL
                        </span>
                        <span className="text-gray-400">
                          {milestone.contributorCount} contributors
                        </span>
                      </div>
                      {milestone.deadline && (
                        <p className="text-xs text-gray-500 mt-2">
                          Deadline: {milestone.deadline.toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Tip */}
            <Card gradient>
              <CardContent className="p-6 text-center">
                <Shield className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Support Anonymously</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Your identity and tip amount are completely private
                </p>
                <TipButton creator={creator} className="w-full" size="lg" />
              </CardContent>
            </Card>

            {/* Supporter Perks */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Supporter Perks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {perks.map((perk) => (
                  <div
                    key={perk.id}
                    className="p-3 rounded-lg bg-gray-800/50 border border-gray-700"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-sm">{perk.title}</h4>
                      <Badge variant={perk.tierRequired as "bronze" | "silver" | "gold" | "platinum"}>
                        {perk.tierRequired}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-400">{perk.description}</p>
                    {perk.isLimited && perk.maxClaims && (
                      <p className="text-xs text-purple-400 mt-2">
                        {perk.maxClaims - perk.claimedCount} of {perk.maxClaims} remaining
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Proof Verification */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Have a Proof?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-400 mb-4">
                  If you have a ZK proof of support, you can verify it to access perks.
                </p>
                <Button variant="outline" className="w-full">
                  Verify Proof
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
