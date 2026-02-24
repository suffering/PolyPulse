import { NextResponse } from "next/server";
import { getCachedCreators, getCreatorId } from "@/lib/creators-cache";
import { fetchMarketsByCreatorId } from "@/lib/polymarket";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ error: "Missing slug" }, { status: 400 });
    }

    const { creators } = await getCachedCreators();
    const creatorId = getCreatorId(creators, slug);
    if (!creatorId) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit")) || 25, 100);
    const offset = Number(searchParams.get("offset")) || 0;
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const effectiveOffset = offset || (page - 1) * limit;

    const { rows, hasMore, total } = await fetchMarketsByCreatorId(creatorId, {
      limit,
      offset: effectiveOffset,
    });

    return NextResponse.json({
      markets: rows,
      pagination: {
        limit,
        offset: effectiveOffset,
        page: Math.floor(effectiveOffset / limit) + 1,
        total,
        hasMore,
      },
    });
  } catch (error) {
    console.error("Creator markets API error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch markets",
      },
      { status: 500 }
    );
  }
}
