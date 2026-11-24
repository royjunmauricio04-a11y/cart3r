import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/ratelimit";
import { fetchOEmbed, isShortLink, parseTikTokUrl, resolveShortLink } from "@/lib/tiktok-url";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;
  if (!rateLimit(`analyze:${userId}`, 20)) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

  const p = z.object({ url: z.string().max(500) }).safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const parsed = isShortLink(p.data.url) ? await resolveShortLink(p.data.url).catch(() => null) : parseTikTokUrl(p.data.url);
  if (!parsed) return NextResponse.json({ error: "Not a valid TikTok video URL" }, { status: 422 });

  const meta = await fetchOEmbed(parsed.canonicalUrl).catch(() => null);
  const video = await db.video.upsert({
    where: { userId_platformVideoId: { userId, platformVideoId: parsed.videoId } },
    create: { userId, originalUrl: p.data.url, canonicalUrl: parsed.canonicalUrl, platformVideoId: parsed.videoId,
      creatorHandle: meta?.creatorHandle ?? parsed.handle, title: meta?.title, thumbnailUrl: meta?.thumbnailUrl },
    update: { title: meta?.title ?? undefined, thumbnailUrl: meta?.thumbnailUrl ?? undefined },
  });
  await db.activityLog.create({ data: { userId, action: "video.analyze", metadata: { videoId: video.id } } });
  return NextResponse.json({ video, metadataAvailable: !!meta,
    note: meta ? undefined : "Public metadata unavailable (video may be private or removed). Metrics are not available." });
}
