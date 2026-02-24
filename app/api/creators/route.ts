import { NextResponse } from "next/server";
import { getCachedCreators } from "@/lib/creators-cache";

export const dynamic = "force-dynamic";
export const revalidate = 300;

export async function GET() {
  try {
    const data = await getCachedCreators();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Creators API error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch creators",
      },
      { status: 500 }
    );
  }
}

