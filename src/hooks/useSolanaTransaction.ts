"use client";

import { useCallback, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  Transaction,
  TransactionInstruction,
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

interface TransactionResult {
  success: boolean;
  signature?: string;
  error?: string;
}

export function useSolanaTransaction() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, signTransaction } = useWallet();
  const [isProcessing, setIsProcessing] = useState(false);

  const sendSOL = useCallback(
    async (
      recipient: string,
      amountSOL: number
    ): Promise<TransactionResult> => {
      if (!publicKey || !sendTransaction) {
        return { success: false, error: "Wallet not connected" };
      }

      setIsProcessing(true);

      try {
        const recipientPubkey = new PublicKey(recipient);
        const lamports = Math.round(amountSOL * LAMPORTS_PER_SOL);

        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: recipientPubkey,
            lamports,
          })
        );

        // Get recent blockhash
        const { blockhash, lastValidBlockHeight } =
          await connection.getLatestBlockhash("confirmed");
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = publicKey;

        // Send transaction
        const signature = await sendTransaction(transaction, connection);

        // Wait for confirmation
        await connection.confirmTransaction(
          {
            signature,
            blockhash,
            lastValidBlockHeight,
          },
          "confirmed"
        );

        return { success: true, signature };
      } catch (error) {
        console.error("Transaction error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Transaction failed",
        };
      } finally {
        setIsProcessing(false);
      }
    },
    [connection, publicKey, sendTransaction]
  );

  const sendTransactionWithInstructions = useCallback(
    async (
      instructions: TransactionInstruction[]
    ): Promise<TransactionResult> => {
      if (!publicKey || !sendTransaction) {
        return { success: false, error: "Wallet not connected" };
      }

      setIsProcessing(true);

      try {
        const transaction = new Transaction().add(...instructions);

        const { blockhash, lastValidBlockHeight } =
          await connection.getLatestBlockhash("confirmed");
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = publicKey;

        const signature = await sendTransaction(transaction, connection);

        await connection.confirmTransaction(
          {
            signature,
            blockhash,
            lastValidBlockHeight,
          },
          "confirmed"
        );

        return { success: true, signature };
      } catch (error) {
        console.error("Transaction error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Transaction failed",
        };
      } finally {
        setIsProcessing(false);
      }
    },
    [connection, publicKey, sendTransaction]
  );

  return {
    sendSOL,
    sendTransactionWithInstructions,
    isProcessing,
    isWalletConnected: !!publicKey,
    walletAddress: publicKey?.toBase58(),
  };
}
