"use client";

import React from "react";
import { motion } from "framer-motion";
import { Search, Filter, Users, TrendingUp, Sparkles } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { TipModal } from "@/components/tip/TipModal";
import { TipButton } from "@/components/tip/TipButton";
import type { Creator, CreatorCategory } from "@/types";

// Mock creators data
const mockCreators: Creator[] = [
  {
    id: "1",
    walletAddress: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    username: "alice_dev",
    displayName: "Alice Developer",
    bio: "Building the future of decentralized applications. Open source advocate and privacy enthusiast.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alice",
    categories: ["developer", "educator"],
    isVerified: true,
    totalTipsReceived: 125000000000,
    supporterCount: 342,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date(),
    socials: { twitter: "alice_dev", github: "alicedev" },
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
  },
  {
    id: "2",
    walletAddress: "8yLXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsV",
    username: "bob_podcaster",
    displayName: "Bob's Tech Talks",
    bio: "Weekly podcast about Web3, privacy tech, and the future of the internet. Join 50k+ listeners!",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=bob",
    categories: ["podcaster", "educator"],
    isVerified: true,
    totalTipsReceived: 89000000000,
    supporterCount: 567,
    createdAt: new Date("2024-02-20"),
    updatedAt: new Date(),
    socials: { twitter: "bobpodcast", youtube: "bobtechtalk" },
    privacySettings: {
      showTotalTips: true,
      showSupporterCount: true,
      requireProofForPerks: true,
      allowAnonymousTips: true,
    },
    payoutSettings: {
      primaryWallet: "8yLXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsV",
      backupWallets: [],
      autoWithdrawEnabled: false,
      preferPrivateWithdraw: true,
    },
  },
  {
    id: "3",
    walletAddress: "9zMXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsW",
    username: "carol_artist",
    displayName: "Carol Creative",
    bio: "Digital artist creating NFTs and generative art. Privacy advocate. All proceeds fund open source tools.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=carol",
    categories: ["artist"],
    isVerified: false,
    totalTipsReceived: 45000000000,
    supporterCount: 128,
    createdAt: new Date("2024-03-10"),
    updatedAt: new Date(),
    socials: { twitter: "carolart", website: "https://carol.art" },
    privacySettings: {
      showTotalTips: true,
      showSupporterCount: true,
      requireProofForPerks: false,
      allowAnonymousTips: true,
    },
    payoutSettings: {
      primaryWallet: "9zMXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsW",
      backupWallets: [],
      autoWithdrawEnabled: false,
      preferPrivateWithdraw: true,
    },
  },
  {
    id: "4",
    walletAddress: "AxNXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsX",
    username: "dan_journalist",
    displayName: "Dan Investigates",
    bio: "Independent journalist covering privacy, surveillance, and digital rights. Support independent journalism.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=dan",
    categories: ["journalist", "writer"],
    isVerified: true,
    totalTipsReceived: 210000000000,
    supporterCount: 892,
    createdAt: new Date("2024-01-05"),
    updatedAt: new Date(),
    socials: { twitter: "daninvestigates" },
    privacySettings: {
      showTotalTips: false,
      showSupporterCount: true,
      requireProofForPerks: true,
      allowAnonymousTips: true,
    },
    payoutSettings: {
      primaryWallet: "AxNXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsX",
      backupWallets: [],
      autoWithdrawEnabled: false,
      preferPrivateWithdraw: true,
    },
  },
  {
    id: "5",
    walletAddress: "BxNXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsY",
    username: "eve_musician",
    displayName: "Eve Soundscapes",
    bio: "Electronic music producer. All my tracks are CC-BY. Tips help me stay independent and keep creating.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=eve",
    categories: ["musician"],
    isVerified: false,
    totalTipsReceived: 32000000000,
    supporterCount: 76,
    createdAt: new Date("2024-04-01"),
    updatedAt: new Date(),
    socials: { twitter: "evesounds", youtube: "evesoundscapes" },
    privacySettings: {
      showTotalTips: true,
      showSupporterCount: true,
      requireProofForPerks: false,
      allowAnonymousTips: true,
    },
    payoutSettings: {
      primaryWallet: "BxNXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsY",
      backupWallets: [],
      autoWithdrawEnabled: false,
      preferPrivateWithdraw: true,
    },
  },
  {
    id: "6",
    walletAddress: "CxNXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsZ",
    username: "frank_activist",
    displayName: "Frank for Freedom",
    bio: "Human rights activist. Your anonymous support helps protect vulnerable communities worldwide.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=frank",
    categories: ["activist"],
    isVerified: true,
    totalTipsReceived: 520000000000,
    supporterCount: 1245,
    createdAt: new Date("2023-12-01"),
    updatedAt: new Date(),
    socials: { twitter: "frankfreedom" },
    privacySettings: {
      showTotalTips: false,
      showSupporterCount: false,
      requireProofForPerks: true,
      allowAnonymousTips: true,
    },
    payoutSettings: {
      primaryWallet: "CxNXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsZ",
      backupWallets: [],
      autoWithdrawEnabled: false,
      preferPrivateWithdraw: true,
    },
  },
];

const categories: Array<{ value: CreatorCategory | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "podcaster", label: "Podcasters" },
  { value: "artist", label: "Artists" },
  { value: "developer", label: "Developers" },
  { value: "journalist", label: "Journalists" },
  { value: "musician", label: "Musicians" },
  { value: "educator", label: "Educators" },
  { value: "activist", label: "Activists" },
  { value: "writer", label: "Writers" },
];

function formatSOL(lamports: number): string {
  return (lamports / 1e9).toFixed(2);
}

export default function CreatorsPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<CreatorCategory | "all">("all");
  const [sortBy, setSortBy] = React.useState<"trending" | "supporters" | "newest">("trending");

  const filteredCreators = React.useMemo(() => {
    let filtered = [...mockCreators];

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.username.toLowerCase().includes(query) ||
          c.displayName.toLowerCase().includes(query) ||
          c.bio.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((c) => c.categories.includes(selectedCategory));
    }

    // Sort
    switch (sortBy) {
      case "trending":
        filtered.sort((a, b) => b.totalTipsReceived - a.totalTipsReceived);
        break;
      case "supporters":
        filtered.sort((a, b) => b.supporterCount - a.supporterCount);
        break;
      case "newest":
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    return filtered;
  }, [searchQuery, selectedCategory, sortBy]);

  return (
    <div className="min-h-screen bg-gray-950">
      <Header />
      <TipModal />

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          {/* Hero */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Discover <span className="gradient-text">Creators</span>
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Support your favorite creators anonymously. Browse by category or
              search for specific creators.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search creators..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<Search className="h-4 w-4" />}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={sortBy === "trending" ? "default" : "secondary"}
                  onClick={() => setSortBy("trending")}
                  leftIcon={<TrendingUp className="h-4 w-4" />}
                >
                  Trending
                </Button>
                <Button
                  variant={sortBy === "supporters" ? "default" : "secondary"}
                  onClick={() => setSortBy("supporters")}
                  leftIcon={<Users className="h-4 w-4" />}
                >
                  Most Supported
                </Button>
                <Button
                  variant={sortBy === "newest" ? "default" : "secondary"}
                  onClick={() => setSortBy("newest")}
                  leftIcon={<Sparkles className="h-4 w-4" />}
                >
                  Newest
                </Button>
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-2 mt-4">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === cat.value
                      ? "bg-purple-600 text-white"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Creators Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredCreators.map((creator) => (
              <motion.div
                key={creator.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4 }}
              >
                <Card className="h-full hover:border-purple-500/50 transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <Avatar
                        src={creator.avatar}
                        alt={creator.displayName}
                        size="lg"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate">
                            {creator.displayName}
                          </h3>
                          {creator.isVerified && (
                            <Badge variant="default" className="shrink-0">
                              Verified
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-400">@{creator.username}</p>
                      </div>
                    </div>

                    <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                      {creator.bio}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {creator.categories.map((cat) => (
                        <Badge key={cat} variant="secondary">
                          {cat}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                      <div className="flex gap-4 text-sm">
                        {creator.privacySettings.showSupporterCount && (
                          <div>
                            <span className="text-gray-400">Supporters:</span>{" "}
                            <span className="font-medium">{creator.supporterCount}</span>
                          </div>
                        )}
                        {creator.privacySettings.showTotalTips && (
                          <div>
                            <span className="text-gray-400">Tips:</span>{" "}
                            <span className="font-medium">
                              {formatSOL(creator.totalTipsReceived)} SOL
                            </span>
                          </div>
                        )}
                      </div>
                      <TipButton creator={creator} size="sm" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {filteredCreators.length === 0 && (
            <div className="text-center py-20">
              <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No creators found</h3>
              <p className="text-gray-400">
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
