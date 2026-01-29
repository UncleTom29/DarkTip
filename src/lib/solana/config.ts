import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { clusterApiUrl, Connection } from "@solana/web3.js";

export const NETWORK = (process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet") as WalletAdapterNetwork;

export const RPC_ENDPOINT =
  process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT ||
  (NETWORK === WalletAdapterNetwork.Mainnet
    ? "https://api.mainnet-beta.solana.com"
    : clusterApiUrl(NETWORK));

export function getConnection(): Connection {
  return new Connection(RPC_ENDPOINT, {
    commitment: "confirmed",
    confirmTransactionInitialTimeout: 60000,
  });
}

export const LAMPORTS_PER_SOL = 1_000_000_000;

export function lamportsToSol(lamports: number): number {
  return lamports / LAMPORTS_PER_SOL;
}

export function solToLamports(sol: number): number {
  return Math.round(sol * LAMPORTS_PER_SOL);
}
