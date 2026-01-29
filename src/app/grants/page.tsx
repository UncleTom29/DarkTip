"use client";

import React from "react";
import { motion } from "framer-motion";
import { Search, Target, Clock, Users, TrendingUp, Filter } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

// Mock milestones data
const mockMilestones = [
  {
    id: "1",
    creator: {
      username: "alice_dev",
      displayName: "Alice Developer",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alice",
      isVerified: true,
    },
    title: "Open Source ZK Toolkit",
    description: "Build and release a comprehensive ZK proof toolkit for Solana developers. Includes documentation, examples, and testing utilities.",
    goalAmountLamports: 50000000000,
    currentAmountLamports: 32500000000,
    contributorCount: 45,
    deadline: new Date("2025-03-15"),
    status: "active",
    type: "one_time",
    category: "development",
  },
  {
    id: "2",
    creator: {
      username: "bob_podcaster",
      displayName: "Bob's Tech Talks",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=bob",
      isVerified: true,
    },
    title: "Privacy Tech Documentary Series",
    description: "A 6-part documentary series exploring privacy technology, its history, and future implications for society.",
    goalAmountLamports: 100000000000,
    currentAmountLamports: 78000000000,
    contributorCount: 89,
    deadline: new Date("2025-04-30"),
    status: "active",
    type: "one_time",
    category: "content",
  },
  {
    id: "3",
    creator: {
      username: "carol_artist",
      displayName: "Carol Creative",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=carol",
      isVerified: false,
    },
    title: "Monthly Digital Art Collection",
    description: "Create and release a new collection of generative art pieces every month, with all proceeds funding open source tools.",
    goalAmountLamports: 10000000000,
    currentAmountLamports: 8500000000,
    contributorCount: 34,
    status: "active",
    type: "recurring",
    category: "art",
  },
  {
    id: "4",
    creator: {
      username: "dan_journalist",
      displayName: "Dan Investigates",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=dan",
      isVerified: true,
    },
    title: "Surveillance State Investigation",
    description: "Fund an in-depth investigation into government surveillance programs. All findings will be published freely.",
    goalAmountLamports: 150000000000,
    currentAmountLamports: 45000000000,
    contributorCount: 156,
    deadline: new Date("2025-06-01"),
    status: "active",
    type: "one_time",
    category: "journalism",
  },
  {
    id: "5",
    creator: {
      username: "eve_musician",
      displayName: "Eve Soundscapes",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=eve",
      isVerified: false,
    },
    title: "CC-BY Album Production",
    description: "Produce and release a full-length electronic album under Creative Commons. High-quality stems included for remixing.",
    goalAmountLamports: 25000000000,
    currentAmountLamports: 25000000000,
    contributorCount: 67,
    status: "funded",
    type: "one_time",
    category: "music",
  },
];

const categories = [
  { value: "all", label: "All Categories" },
  { value: "development", label: "Development" },
  { value: "content", label: "Content" },
  { value: "art", label: "Art" },
  { value: "journalism", label: "Journalism" },
  { value: "music", label: "Music" },
];

function formatSOL(lamports: number): string {
  return (lamports / 1e9).toFixed(2);
}

function daysRemaining(deadline: Date): number {
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function GrantsPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("all");
  const [showFundedOnly, setShowFundedOnly] = React.useState(false);

  const filteredMilestones = React.useMemo(() => {
    let filtered = [...mockMilestones];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.title.toLowerCase().includes(query) ||
          m.description.toLowerCase().includes(query) ||
          m.creator.displayName.toLowerCase().includes(query)
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter((m) => m.category === selectedCategory);
    }

    if (showFundedOnly) {
      filtered = filtered.filter((m) => m.status === "funded");
    }

    return filtered;
  }, [searchQuery, selectedCategory, showFundedOnly]);

  return (
    <div className="min-h-screen bg-gray-950">
      <Header />

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          {/* Hero */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Fund <span className="gradient-text">Creator Projects</span>
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Support milestone-based projects with anonymous contributions.
              Funds are held in escrow until goals are reached.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<Search className="h-4 w-4" />}
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                <Button
                  variant={showFundedOnly ? "default" : "secondary"}
                  onClick={() => setShowFundedOnly(!showFundedOnly)}
                >
                  Funded Only
                </Button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 max-w-4xl mx-auto">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">
                  {mockMilestones.length}
                </div>
                <div className="text-sm text-gray-400">Active Projects</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">
                  {formatSOL(
                    mockMilestones.reduce((sum, m) => sum + m.currentAmountLamports, 0)
                  )}{" "}
                  SOL
                </div>
                <div className="text-sm text-gray-400">Total Raised</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">
                  {mockMilestones.reduce((sum, m) => sum + m.contributorCount, 0)}
                </div>
                <div className="text-sm text-gray-400">Contributors</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">
                  {mockMilestones.filter((m) => m.status === "funded").length}
                </div>
                <div className="text-sm text-gray-400">Projects Funded</div>
              </CardContent>
            </Card>
          </div>

          {/* Milestones Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid md:grid-cols-2 gap-6"
          >
            {filteredMilestones.map((milestone) => {
              const progress =
                (milestone.currentAmountLamports / milestone.goalAmountLamports) * 100;
              const days = milestone.deadline
                ? daysRemaining(milestone.deadline)
                : null;

              return (
                <motion.div
                  key={milestone.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4 }}
                >
                  <Card className="h-full hover:border-purple-500/50 transition-all">
                    <CardContent className="p-6">
                      {/* Creator */}
                      <div className="flex items-center gap-3 mb-4">
                        <Avatar
                          src={milestone.creator.avatar}
                          alt={milestone.creator.displayName}
                          size="sm"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {milestone.creator.displayName}
                            </span>
                            {milestone.creator.isVerified && (
                              <Badge variant="default" className="text-xs px-1.5">
                                Verified
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            @{milestone.creator.username}
                          </span>
                        </div>
                        <div className="ml-auto">
                          <Badge
                            variant={
                              milestone.status === "funded" ? "success" : "secondary"
                            }
                          >
                            {milestone.type === "recurring" ? "Monthly" : "One-time"}
                          </Badge>
                        </div>
                      </div>

                      {/* Content */}
                      <h3 className="text-lg font-semibold mb-2">
                        {milestone.title}
                      </h3>
                      <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                        {milestone.description}
                      </p>

                      {/* Progress */}
                      <div className="mb-4">
                        <Progress
                          value={progress}
                          variant={milestone.status === "funded" ? "success" : "gradient"}
                          size="md"
                        />
                        <div className="flex justify-between mt-2 text-sm">
                          <span className="text-gray-400">
                            {formatSOL(milestone.currentAmountLamports)} /{" "}
                            {formatSOL(milestone.goalAmountLamports)} SOL
                          </span>
                          <span className="font-medium text-purple-400">
                            {Math.round(progress)}%
                          </span>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                        <div className="flex gap-4 text-sm text-gray-400">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {milestone.contributorCount}
                          </div>
                          {days !== null && days > 0 && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {days} days left
                            </div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant={
                            milestone.status === "funded" ? "secondary" : "default"
                          }
                          disabled={milestone.status === "funded"}
                        >
                          {milestone.status === "funded" ? "Funded" : "Contribute"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>

          {filteredMilestones.length === 0 && (
            <div className="text-center py-20">
              <Target className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No projects found</h3>
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
