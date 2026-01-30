// Wallet hooks
export { useWalletBalance } from "./useWalletBalance";
export { useSolanaTransaction } from "./useSolanaTransaction";
export { usePrivyWallet, type UsePrivyWalletReturn } from "./usePrivyWallet";

// Privacy hooks
export {
  usePrivacyCash,
  type UsePrivacyCashReturn,
} from "./usePrivacyCash";

// Arcium hooks
export { useArcium, type UseArciumReturn } from "./useArcium";

// ShadowPay hooks
export {
  useShadowPay,
  type UseShadowPayConfig,
  type UseShadowPayReturn,
} from "./useShadowPay";

// ShadowWire hooks (ZK shielded pools)
export {
  useShadowWire,
  type UseShadowWireConfig,
  type UseShadowWireReturn,
} from "./useShadowWire";

// Subscriptions hooks
export {
  useSubscriptions,
  type UseSubscriptionsConfig,
  type UseSubscriptionsReturn,
} from "./useSubscriptions";

// Escrow hooks
export {
  useEscrow,
  type UseEscrowConfig,
  type UseEscrowReturn,
  type EscrowStats,
} from "./useEscrow";
