import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { z } from "zod";
import { auth } from "@/auth";
import { parseTikTokUrl } from "@/lib/tiktok-url";

const schema = z.object({ url: z.string().max(500), format: z.enum(["png", "svg"]).default("png") });

export async function POST(req: Request) {
  const s = await auth();
  if (!s?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const p = schema.safeParse(await req.json().catch(() => null));
  const v = p.success ? parseTikTokUrl(p.data.url) : null;
  if (!p.success || !v) return NextResponse.json({ error: "Invalid TikTok URL" }, { status: 422 });
  if (p.data.format === "svg") {
    const svg = await QRCode.toString(v.canonicalUrl, { type: "svg", margin: 2 });
    return new NextResponse(svg, { headers: { "Content-Type": "image/svg+xml" } });
  }
  const png = await QRCode.toBuffer(v.canonicalUrl, { margin: 2, width: 512 });
  return new NextResponse(new Uint8Array(png), { headers: { "Content-Type": "image/png" } });
}
