import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    const { walletAddress } = await request.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    // In production, this would:
    // 1. Check if user exists in database
    // 2. If not, create new user record
    // 3. Generate session token
    // 4. Return user data

    // For now, return mock user data
    const user = {
      id: uuidv4(),
      walletAddress,
      username: null,
      displayName: null,
      email: null,
      avatar: null,
      bio: null,
      isCreator: false,
      isVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return NextResponse.json({
      success: true,
      user,
      creator: null,
      supporter: {
        id: uuidv4(),
        walletAddress,
        anonymousId: `anon_${uuidv4().slice(0, 8)}`,
        isAnonymous: true,
        badges: [],
        totalTipsSent: 0,
        creatorsSupported: 0,
        supportStreak: 0,
        privacySettings: {
          showProfile: false,
          showSupportedCreators: false,
          showBadges: true,
          allowShoutouts: false,
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
