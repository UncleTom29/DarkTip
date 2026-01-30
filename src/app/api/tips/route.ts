import { NextRequest, NextResponse } from "next/server";
import { getShadowPayClient } from "@/lib/shadowpay/client";
import { getEscrowService, type EscrowConfig } from "@/lib/shadowpay/escrow";
import { getShadowIDService } from "@/lib/shadowpay/shadowid";
import { getMerchantToolsService } from "@/lib/shadowpay/merchant";
import { type SupportedToken } from "@/lib/shadowpay/zk-payments";

// ============================================
// POST - Create a new tip
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      creatorId,
      creatorWallet,
      amountLamports,
      message,
      privacyLevel,
      source,
      supporterWallet,
      supporterSignature,
      token = "SOL",
      useEscrow = false,
    } = body;

    // Validate required fields
    if (!creatorWallet || !amountLamports || !privacyLevel) {
      return NextResponse.json(
        { error: "Missing required fields: creatorWallet, amountLamports, privacyLevel" },
        { status: 400 }
      );
    }

    // Validate amount (minimum 0.01 SOL = 10,000,000 lamports)
    if (amountLamports < 10000000 || amountLamports > 1000000000000) {
      return NextResponse.json(
        { error: "Invalid amount. Must be between 0.01 SOL and 1000 SOL" },
        { status: 400 }
      );
    }

    const shadowPay = getShadowPayClient();
    const escrowService = getEscrowService();
    const shadowID = getShadowIDService();
    const merchantTools = getMerchantToolsService();

    // Convert lamports to SOL for services
    const amountSOL = amountLamports / 1e9;

    // Check if supporter has a ShadowID
    let senderCommitment: string | undefined;
    if (supporterWallet) {
      const identity = await shadowID.getIdentityByWallet(supporterWallet);
      senderCommitment = identity?.commitment;
    }

    let result;

    if (useEscrow) {
      // Create escrow-based tip
      const escrowResult = await escrowService.createTipEscrow(
        supporterWallet || "anonymous",
        creatorWallet,
        amountSOL,
        token as SupportedToken,
        {
          message,
          expiresInHours: 72, // 3 days expiry
          requireRecipientAction: false,
        }
      );

      if (!escrowResult.success) {
        return NextResponse.json(
          { error: escrowResult.error || "Failed to create escrow" },
          { status: 500 }
        );
      }

      result = {
        tipId: escrowResult.escrow?.id,
        status: "pending",
        type: "escrow",
        unsignedTx: escrowResult.unsignedTx?.unsigned_tx_base64,
        escrowId: escrowResult.escrow?.id,
      };
    } else if (privacyLevel === "full" || privacyLevel === "private") {
      // Use ZK payment for full privacy
      const receiverIdentity = await shadowID.getIdentityByWallet(creatorWallet);
      const receiverCommitment = receiverIdentity?.commitment || creatorWallet;

      const zkPayment = await shadowPay.prepareZKPayment(
        receiverCommitment,
        amountLamports,
        token === "SOL" ? undefined : getTokenMint(token as SupportedToken)
      );

      result = {
        tipId: `tip_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        status: "pending",
        type: "zk_payment",
        commitment: zkPayment.payment_commitment,
        nullifier: zkPayment.payment_nullifier,
        unsignedTx: zkPayment.unsigned_tx_base64,
      };
    } else {
      // Standard payment intent
      const paymentIntent = await shadowPay.createPaymentIntent(amountLamports);

      result = {
        tipId: paymentIntent.invoice_id,
        status: "pending",
        type: "payment_intent",
        invoiceId: paymentIntent.invoice_id,
        unsignedTx: paymentIntent.unsigned_tx_base64,
      };
    }

    // Record supporter interaction for analytics
    if (creatorId) {
      await merchantTools.recordSupporter(creatorId, {
        walletAddress: privacyLevel === "full" ? undefined : supporterWallet,
        isAnonymous: privacyLevel === "full" || !supporterWallet,
        amount: amountSOL,
        type: "tip",
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        privacyLevel,
        message: message ? "encrypted" : null,
        source: source || "direct",
      },
    });
  } catch (error) {
    console.error("Tip creation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

// ============================================
// GET - Get tip statistics for a creator
// ============================================

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const creatorId = searchParams.get("creatorId");
    const creatorWallet = searchParams.get("creatorWallet");

    if (!creatorId && !creatorWallet) {
      return NextResponse.json(
        { error: "Creator ID or wallet address required" },
        { status: 400 }
      );
    }

    const shadowPay = getShadowPayClient();
    const merchantTools = getMerchantToolsService();

    // Get earnings from ShadowPay
    const earnings = await shadowPay.getMerchantEarnings();
    const analytics = await shadowPay.getMerchantAnalytics();

    // Get detailed breakdown from merchant tools
    let breakdown;
    if (creatorId) {
      breakdown = await merchantTools.getEarningsBreakdown(creatorId, "30d");
    }

    // Get top supporters (anonymized)
    let topSupporters;
    if (creatorId) {
      const supporters = await merchantTools.getTopSupporters(creatorId, 5);
      topSupporters = supporters.map((s) => ({
        rank: s.rank,
        displayName: s.isAnonymous ? "Anonymous Supporter" : s.displayName,
        totalContributed: s.totalContributed,
        percentageOfTotal: s.percentageOfTotal,
      }));
    }

    return NextResponse.json({
      success: true,
      data: {
        creatorId,
        totalTips: earnings.total_payments,
        totalAmount: earnings.total_earnings_lamports,
        earningsByToken: earnings.earnings_by_token,
        last30Days: breakdown
          ? {
              total: breakdown.total,
              bySource: breakdown.bySource,
            }
          : null,
        analytics: {
          totalRevenue: analytics.total_revenue,
          paymentCount: analytics.payment_count,
          averagePayment: analytics.average_payment,
        },
        topSupporters,
      },
    });
  } catch (error) {
    console.error("Tips fetch error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

// ============================================
// PUT - Verify and finalize a tip
// ============================================

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { tipId, invoiceId, signature, type } = body;

    if (!signature || (!tipId && !invoiceId)) {
      return NextResponse.json(
        { error: "Missing required fields: signature and tipId/invoiceId" },
        { status: 400 }
      );
    }

    const shadowPay = getShadowPayClient();
    const escrowService = getEscrowService();

    let result;

    if (type === "escrow" && tipId) {
      // Confirm escrow funding
      const escrowResult = await escrowService.confirmFunding(tipId, signature);
      result = {
        verified: escrowResult.success,
        status: escrowResult.success ? "funded" : "failed",
        escrowId: tipId,
      };
    } else if (invoiceId) {
      // Verify standard payment
      const verification = await shadowPay.verifyPayment(invoiceId, signature);
      result = {
        verified: verification.status === "completed",
        status: verification.status,
        receipt: verification.receipt,
      };
    } else {
      return NextResponse.json(
        { error: "Invalid request: must provide invoiceId or escrow tipId" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Tip verification error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

// ============================================
// Helper Functions
// ============================================

function getTokenMint(token: SupportedToken): string {
  const mints: Record<SupportedToken, string> = {
    SOL: "native",
    USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    USDT: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    USD1: "9VFQmhGbbpUSp8kH3c2ksXKR2VeAVfrkE1nzjN3oYEQW",
    BONK: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
  };
  return mints[token] || "native";
}
