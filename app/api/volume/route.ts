import { NextResponse } from "next/server";
import { getExchangeVolumeData } from "@/lib/volume";

export const dynamic = "force-dynamic";
export const revalidate = 300;

export async function GET() {
  try {
    const data = await getExchangeVolumeData();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Volume API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch volume" },
      { status: 500 }
    );
  }
}
