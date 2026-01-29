"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, Zap, Shield, Clock, MessageSquare, Check, Loader2 } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useTipStore } from "@/store";
import { cn } from "@/lib/utils";
import type { PrivacyLevel } from "@/types";
import { QUICK_TIP_AMOUNTS, PRIVACY_LEVELS, MAX_MESSAGE_LENGTH, PLATFORM_FEE_PERCENTAGE } from "@/config/constants";

const privacyOptions: Array<{
  level: PrivacyLevel;
  label: string;
  icon: typeof Zap;
  description: string;
  time: string;
}> = [
  {
    level: "low",
    label: "Fast",
    icon: Zap,
    description: "1 hop, instant",
    time: "~5s",
  },
  {
    level: "medium",
    label: "Standard",
    icon: Shield,
    description: "3 hops, basic mixing",
    time: "~30s",
  },
  {
    level: "high",
    label: "Private",
    icon: Lock,
    description: "5 hops, full mixing",
    time: "~3 min",
  },
  {
    level: "maximum",
    label: "Maximum",
    icon: Shield,
    description: "All protections",
    time: "~10 min",
  },
];

export function TipModal() {
  const { connected } = useWallet();
  const {
    isOpen,
    creator,
    amount,
    customAmount,
    message,
    privacyLevel,
    status,
    isProcessing,
    error,
    closeTipModal,
    setAmount,
    setCustomAmount,
    setMessage,
    setPrivacyLevel,
    setProcessing,
    setStatus,
    setError,
  } = useTipStore();

  const [step, setStep] = React.useState<"amount" | "privacy" | "confirm" | "processing" | "success">("amount");

  // Reset step when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setStep("amount");
      setStatus(null);
      setError(null);
    }
  }, [isOpen, setStatus, setError]);

  if (!isOpen || !creator) return null;

  const privacyConfig = PRIVACY_LEVELS[privacyLevel];
  const platformFee = amount * (PLATFORM_FEE_PERCENTAGE / 100);
  const privacyFee = privacyConfig.additionalFee;
  const totalAmount = amount + platformFee + privacyFee;

  const handleSendTip = async () => {
    if (!connected) {
      setError("Please connect your wallet first");
      return;
    }

    setStep("processing");
    setProcessing(true);

    try {
      // Simulate tip processing
      await new Promise((resolve) => setTimeout(resolve, 3000));
      setStep("success");
      setStatus("completed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send tip");
      setStep("confirm");
    } finally {
      setProcessing(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case "amount":
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <Avatar src={creator.avatar} alt={creator.displayName} size="xl" className="mx-auto mb-3" />
              <h3 className="text-lg font-semibold">{creator.displayName}</h3>
              <p className="text-sm text-gray-400">@{creator.username}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Choose amount (SOL)
              </label>
              <div className="grid grid-cols-5 gap-2">
                {QUICK_TIP_AMOUNTS.map((quickAmount) => (
                  <button
                    key={quickAmount}
                    onClick={() => setAmount(quickAmount)}
                    className={cn(
                      "py-3 px-2 rounded-lg text-sm font-medium transition-all",
                      amount === quickAmount && !customAmount
                        ? "bg-purple-600 text-white"
                        : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    )}
                  >
                    {quickAmount}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Custom amount
              </label>
              <Input
                type="number"
                placeholder="Enter custom amount"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                leftIcon={<span className="text-gray-400">SOL</span>}
              />
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={() => setStep("privacy")}
              disabled={amount <= 0}
            >
              Continue
            </Button>
          </motion.div>
        );

      case "privacy":
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h3 className="text-lg font-semibold mb-2">Choose Privacy Level</h3>
              <p className="text-sm text-gray-400">
                Higher privacy takes longer but provides better anonymity
              </p>
            </div>

            <div className="space-y-3">
              {privacyOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = privacyLevel === option.level;
                const config = PRIVACY_LEVELS[option.level];

                return (
                  <button
                    key={option.level}
                    onClick={() => setPrivacyLevel(option.level)}
                    className={cn(
                      "w-full p-4 rounded-xl border transition-all text-left",
                      isSelected
                        ? "border-purple-500 bg-purple-500/10"
                        : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "p-2 rounded-lg",
                            isSelected ? "bg-purple-500/20" : "bg-gray-700"
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-sm text-gray-400">
                            {option.description}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-400">{option.time}</div>
                        {config.additionalFee > 0 && (
                          <div className="text-xs text-purple-400">
                            +{config.additionalFee} SOL
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <MessageSquare className="h-4 w-4 inline mr-2" />
                Message (optional, encrypted)
              </label>
              <Textarea
                placeholder="Write a private message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={MAX_MESSAGE_LENGTH}
                showCount
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep("amount")}>
                Back
              </Button>
              <Button className="flex-1" onClick={() => setStep("confirm")}>
                Continue
              </Button>
            </div>
          </motion.div>
        );

      case "confirm":
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-purple-500/20 mx-auto mb-4 flex items-center justify-center">
                <Shield className="h-8 w-8 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold mb-1">Confirm Anonymous Tip</h3>
              <p className="text-sm text-gray-400">
                Review your tip details before sending
              </p>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Recipient</span>
                <span className="font-medium">@{creator.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Tip Amount</span>
                <span className="font-medium">{amount} SOL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Platform Fee ({PLATFORM_FEE_PERCENTAGE}%)</span>
                <span className="text-sm">{platformFee.toFixed(4)} SOL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Privacy Fee</span>
                <span className="text-sm">{privacyFee} SOL</span>
              </div>
              <div className="border-t border-gray-700 pt-3 flex justify-between">
                <span className="font-medium">Total</span>
                <span className="font-bold text-purple-400">{totalAmount.toFixed(4)} SOL</span>
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="h-4 w-4 text-purple-400" />
                <span className="font-medium">Privacy Level: {privacyOptions.find(o => o.level === privacyLevel)?.label}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Clock className="h-4 w-4" />
                <span>Estimated time: {privacyOptions.find(o => o.level === privacyLevel)?.time}</span>
              </div>
            </div>

            {message && (
              <div className="bg-gray-800/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-purple-400" />
                  <span className="font-medium">Encrypted Message</span>
                </div>
                <p className="text-sm text-gray-400 line-clamp-2">{message}</p>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep("privacy")}>
                Back
              </Button>
              <Button
                className="flex-1"
                onClick={handleSendTip}
                disabled={!connected || isProcessing}
              >
                {connected ? "Send Tip" : "Connect Wallet"}
              </Button>
            </div>
          </motion.div>
        );

      case "processing":
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <div className="h-20 w-20 rounded-full bg-purple-500/20 mx-auto mb-6 flex items-center justify-center animate-pulse-glow">
              <Loader2 className="h-10 w-10 text-purple-400 animate-spin" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Processing Your Tip</h3>
            <p className="text-gray-400 mb-6">
              Routing through privacy layers...
            </p>
            <Progress value={33} variant="gradient" className="max-w-xs mx-auto" />
            <p className="text-sm text-gray-500 mt-4">
              This may take a few moments depending on privacy level
            </p>
          </motion.div>
        );

      case "success":
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <div className="h-20 w-20 rounded-full bg-green-500/20 mx-auto mb-6 flex items-center justify-center">
              <Check className="h-10 w-10 text-green-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Tip Sent Successfully!</h3>
            <p className="text-gray-400 mb-6">
              Your anonymous tip has been sent to @{creator.username}
            </p>
            <Badge variant="success" className="mb-6">
              {amount} SOL sent anonymously
            </Badge>
            <div className="space-y-3">
              <Button className="w-full" onClick={closeTipModal}>
                Done
              </Button>
              <Button variant="outline" className="w-full">
                Generate ZK Proof
              </Button>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
            onClick={closeTipModal}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="relative w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-gray-800 p-4">
                <h2 className="text-lg font-semibold">Send Anonymous Tip</h2>
                <button
                  onClick={closeTipModal}
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6">
                <AnimatePresence mode="wait">
                  {renderStepContent()}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
