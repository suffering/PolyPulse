import { NextResponse } from "next/server";
import { getCachedCreators, findCreatorById } from "@/lib/creators-cache";
import { fetchPnLHistory } from "@/lib/polymarket";

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

    const { searchParams } = new URL(request.url);
    const startTime = searchParams.get("startTime") ? Number(searchParams.get("startTime")) : undefined;
    const endTime = searchParams.get("endTime") ? Number(searchParams.get("endTime")) : undefined;

    const { creators } = await getCachedCreators();
    const creator = findCreatorById(creators, slug);
    
    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    if (!creator.walletAddress) {
      return NextResponse.json({ data: [] });
    }

    const data = await fetchPnLHistory(creator.walletAddress, startTime, endTime);

    return NextResponse.json({ data });
  } catch (error) {
    console.error("P&L history API error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch P&L history",
      },
      { status: 500 }
    );
  }
}
