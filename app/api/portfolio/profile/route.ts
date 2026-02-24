import { NextRequest, NextResponse } from "next/server";
import { fetchLeaderboard, normalizeWallet } from "@/lib/leaderboard";

const GAMMA_PROFILE_URL = "https://gamma-api.polymarket.com/public-profile";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export async function GET(request: NextRequest) {
  try {
    const address = request.nextUrl.searchParams.get("address");
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json(
        { error: "Invalid wallet address" },
        { status: 400 }
      );
    }

    const normalized = normalizeWallet(address);

    try {
      const res = await fetch(`${GAMMA_PROFILE_URL}?address=${encodeURIComponent(normalized)}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json({
          profileImage: data.profileImage ?? null,
          displayUsernamePublic: data.displayUsernamePublic ?? null,
          name: data.name ?? null,
          pseudonym: data.pseudonym ?? null,
          xUsername: data.xUsername ?? null,
          bio: data.bio ?? null,
          proxyWallet: data.proxyWallet ?? address,
        });
      }
    } catch {
      // Fall through to leaderboard fallback
    }

    const leaderboardData = await fetchLeaderboard({
      user: normalized,
      timePeriod: "ALL",
      orderBy: "VOL",
      limit: 1,
    });
    const entry = leaderboardData[0];
    return NextResponse.json({
      profileImage: entry?.profileImage ?? null,
      displayUsernamePublic: entry?.userName ?? null,
      name: entry?.userName ?? null,
      pseudonym: null,
      xUsername: entry?.xUsername ?? null,
      bio: null,
      proxyWallet: address,
    });
  } catch (error) {
    console.error("Portfolio profile API error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch profile",
      },
      { status: 500 }
    );
  }
}
