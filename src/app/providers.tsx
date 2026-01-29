"use client";

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PrivyWalletProvider } from "@/components/wallet/PrivyProvider";
import { WalletProvider as SolanaWalletProvider } from "@/components/wallet/WalletProvider";

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60, // 1 minute
        refetchOnWindowFocus: false,
      },
    },
  });

// Check if Privy is configured
const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
const USE_PRIVY = !!PRIVY_APP_ID;

export function Providers({ children }: { children: React.ReactNode }) {
  // Use useState to ensure QueryClient is only created once
  const [queryClient] = useState(createQueryClient);

  const WalletProviderComponent = USE_PRIVY
    ? PrivyWalletProvider
    : SolanaWalletProvider;

  return (
    <QueryClientProvider client={queryClient}>
      <WalletProviderComponent>{children}</WalletProviderComponent>
    </QueryClientProvider>
  );
}

export default Providers;
