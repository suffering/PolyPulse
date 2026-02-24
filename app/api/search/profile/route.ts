import { NextRequest, NextResponse } from "next/server";

const GAMMA_API_BASE = "https://gamma-api.polymarket.com";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get("q") || "";
    const q = query.trim();

    if (!q) {
      return NextResponse.json(
        { error: "Missing search query" },
        { status: 400 }
      );
    }

    const params = new URLSearchParams({
      q,
      search_profiles: "true",
      limit_per_type: "10",
    });

    const res = await fetch(`${GAMMA_API_BASE}/public-search?${params}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to search profiles" },
        { status: res.status }
      );
    }

    const data = await res.json();
    const profiles: any[] = Array.isArray(data?.profiles)
      ? data.profiles
      : [];

    if (profiles.length === 0) {
      return NextResponse.json(
        { error: "No Polymarket user found for that username" },
        { status: 404 }
      );
    }

    const normalizedQuery = q.toLowerCase().replace(/^@/, "").trim();

    const exactMatch = profiles.find((p) => {
      if (!p?.proxyWallet) return false;
      const name = (p.name || "").toLowerCase().trim();
      const pseudonym = (p.pseudonym || "").toLowerCase().replace(/^@/, "").trim();
      return (
        name === normalizedQuery ||
        pseudonym === normalizedQuery ||
        `@${pseudonym}` === normalizedQuery
      );
    });

    const profile = exactMatch || profiles.find((p) => p?.proxyWallet);

    if (!profile?.proxyWallet) {
      return NextResponse.json(
        { error: "No Polymarket user found for that username" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      wallet: profile.proxyWallet as string,
      name: (profile.name as string | undefined) ?? (profile.pseudonym as string | undefined) ?? null,
      profileImage: (profile.profileImage as string | undefined) ?? null,
    });
  } catch (error) {
    console.error("Search profile API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to search Polymarket profiles",
      },
      { status: 500 }
    );
  }
}

