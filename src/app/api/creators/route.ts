import { NextRequest, NextResponse } from "next/server";

// Mock creators data
const mockCreators = [
  {
    id: "1",
    walletAddress: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    username: "alice_dev",
    displayName: "Alice Developer",
    bio: "Building the future of decentralized applications.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alice",
    categories: ["developer", "educator"],
    isVerified: true,
    totalTipsReceived: 125000000000,
    supporterCount: 342,
  },
  {
    id: "2",
    walletAddress: "8yLXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsV",
    username: "bob_podcaster",
    displayName: "Bob's Tech Talks",
    bio: "Weekly podcast about Web3 and privacy tech.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=bob",
    categories: ["podcaster", "educator"],
    isVerified: true,
    totalTipsReceived: 89000000000,
    supporterCount: 567,
  },
];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    let filtered = [...mockCreators];

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
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, username, displayName, bio, categories } = body;

    // Validate required fields
    if (!walletAddress || !username || !displayName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // In production, this would:
    // 1. Validate wallet signature
    // 2. Check username availability
    // 3. Generate stealth keys
    // 4. Create creator record in database

    const newCreator = {
      id: `creator_${Date.now()}`,
      walletAddress,
      username,
      displayName,
      bio: bio || "",
      categories: categories || [],
      isVerified: false,
      totalTipsReceived: 0,
      supporterCount: 0,
      createdAt: new Date(),
    };

    return NextResponse.json({
      success: true,
      data: newCreator,
    });
  } catch (error) {
    console.error("Creator creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
