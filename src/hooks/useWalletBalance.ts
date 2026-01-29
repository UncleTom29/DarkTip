"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";
import { lamportsToSol } from "@/lib/solana";

export function useWalletBalance() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();

  const { data: balance, isLoading, error, refetch } = useQuery({
    queryKey: ["wallet-balance", publicKey?.toBase58()],
    queryFn: async () => {
      if (!publicKey) return 0;
      const lamports = await connection.getBalance(publicKey);
      return lamportsToSol(lamports);
    },
    enabled: !!publicKey,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });

  return {
    balance: balance ?? 0,
    balanceFormatted: balance?.toFixed(4) ?? "0.0000",
    isLoading,
    error,
    refetch,
  };
}
