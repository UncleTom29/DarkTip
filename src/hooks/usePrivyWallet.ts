"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useCallback, useMemo, useState, useEffect } from "react";
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";

const RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || "https://api.devnet.solana.com";

export interface WalletState {
  isConnected: boolean;
  isReady: boolean;
  address: string | null;
  publicKey: PublicKey | null;
  balance: number | null;
}

export interface UsePrivyWalletReturn extends WalletState {
  login: () => void;
  logout: () => Promise<void>;
  connectWallet: () => void;
  sendTransaction: (to: string, amount: number) => Promise<string>;
  signMessage: (message: string) => Promise<Uint8Array>;
  refreshBalance: () => Promise<number | null>;
  user: ReturnType<typeof usePrivy>["user"];
  wallets: ReturnType<typeof useWallets>["wallets"];
}

export function usePrivyWallet(): UsePrivyWalletReturn {
  const { ready, authenticated, user, login, logout: privyLogout } = usePrivy();
  const { wallets } = useWallets();
  const [balance, setBalance] = useState<number | null>(null);

  // Get the primary wallet (prefer embedded Privy wallet)
  const primaryWallet = useMemo(() => {
    // Prefer Privy embedded wallet, then any other wallet
    const privyWallet = wallets.find((w) => w.walletClientType === "privy");
    if (privyWallet) return privyWallet;
    return wallets[0] || null;
  }, [wallets]);

  const address = primaryWallet?.address || null;

  // Only create PublicKey for valid Solana addresses (base58, 32-44 chars)
  const publicKey = useMemo(() => {
    if (!address) return null;
    try {
      // Validate it looks like a Solana address
      if (address.length >= 32 && address.length <= 44 && !address.startsWith("0x")) {
        return new PublicKey(address);
      }
      return null;
    } catch {
      return null;
    }
  }, [address]);

  // Login handler
  const handleLogin = useCallback(() => {
    login();
  }, [login]);

  // Logout handler
  const handleLogout = useCallback(async () => {
    await privyLogout();
    setBalance(null);
  }, [privyLogout]);

  // Connect wallet (same as login for Privy)
  const connectWallet = useCallback(() => {
    if (!authenticated) {
      login();
    }
  }, [authenticated, login]);

  // Refresh balance
  const refreshBalance = useCallback(async (): Promise<number | null> => {
    if (!publicKey) return null;

    try {
      const connection = new Connection(RPC_ENDPOINT, "confirmed");
      const balanceLamports = await connection.getBalance(publicKey);
      const balanceSOL = balanceLamports / LAMPORTS_PER_SOL;
      setBalance(balanceSOL);
      return balanceSOL;
    } catch (error) {
      console.error("Failed to fetch balance:", error);
      return null;
    }
  }, [publicKey]);

  // Auto-refresh balance when wallet changes
  useEffect(() => {
    if (publicKey) {
      refreshBalance();
    }
  }, [publicKey, refreshBalance]);

  // Send SOL transaction
  const sendTransaction = useCallback(
    async (to: string, amount: number): Promise<string> => {
      if (!primaryWallet || !publicKey) {
        throw new Error("Wallet not connected");
      }

      const connection = new Connection(RPC_ENDPOINT, "confirmed");
      const toPubkey = new PublicKey(to);

      // Create transfer instruction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey,
          lamports: Math.floor(amount * LAMPORTS_PER_SOL),
        })
      );

      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // Sign transaction - Privy wallet has signTransaction method
      if ("signTransaction" in primaryWallet && typeof primaryWallet.signTransaction === "function") {
        const signedTx = await (primaryWallet as any).signTransaction(transaction);
        const signature = await connection.sendRawTransaction(signedTx.serialize());
        await connection.confirmTransaction(signature, "confirmed");
        return signature;
      }

      throw new Error("Wallet does not support transaction signing");
    },
    [primaryWallet, publicKey]
  );

  // Sign message
  const signMessage = useCallback(
    async (message: string): Promise<Uint8Array> => {
      if (!primaryWallet) {
        throw new Error("Wallet not connected");
      }

      const encodedMessage = new TextEncoder().encode(message);

      if ("signMessage" in primaryWallet && typeof primaryWallet.signMessage === "function") {
        const signature = await (primaryWallet as any).signMessage(encodedMessage);
        return signature;
      }

      throw new Error("Wallet does not support message signing");
    },
    [primaryWallet]
  );

  return {
    isConnected: authenticated && !!publicKey,
    isReady: ready,
    address,
    publicKey,
    balance,
    login: handleLogin,
    logout: handleLogout,
    connectWallet,
    sendTransaction,
    signMessage,
    refreshBalance,
    user,
    wallets,
  };
}

export default usePrivyWallet;
