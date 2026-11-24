import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const campaignUpdateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(2000).nullable().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "COMPLETED", "ARCHIVED"]).optional(),
  startsAt: z.coerce.date().nullable().optional(),
  endsAt: z.coerce.date().nullable().optional(),
  videoIds: z.array(z.string().min(1)).max(50).optional(),
}).strict().refine((value) => Object.keys(value).length > 0, { message: "At least one field is required" });

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = campaignUpdateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten() }, { status: 400 });
  const patch = parsed.data;
  if (patch.videoIds && new Set(patch.videoIds).size !== patch.videoIds.length) {
    return NextResponse.json({ error: "Duplicate videos are not allowed" }, { status: 400 });
  }

  const campaign = await db.campaign.findFirst({ where: { id: params.id, userId } });
  if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  const startsAt = patch.startsAt === undefined ? campaign.startsAt : patch.startsAt;
  const endsAt = patch.endsAt === undefined ? campaign.endsAt : patch.endsAt;
  if (startsAt && endsAt && endsAt < startsAt) {
    return NextResponse.json({ error: "End date cannot be before start date" }, { status: 400 });
  }
  if (patch.videoIds) {
    const owned = await db.video.count({ where: { userId, id: { in: patch.videoIds } } });
    if (owned !== patch.videoIds.length) return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  const { videoIds, ...data } = patch;
  const updated = await db.$transaction(async (tx) => {
    if (videoIds !== undefined) {
      await tx.campaignVideo.deleteMany({ where: { campaignId: campaign.id } });
      if (videoIds.length) await tx.campaignVideo.createMany({ data: videoIds.map((videoId) => ({ campaignId: campaign.id, videoId })) });
    }
    const result = await tx.campaign.update({
      where: { id: campaign.id },
      data,
      include: { _count: { select: { videos: true } }, videos: { select: { videoId: true } } },
    });
    await tx.activityLog.create({ data: { userId, action: "campaign.update", metadata: { id: campaign.id } } });
    return result;
  });
  return NextResponse.json({ campaign: updated });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const campaign = await db.campaign.findFirst({ where: { id: params.id, userId }, select: { id: true } });
  if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  await db.$transaction([
    db.activityLog.create({ data: { userId, action: "campaign.delete", metadata: { id: campaign.id } } }),
    db.campaign.delete({ where: { id: campaign.id } }),
  ]);
  return NextResponse.json({ ok: true });
}
