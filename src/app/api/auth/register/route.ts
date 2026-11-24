import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/ratelimit";

const schema = z.object({ email: z.string().email().max(254), password: z.string().min(10).max(128) });

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  if (!rateLimit(`reg:${ip}`, 5, 60_000)) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const email = p.data.email.toLowerCase();
  if (await db.user.findUnique({ where: { email } })) return NextResponse.json({ error: "Unable to register" }, { status: 409 });
  const user = await db.user.create({ data: { email, passwordHash: await bcrypt.hash(p.data.password, 12) } });
  await db.activityLog.create({ data: { userId: user.id, action: "user.register" } });
  return NextResponse.json({ id: user.id }, { status: 201 });
}
