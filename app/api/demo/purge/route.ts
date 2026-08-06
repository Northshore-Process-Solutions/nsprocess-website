import { NextResponse } from "next/server";

import { purgeExpiredDemoSessions } from "@/lib/demo/session";

export const runtime = "nodejs";

/** Optional cleanup endpoint for cron / manual purge of expired demo sessions. */
export async function POST(request: Request) {
  const secret = process.env.DEMO_PURGE_SECRET?.trim();
  if (secret) {
    const header = request.headers.get("authorization");
    if (header !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  }

  try {
    await purgeExpiredDemoSessions();
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to purge demos.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
