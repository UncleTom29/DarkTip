import { NextRequest, NextResponse } from "next/server";
import { getMerchantToolsService, type CreatorProfile } from "@/lib/shadowpay/merchant";
import { getShadowIDService } from "@/lib/shadowpay/shadowid";
import { getSubscriptionsService } from "@/lib/shadowpay/subscriptions";
import { getShadowPayClient } from "@/lib/shadowpay/client";

// ============================================
// GET - List and search creators
// ============================================

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const walletAddress = searchParams.get("wallet");

    const merchantTools = getMerchantToolsService();
    const shadowID = getShadowIDService();
    const subscriptions = getSubscriptionsService();

    // If specific wallet requested, get that creator
    if (walletAddress) {
      const profile = await merchantTools.getProfileByWallet(walletAddress);

      if (!profile) {
        return NextResponse.json(
          { error: "Creator not found" },
          { status: 404 }
        );
      }

      // Get additional data
      const identity = await shadowID.getIdentityByWallet(walletAddress);
      const plans = await subscriptions.getCreatorPlans(walletAddress);

      return NextResponse.json({
        success: true,
        data: {
          ...profile,
          shadowId: identity
            ? {
                verified: identity.verificationLevel !== "basic",
                level: identity.verificationLevel,
              }
            : null,
          subscriptionPlans: plans.map((p) => ({
            id: p.id,
            name: p.name,
            tier: p.tier,
            price: p.amountLamports / 1e9,
            frequency: p.frequency,
            features: p.features,
          })),
        },
      });
    }

    // For now, return placeholder data since we don't have a database
    // In production, this would query a database of registered creators
    const placeholderCreators = [
      {
        id: "creator_1",
        walletAddress: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
        username: "alice_dev",
        displayName: "Alice Developer",
        bio: "Building the future of decentralized applications.",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alice",
        categories: ["developer", "educator"],
        isVerified: true,
        totalTipsReceived: 125000000000,
        supporterCount: 342,
        socialLinks: [
          { platform: "twitter", url: "https://twitter.com/alice_dev", verified: true },
          { platform: "github", url: "https://github.com/alice", verified: true },
        ],
      },
      {
        id: "creator_2",
        walletAddress: "8yLXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsV",
        username: "bob_podcaster",
        displayName: "Bob's Tech Talks",
        bio: "Weekly podcast about Web3 and privacy tech.",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=bob",
        categories: ["podcaster", "educator"],
        isVerified: true,
        totalTipsReceived: 89000000000,
        supporterCount: 567,
        socialLinks: [
          { platform: "youtube", url: "https://youtube.com/@bobtechtalks", verified: true },
          { platform: "twitter", url: "https://twitter.com/bob_tech", verified: true },
        ],
      },
      {
        id: "creator_3",
        walletAddress: "9zMXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsW",
        username: "crypto_artist",
        displayName: "Crypto Canvas",
        bio: "Creating digital art inspired by blockchain technology.",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=artist",
        categories: ["artist", "nft"],
        isVerified: false,
        totalTipsReceived: 45000000000,
        supporterCount: 189,
        socialLinks: [
          { platform: "twitter", url: "https://twitter.com/crypto_canvas", verified: false },
        ],
      },
    ];

    let filtered = [...placeholderCreators];

    // Filter by category
    if (category && category !== "all") {
      filtered = filtered.filter((c) => c.categories.includes(category));
    }

    // Filter by search
    if (search) {
      const query = search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.username.toLowerCase().includes(query) ||
          c.displayName.toLowerCase().includes(query) ||
          c.bio.toLowerCase().includes(query)
      );
    }

    // Pagination
    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: paginated,
      meta: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error("Creators fetch error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

// ============================================
// POST - Register as a creator
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      walletAddress,
      username,
      displayName,
      bio,
      categories,
      socialLinks,
      signature,
      settings,
    } = body;

    // Validate required fields
    if (!walletAddress || !username || !displayName || !signature) {
      return NextResponse.json(
        { error: "Missing required fields: walletAddress, username, displayName, signature" },
        { status: 400 }
      );
    }

    // Validate username format
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
      return NextResponse.json(
        { error: "Invalid username. Must be 3-30 alphanumeric characters or underscores." },
        { status: 400 }
      );
    }

    const merchantTools = getMerchantToolsService();
    const shadowID = getShadowIDService();
    const subscriptions = getSubscriptionsService();

    // Check if username already exists
    const existingByUsername = await merchantTools.getProfileByUsername(username);
    if (existingByUsername) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 409 }
      );
    }

    // Check if wallet already registered
    const existingByWallet = await merchantTools.getProfileByWallet(walletAddress);
    if (existingByWallet) {
      return NextResponse.json(
        { error: "Wallet already registered as a creator" },
        { status: 409 }
      );
    }

    // Create creator profile
    const profileResult = await merchantTools.upsertProfile(walletAddress, {
      username,
      displayName,
      bio: bio || "",
      categories: categories || [],
      socialLinks: socialLinks || [],
      settings: settings || {
        minimumTipAmount: 0.01,
        defaultCurrency: "SOL",
        enableSubscriptions: true,
        enableGrants: true,
        privacyLevel: "public",
      },
    });

    if (!profileResult.success || !profileResult.profile) {
      return NextResponse.json(
        { error: profileResult.error || "Failed to create creator profile" },
        { status: 500 }
      );
    }

    // Register ShadowID for privacy features
    const shadowIdResult = await shadowID.register(walletAddress, signature, {
      displayName,
    });

    // Create default subscription plans
    let defaultPlans;
    if (settings?.enableSubscriptions !== false) {
      defaultPlans = await subscriptions.createDefaultPlans(walletAddress);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...profileResult.profile,
        shadowId: shadowIdResult.success
          ? {
              commitment: shadowIdResult.commitment,
              registered: true,
            }
          : null,
        subscriptionPlans: defaultPlans?.map((p) => ({
          id: p.id,
          name: p.name,
          tier: p.tier,
          price: p.amountLamports / 1e9,
          frequency: p.frequency,
        })),
      },
    });
  } catch (error) {
    console.error("Creator creation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

// ============================================
// PUT - Update creator profile
// ============================================

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      walletAddress,
      displayName,
      bio,
      avatar,
      banner,
      categories,
      socialLinks,
      settings,
      signature,
    } = body;

    if (!walletAddress || !signature) {
      return NextResponse.json(
        { error: "Missing required fields: walletAddress, signature" },
        { status: 400 }
      );
    }

    const merchantTools = getMerchantToolsService();

    // Verify creator exists
    const existingProfile = await merchantTools.getProfileByWallet(walletAddress);
    if (!existingProfile) {
      return NextResponse.json(
        { error: "Creator not found" },
        { status: 404 }
      );
    }

    // Update profile
    const updates: Partial<CreatorProfile> = {};
    if (displayName !== undefined) updates.displayName = displayName;
    if (bio !== undefined) updates.bio = bio;
    if (avatar !== undefined) updates.avatar = avatar;
    if (banner !== undefined) updates.banner = banner;
    if (categories !== undefined) updates.categories = categories;
    if (socialLinks !== undefined) updates.socialLinks = socialLinks;

    const profileResult = await merchantTools.upsertProfile(walletAddress, updates);

    // Update settings if provided
    if (settings) {
      await merchantTools.updateSettings(existingProfile.id, settings);
    }

    if (!profileResult.success) {
      return NextResponse.json(
        { error: profileResult.error || "Failed to update profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: profileResult.profile,
    });
  } catch (error) {
    console.error("Creator update error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE - Deactivate creator profile
// ============================================

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const walletAddress = searchParams.get("wallet");
    const signature = searchParams.get("signature");

    if (!walletAddress || !signature) {
      return NextResponse.json(
        { error: "Missing required fields: wallet, signature" },
        { status: 400 }
      );
    }

    const merchantTools = getMerchantToolsService();
    const subscriptions = getSubscriptionsService();

    // Verify creator exists
    const profile = await merchantTools.getProfileByWallet(walletAddress);
    if (!profile) {
      return NextResponse.json(
        { error: "Creator not found" },
        { status: 404 }
      );
    }

    // Deactivate all subscription plans
    const plans = await subscriptions.getCreatorPlans(walletAddress);
    for (const plan of plans) {
      await subscriptions.deactivatePlan(plan.id);
    }

    // In production, this would:
    // 1. Mark profile as inactive (not delete)
    // 2. Prevent new subscriptions
    // 3. Allow existing subscriptions to complete
    // 4. Archive data for compliance

    return NextResponse.json({
      success: true,
      data: {
        message: "Creator profile deactivated",
        walletAddress,
      },
    });
  } catch (error) {
    console.error("Creator deletion error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
