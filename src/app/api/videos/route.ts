import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const videos = await db.video.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      canonicalUrl: true,
      title: true,
      creatorHandle: true,
      createdAt: true,
      campaigns: {
        select: { campaign: { select: { id: true, name: true } } },
      },
      metrics: {
        orderBy: { capturedAt: "desc" },
        take: 1,
        select: { views: true, likes: true, comments: true, shares: true, engagementRate: true, capturedAt: true },
      },
    },
  });

  return NextResponse.json({ videos });
}
