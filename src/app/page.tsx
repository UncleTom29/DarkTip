"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Shield,
  Eye,
  Zap,
  Users,
  Lock,
  Twitter,
  Youtube,
  Award,
  TrendingUp,
  ArrowRight,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WalletButton } from "@/components/wallet/WalletButton";

const features = [
  {
    icon: Shield,
    title: "Anonymous Tipping",
    description:
      "Send tips without revealing your wallet address or identity. Complete privacy for supporters.",
  },
  {
    icon: Eye,
    title: "ZK Proof of Support",
    description:
      "Prove you support a creator without revealing how much. Unlock perks while maintaining privacy.",
  },
  {
    icon: Lock,
    title: "Encrypted Messages",
    description:
      "Send private messages with your tips. Only the creator can read them.",
  },
  {
    icon: Zap,
    title: "Instant Transactions",
    description:
      "Tips arrive in seconds on Solana. Low fees and fast confirmations.",
  },
  {
    icon: Twitter,
    title: "Social Integration",
    description:
      "Tip creators directly from Twitter replies and YouTube comments.",
  },
  {
    icon: Award,
    title: "Supporter Badges",
    description:
      "Earn badges for supporting creators. Display them on your profile.",
  },
];

const stats = [
  { value: "$0", label: "Platform Fee (Beta)", suffix: "" },
  { value: "2.5", label: "Platform Fee (Launch)", suffix: "%" },
  { value: "<5", label: "Transaction Time", suffix: "s" },
  { value: "100", label: "Privacy Guarantee", suffix: "%" },
];

const howItWorks = [
  {
    step: "01",
    title: "Connect Wallet",
    description:
      "Connect your Solana wallet (Phantom, Backpack, or Solflare).",
  },
  {
    step: "02",
    title: "Find a Creator",
    description:
      "Browse creators or tip directly from Twitter/YouTube.",
  },
  {
    step: "03",
    title: "Send Anonymous Tip",
    description:
      "Choose amount and privacy level. Send instantly.",
  },
  {
    step: "04",
    title: "Generate ZK Proof",
    description:
      "Prove your support without revealing details. Unlock perks.",
  },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-950">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-transparent to-transparent" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-4xl mx-auto text-center"
          >
            <motion.div variants={fadeInUp}>
              <Badge variant="default" className="mb-6">
                <Sparkles className="h-3 w-3 mr-1" />
                Privacy-First Creator Economy
              </Badge>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
            >
              Support Creators
              <br />
              <span className="gradient-text">Completely Anonymous</span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto"
            >
              The first privacy-preserving tipping platform. Send anonymous tips,
              prove support with Zero-Knowledge proofs, and unlock exclusive
              perks—all on Solana.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <WalletButton />
              <Link href="/creators">
                <Button variant="outline" size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Browse Creators
                </Button>
              </Link>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              className="mt-12 flex flex-wrap justify-center gap-8"
            >
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl font-bold text-white">
                    {stat.value}
                    <span className="text-purple-400">{stat.suffix}</span>
                  </div>
                  <div className="text-sm text-gray-500">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold mb-4">
              Privacy-First Features
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-gray-400 max-w-2xl mx-auto">
              Built from the ground up with privacy as the foundation. No
              compromises.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <motion.div key={feature.title} variants={fadeInUp}>
                  <Card className="h-full hover:border-purple-500/50 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/20 mb-4">
                        <Icon className="h-6 w-6 text-purple-400" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                      <p className="text-gray-400 text-sm">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-900/50">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold mb-4">
              How It Works
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-gray-400 max-w-2xl mx-auto">
              Support your favorite creators in just a few steps while
              maintaining complete privacy.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {howItWorks.map((item, index) => (
              <motion.div
                key={item.step}
                variants={fadeInUp}
                className="relative"
              >
                <div className="text-6xl font-bold text-purple-500/20 mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.description}</p>
                {index < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-8 right-0 w-full h-px bg-gradient-to-r from-purple-500/50 to-transparent translate-x-1/2" />
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Social Integration Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Badge variant="default" className="mb-4">
                Social Integration
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Tip Directly from
                <br />
                <span className="gradient-text">Twitter & YouTube</span>
              </h2>
              <p className="text-gray-400 mb-8">
                No need to leave your favorite platform. Reply to a tweet with
                &quot;@darktip tip 5&quot; or comment &quot;!darktip 10&quot; on a YouTube video to
                send anonymous tips instantly.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <div className="font-medium">Twitter Integration</div>
                    <div className="text-sm text-gray-400">
                      Reply &quot;@darktip tip @creator 5&quot; to any tweet
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <div className="font-medium">YouTube Comments</div>
                    <div className="text-sm text-gray-400">
                      Comment &quot;!darktip 10&quot; on any video
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <div className="font-medium">Browser Extension</div>
                    <div className="text-sm text-gray-400">
                      One-click tip button on any creator profile
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <Card className="p-6 bg-gray-900/80">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                    <Twitter className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium">@darktip</div>
                    <div className="text-xs text-gray-500">Replying to @creator</div>
                  </div>
                </div>
                <p className="text-gray-300 mb-4">
                  Tip sent successfully! @supporter has anonymously supported
                  @creator.
                </p>
                <div className="flex items-center gap-4 text-gray-500 text-sm">
                  <span>11:42 AM · Jan 29, 2025</span>
                </div>
              </Card>

              <Card className="p-6 bg-gray-900/80 mt-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-red-500 flex items-center justify-center">
                    <Youtube className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium">DarkTip Bot</div>
                    <div className="text-xs text-gray-500">2 minutes ago</div>
                  </div>
                </div>
                <p className="text-gray-300">
                  Anonymous tip received! Click the link to complete your
                  privacy-preserving donation.
                </p>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ZK Proofs Section */}
      <section className="py-20 bg-gray-900/50">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-2 lg:order-1"
            >
              <Card className="p-6 bg-gray-900/80">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold">ZK Proof of Support</div>
                    <div className="text-sm text-gray-400">Verified on Solana</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                    <span className="text-gray-400">Proof Type</span>
                    <span className="font-medium">Tier Support</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                    <span className="text-gray-400">Creator</span>
                    <span className="font-medium">@creator</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                    <span className="text-gray-400">Tier</span>
                    <Badge variant="gold">Gold Supporter</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                    <span className="text-gray-400">Amount</span>
                    <span className="font-medium text-gray-500">Hidden</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                    <span className="text-gray-400">Wallet</span>
                    <span className="font-medium text-gray-500">Hidden</span>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Proof Verified</span>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-1 lg:order-2"
            >
              <Badge variant="default" className="mb-4">
                Zero-Knowledge Proofs
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Prove Support
                <br />
                <span className="gradient-text">Without Revealing Anything</span>
              </h2>
              <p className="text-gray-400 mb-8">
                Generate cryptographic proofs that verify your support without
                revealing your wallet address, tip amounts, or timing. Unlock
                exclusive perks while maintaining complete privacy.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Lock className="h-5 w-5 text-purple-400 mt-0.5" />
                  <div>
                    <div className="font-medium">Binary Proof</div>
                    <div className="text-sm text-gray-400">
                      Prove you tipped without revealing amount
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-purple-400 mt-0.5" />
                  <div>
                    <div className="font-medium">Tier Proof</div>
                    <div className="text-sm text-gray-400">
                      Prove your support tier (Bronze/Silver/Gold/Platinum)
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-purple-400 mt-0.5" />
                  <div>
                    <div className="font-medium">Aggregate Proof</div>
                    <div className="text-sm text-gray-400">
                      Prove total support across all creators
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Ready to Support Creators
              <br />
              <span className="gradient-text">Anonymously?</span>
            </h2>
            <p className="text-xl text-gray-400 mb-8">
              Join the privacy-first creator economy. Connect your wallet and
              start supporting your favorite creators today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <WalletButton />
              <Link href="/creators">
                <Button variant="outline" size="lg">
                  Browse Creators
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
