import { NextResponse } from "next/server";
import { getCachedCreators, findCreatorById } from "@/lib/creators-cache";
import { enrichCreatorWithWallet, enrichCreatorWithPnL } from "@/lib/polymarket";

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
    const includeWallet = searchParams.get("wallet") === "true";
    const includePnL = searchParams.get("pnl") === "true";

    const { creators } = await getCachedCreators();
    let creator = findCreatorById(creators, slug);
    
    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    if (includeWallet) {
      creator = await enrichCreatorWithWallet(creator);
    }

    if (includePnL && creator.walletAddress) {
      creator = await enrichCreatorWithPnL(creator);
    }

    return NextResponse.json({ creator });
  } catch (error) {
    console.error("Creator enrich API error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to enrich creator",
      },
      { status: 500 }
    );
  }
}
