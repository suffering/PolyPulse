import { NextResponse } from "next/server";
import { getCachedCreators, findCreatorById } from "@/lib/creators-cache";
import {
  fetchUserOpenPositions,
  fetchUserClosedPositions,
} from "@/lib/polymarket";

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
    const creator = findCreatorById(creators, slug);
    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    if (!creator.walletAddress) {
      return NextResponse.json({
        positions: [],
        closedPositions: [],
        pagination: { limit: 25, offset: 0, page: 1, total: 0 },
      });
    }

    const [openList, closedList] = await Promise.all([
      fetchUserOpenPositions(creator.walletAddress),
      fetchUserClosedPositions(creator.walletAddress, { limit: 50, offset: 0 }),
    ]);

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit")) || 25, 100);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const offset = (page - 1) * limit;
    const positions = openList.slice(offset, offset + limit);
    const total = openList.length;

    return NextResponse.json({
      positions,
      closedPositions: closedList,
      pagination: {
        limit,
        offset,
        page,
        total,
      },
    });
  } catch (error) {
    console.error("Creator positions API error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch positions",
      },
      { status: 500 }
    );
  }
}
