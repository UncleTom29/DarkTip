"use client";

import React, { useState, useCallback } from "react";
import { Wallet, LogOut, Copy, Check, User, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { shortenAddress } from "@/lib/utils";

// Try to import Privy hooks - they may not be available if not configured
let usePrivy: any = null;
let useSolanaWallets: any = null;

try {
  const privyModule = require("@privy-io/react-auth");
  usePrivy = privyModule.usePrivy;
  useSolanaWallets = privyModule.useSolanaWallets;
} catch {
  // Privy not available
}

interface UniversalWalletButtonProps {
  className?: string;
  showBalance?: boolean;
}

export function UniversalWalletButton({
  className,
  showBalance = false,
}: UniversalWalletButtonProps) {
  const [copied, setCopied] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Try to use Privy if available
  const privyState = usePrivy?.();
  const solanaWalletsState = useSolanaWallets?.();

  const isPrivyAvailable = !!privyState;
  const isAuthenticated = privyState?.authenticated ?? false;
  const isReady = privyState?.ready ?? true;
  const user = privyState?.user;
  const login = privyState?.login;
  const logout = privyState?.logout;

  // Get primary Solana wallet from Privy
  const primaryWallet = solanaWalletsState?.wallets?.[0];
  const walletAddress = primaryWallet?.address;

  const handleConnect = useCallback(() => {
    if (isPrivyAvailable && login) {
      login();
    }
  }, [isPrivyAvailable, login]);

  const handleDisconnect = useCallback(async () => {
    if (isPrivyAvailable && logout) {
      await logout();
    }
    setDropdownOpen(false);
  }, [isPrivyAvailable, logout]);

  const handleCopyAddress = useCallback(async () => {
    if (walletAddress) {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [walletAddress]);

  // Loading state
  if (!isReady) {
    return (
      <Button variant="secondary" size="sm" disabled className={className}>
        <div className="animate-pulse flex items-center gap-2">
          <div className="h-4 w-4 rounded-full bg-gray-600" />
          <div className="h-3 w-16 rounded bg-gray-600" />
        </div>
      </Button>
    );
  }

  // Connected state
  if (isAuthenticated && walletAddress) {
    return (
      <div className="relative">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className={className}
        >
          <div className="flex items-center gap-2">
            {user?.email ? (
              <User className="h-4 w-4" />
            ) : (
              <Wallet className="h-4 w-4" />
            )}
            <span>{shortenAddress(walletAddress)}</span>
            <ChevronDown
              className={`h-3 w-3 transition-transform ${
                dropdownOpen ? "rotate-180" : ""
              }`}
            />
          </div>
        </Button>

        {dropdownOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setDropdownOpen(false)}
            />

            {/* Dropdown */}
            <div className="absolute right-0 top-full mt-2 w-64 rounded-lg bg-gray-800 border border-gray-700 shadow-xl z-50">
              <div className="p-3 border-b border-gray-700">
                <p className="text-xs text-gray-400 mb-1">Connected Wallet</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-mono text-gray-200">
                    {shortenAddress(walletAddress, 8)}
                  </span>
                  <button
                    onClick={handleCopyAddress}
                    className="p-1 hover:bg-gray-700 rounded transition-colors"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {user?.email && (
                  <p className="text-xs text-gray-500 mt-1">{user.email.address}</p>
                )}
              </div>

              {showBalance && (
                <div className="p-3 border-b border-gray-700">
                  <p className="text-xs text-gray-400 mb-1">Balance</p>
                  <p className="text-lg font-semibold text-purple-400">
                    -- SOL
                  </p>
                </div>
              )}

              <div className="p-2">
                <button
                  onClick={handleDisconnect}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-gray-700 rounded transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Disconnect
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Not connected state
  return (
    <Button
      onClick={handleConnect}
      leftIcon={<Wallet className="h-4 w-4" />}
      className={className}
    >
      Connect Wallet
    </Button>
  );
}

export default UniversalWalletButton;
