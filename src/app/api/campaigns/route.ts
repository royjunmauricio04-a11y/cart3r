import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const schema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
  videoIds: z.array(z.string()).max(50).default([]),
}).refine((v) => !v.startsAt || !v.endsAt || v.endsAt >= v.startsAt, { message: "endsAt before startsAt" });

export async function GET() {
  const s = await auth();
  if (!s?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const campaigns = await db.campaign.findMany({
    where: { userId: s.user.id }, orderBy: { createdAt: "desc" }, include: { _count: { select: { videos: true } } } });
  return NextResponse.json({ campaigns });
}

export async function POST(req: Request) {
  const s = await auth();
  if (!s?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = s.user.id;
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Invalid input", issues: p.error.flatten() }, { status: 400 });
  // Tenant isolation: only attach videos owned by this user.
  const owned = await db.video.count({ where: { userId, id: { in: p.data.videoIds } } });
  if (owned !== p.data.videoIds.length) return NextResponse.json({ error: "Video not found" }, { status: 404 });
  const { videoIds, ...data } = p.data;
  const campaign = await db.campaign.create({
    data: { ...data, userId, videos: { create: videoIds.map((videoId) => ({ videoId })) } } });
  await db.activityLog.create({ data: { userId, action: "campaign.create", metadata: { id: campaign.id } } });
  return NextResponse.json({ campaign }, { status: 201 });
}
