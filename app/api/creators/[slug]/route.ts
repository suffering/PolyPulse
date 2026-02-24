import { NextResponse } from "next/server";
import { getCachedCreators, findCreatorById } from "@/lib/creators-cache";
import { fetchPublicProfile } from "@/lib/polymarket";

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

    let profileImage = creator.image;
    let displayName = creator.name;
    let xUsername = creator.handle ?? null;

    if (creator.walletAddress && /^0x[a-fA-F0-9]{40}$/.test(creator.walletAddress)) {
      const profile = await fetchPublicProfile(creator.walletAddress);
      if (profile) {
        if (profile.profileImage) profileImage = profile.profileImage;
        if (profile.name) displayName = profile.name;
        if (profile.xUsername) xUsername = profile.xUsername;
      }
    }

    return NextResponse.json({
      creator: {
        ...creator,
        image: profileImage,
        name: displayName,
        handle: xUsername ?? creator.handle,
      },
    });
  } catch (error) {
    console.error("Creator [slug] API error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch creator",
      },
      { status: 500 }
    );
  }
}
