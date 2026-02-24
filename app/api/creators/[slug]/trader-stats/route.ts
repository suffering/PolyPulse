import { NextResponse } from "next/server";
import { getCachedCreators, findCreatorById } from "@/lib/creators-cache";
import { fetchUserTradingVolume, fetchPortfolioValue, fetchMarketsTraded } from "@/lib/polymarket";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
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

    // Creator-level stats (always available from Gamma API aggregation)
    const response: Record<string, unknown> = {
      marketVolume: creator.totalVolume,
      totalMarkets: creator.totalMarkets,
      activeMarkets: creator.activeMarkets,
      openInterest: creator.openInterest,
      tradingVolume: 0,
      portfolioValue: 0,
      marketsTraded: 0,
    };

    // Trader-level stats (from Polymarket Data API, requires wallet)
    if (creator.walletAddress) {
      const [tradingVolume, portfolioValue, marketsTraded] = await Promise.all([
        fetchUserTradingVolume(creator.walletAddress),
        fetchPortfolioValue(creator.walletAddress),
        fetchMarketsTraded(creator.walletAddress),
      ]);
      response.tradingVolume = tradingVolume;
      response.portfolioValue = portfolioValue;
      response.marketsTraded = marketsTraded;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Trader stats API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch trader stats" },
      { status: 500 }
    );
  }
}
