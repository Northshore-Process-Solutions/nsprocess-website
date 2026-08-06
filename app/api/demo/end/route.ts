import { NextResponse } from "next/server";

import {
  destroyCurrentDemoSession,
  purgeExpiredDemoSessions,
} from "@/lib/demo/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Ends the visitor's demo: deletes their `demo_sessions` row and clears the
 * cookie. Used by End demo, sendBeacon on tab close, and leave-demo navigation.
 */
export async function POST() {
  const noStore = {
    "Cache-Control": "private, no-store, no-cache, max-age=0, must-revalidate",
    "CDN-Cache-Control": "no-store",
    "Vercel-CDN-Cache-Control": "no-store",
  };

  try {
    await destroyCurrentDemoSession();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to end demo.";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500, headers: noStore },
    );
  }

  try {
    await purgeExpiredDemoSessions();
  } catch {
    // Best-effort cleanup of other expired rows.
  }

  return NextResponse.json({ ok: true }, { headers: noStore });
}
