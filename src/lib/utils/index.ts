export { cn } from "./cn";

export function formatSOL(lamports: number): string {
  return (lamports / 1e9).toFixed(4);
}

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function parseSOLAmount(input: string): number | null {
  const parsed = parseFloat(input);
  if (isNaN(parsed) || parsed <= 0) return null;
  return parsed;
}

export function calculateFee(amount: number, feePercentage: number): number {
  return amount * (feePercentage / 100);
}

export function getPrivacyLevelLabel(level: "low" | "medium" | "high" | "maximum"): string {
  const labels = {
    low: "Fast",
    medium: "Standard",
    high: "Private",
    maximum: "Maximum Privacy",
  };
  return labels[level];
}

export function getPrivacyLevelDescription(level: "low" | "medium" | "high" | "maximum"): string {
  const descriptions = {
    low: "1 hop, no mixing, instant (~5s)",
    medium: "3 hops, basic mixing (~30s)",
    high: "5 hops, full mixing (~2-5 min)",
    maximum: "All protections + Tor routing (~5-10 min)",
  };
  return descriptions[level];
}

export function getTierFromAmount(amountSOL: number): "bronze" | "silver" | "gold" | "platinum" {
  if (amountSOL >= 100) return "platinum";
  if (amountSOL >= 50) return "gold";
  if (amountSOL >= 10) return "silver";
  return "bronze";
}

export function getTierLabel(tier: "bronze" | "silver" | "gold" | "platinum"): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

export function getTierColor(tier: "bronze" | "silver" | "gold" | "platinum"): string {
  const colors = {
    bronze: "#CD7F32",
    silver: "#C0C0C0",
    gold: "#FFD700",
    platinum: "#E5E4E2",
  };
  return colors[tier];
}
