"use client";

import React from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  Wallet,
  Target,
  Award,
  Settings,
  Bell,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { WalletButton } from "@/components/wallet/WalletButton";

const stats = [
  {
    label: "Total Tips",
    value: "125.5 SOL",
    change: "+12.5%",
    trend: "up",
    icon: TrendingUp,
  },
  {
    label: "Supporters",
    value: "342",
    change: "+8",
    trend: "up",
    icon: Users,
  },
  {
    label: "This Month",
    value: "23.2 SOL",
    change: "-5.2%",
    trend: "down",
    icon: Wallet,
  },
  {
    label: "Active Milestones",
    value: "2",
    change: "",
    trend: "neutral",
    icon: Target,
  },
];

const recentActivity = [
  {
    type: "tip",
    message: "Anonymous supporter sent a tip",
    amount: "5 SOL",
    time: "2 hours ago",
  },
  {
    type: "milestone",
    message: "Milestone reached 65% funding",
    amount: "32.5 SOL",
    time: "5 hours ago",
  },
  {
    type: "tip",
    message: "Anonymous supporter sent a tip",
    amount: "1 SOL",
    time: "1 day ago",
  },
  {
    type: "supporter",
    message: "New Gold tier supporter",
    amount: "",
    time: "2 days ago",
  },
];

const sidebarLinks = [
  { icon: LayoutDashboard, label: "Overview", href: "/dashboard", active: true },
  { icon: TrendingUp, label: "Tips", href: "/dashboard/tips" },
  { icon: Users, label: "Supporters", href: "/dashboard/supporters" },
  { icon: Target, label: "Milestones", href: "/dashboard/milestones" },
  { icon: Award, label: "Perks", href: "/dashboard/perks" },
  { icon: Bell, label: "Notifications", href: "/dashboard/notifications" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export default function DashboardPage() {
  const { connected, publicKey } = useWallet();

  if (!connected) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Header />
        <div className="flex items-center justify-center min-h-[80vh]">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="p-8 text-center">
              <div className="h-16 w-16 rounded-full bg-purple-500/20 mx-auto mb-6 flex items-center justify-center">
                <Wallet className="h-8 w-8 text-purple-400" />
              </div>
              <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
              <p className="text-gray-400 mb-6">
                Connect your wallet to access your creator dashboard and manage
                your tips, supporters, and milestones.
              </p>
              <WalletButton />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Header />

      <div className="flex pt-16">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 border-r border-gray-800 min-h-screen p-4 fixed left-0 top-16 bottom-0">
          <nav className="space-y-1">
            {sidebarLinks.map((link) => {
              const Icon = link.icon;
              return (
                <a
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    link.active
                      ? "bg-purple-500/20 text-white"
                      : "text-gray-400 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {link.label}
                </a>
              );
            })}
          </nav>

          <div className="mt-auto">
            <Card className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 border-purple-500/30">
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">Withdraw Funds</h4>
                <p className="text-sm text-gray-400 mb-3">
                  125.5 SOL available
                </p>
                <Button className="w-full" size="sm">
                  Withdraw
                </Button>
              </CardContent>
            </Card>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 p-6">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold">Creator Dashboard</h1>
                <p className="text-gray-400">
                  Welcome back! Here&apos;s an overview of your account.
                </p>
              </div>
              <Button leftIcon={<Plus className="h-4 w-4" />}>
                Create Milestone
              </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-2 rounded-lg bg-purple-500/20">
                            <Icon className="h-5 w-5 text-purple-400" />
                          </div>
                          {stat.change && (
                            <div
                              className={`flex items-center gap-1 text-sm ${
                                stat.trend === "up"
                                  ? "text-green-400"
                                  : stat.trend === "down"
                                  ? "text-red-400"
                                  : "text-gray-400"
                              }`}
                            >
                              {stat.trend === "up" ? (
                                <ArrowUpRight className="h-4 w-4" />
                              ) : stat.trend === "down" ? (
                                <ArrowDownRight className="h-4 w-4" />
                              ) : null}
                              {stat.change}
                            </div>
                          )}
                        </div>
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <div className="text-sm text-gray-400">{stat.label}</div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.map((activity, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
                      >
                        <div>
                          <p className="text-sm font-medium">{activity.message}</p>
                          <p className="text-xs text-gray-500">{activity.time}</p>
                        </div>
                        {activity.amount && (
                          <Badge variant="default">{activity.amount}</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Active Milestones */}
              <Card>
                <CardHeader>
                  <CardTitle>Active Milestones</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Open Source ZK Toolkit</h4>
                      <Badge variant="default">65%</Badge>
                    </div>
                    <Progress value={65} variant="gradient" size="sm" />
                    <div className="flex justify-between mt-2 text-sm text-gray-400">
                      <span>32.5 / 50 SOL</span>
                      <span>45 contributors</span>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Monthly Tutorials</h4>
                      <Badge variant="secondary">85%</Badge>
                    </div>
                    <Progress value={85} variant="default" size="sm" />
                    <div className="flex justify-between mt-2 text-sm text-gray-400">
                      <span>8.5 / 10 SOL</span>
                      <span>28 contributors</span>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full">
                    View All Milestones
                  </Button>
                </CardContent>
              </Card>

              {/* Supporter Tiers */}
              <Card>
                <CardHeader>
                  <CardTitle>Supporter Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-amber-700" />
                        <span>Bronze</span>
                      </div>
                      <span className="font-medium">156 (46%)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-gray-400" />
                        <span>Silver</span>
                      </div>
                      <span className="font-medium">89 (26%)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                        <span>Gold</span>
                      </div>
                      <span className="font-medium">72 (21%)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-purple-300" />
                        <span>Platinum</span>
                      </div>
                      <span className="font-medium">25 (7%)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Target className="h-4 w-4 mr-3" />
                    Create New Milestone
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Award className="h-4 w-4 mr-3" />
                    Add Supporter Perk
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Bell className="h-4 w-4 mr-3" />
                    Send Announcement
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="h-4 w-4 mr-3" />
                    Edit Profile
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
