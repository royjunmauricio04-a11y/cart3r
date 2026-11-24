import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const activities = await db.activityLog.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 8,
    select: { id: true, action: true, metadata: true, createdAt: true },
  });
  return NextResponse.json({ activities });
}
