import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

import { createDemoAdminClient } from "@/lib/demo/client";
import {
  DEMO_SESSION_COOKIE,
  DEMO_SESSION_HOURS,
  isDemoExpired,
  type DemoIntake,
  type DemoSeed,
  type DemoSessionRow,
} from "@/lib/demo/types";

function getCookieSecret() {
  const secret =
    process.env.DEMO_SESSION_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!secret) {
    throw new Error(
      "Missing DEMO_SESSION_SECRET (or SUPABASE_SERVICE_ROLE_KEY fallback).",
    );
  }
  return secret;
}

function signSessionId(sessionId: string) {
  return createHmac("sha256", getCookieSecret())
    .update(sessionId)
    .digest("hex")
    .slice(0, 32);
}

export function encodeDemoSessionCookie(sessionId: string) {
  return `${sessionId}.${signSessionId(sessionId)}`;
}

export function decodeDemoSessionCookie(value: string | undefined) {
  if (!value) return null;
  const [sessionId, signature] = value.split(".");
  if (!sessionId || !signature) return null;

  const expected = signSessionId(sessionId);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return sessionId;
}

export async function setDemoSessionCookie(sessionId: string) {
  const jar = await cookies();
  jar.set(DEMO_SESSION_COOKIE, encodeDemoSessionCookie(sessionId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DEMO_SESSION_HOURS * 60 * 60,
  });
}

export async function clearDemoSessionCookie() {
  const jar = await cookies();
  // Explicit expire — jar.delete() alone can leave the cookie in some browsers.
  jar.set(DEMO_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function getDemoSessionIdFromCookie() {
  const jar = await cookies();
  return decodeDemoSessionCookie(jar.get(DEMO_SESSION_COOKIE)?.value);
}

export function demoExpiresAt(from = new Date()) {
  const expires = new Date(from);
  expires.setHours(expires.getHours() + DEMO_SESSION_HOURS);
  return expires.toISOString();
}

export async function createBuildingDemoSession(intake: DemoIntake) {
  const client = createDemoAdminClient();
  const { data, error } = await client
    .from("demo_sessions")
    .insert({
      status: "building",
      expires_at: demoExpiresAt(),
      intake,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create demo session.");
  }

  return data as DemoSessionRow;
}

export async function markDemoSessionReady(
  sessionId: string,
  seed: DemoSeed,
) {
  const client = createDemoAdminClient();
  const { error } = await client
    .from("demo_sessions")
    .update({ status: "ready", seed, error: null })
    .eq("id", sessionId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function markDemoSessionError(sessionId: string, message: string) {
  const client = createDemoAdminClient();
  await client
    .from("demo_sessions")
    .update({ status: "error", error: message })
    .eq("id", sessionId);
}

export async function getDemoSession(sessionId: string) {
  const client = createDemoAdminClient();
  const { data, error } = await client
    .from("demo_sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as DemoSessionRow | null) ?? null;
}

export async function requireReadyDemoSession() {
  const sessionId = await getDemoSessionIdFromCookie();
  if (!sessionId) return { session: null, error: "No demo session." as const };

  const session = await getDemoSession(sessionId);
  if (!session) {
    await clearDemoSessionCookie();
    return { session: null, error: "Demo session not found." as const };
  }

  if (isDemoExpired(session.expires_at)) {
    await deleteDemoSession(sessionId);
    await clearDemoSessionCookie();
    return { session: null, error: "Demo session expired." as const };
  }

  if (session.status !== "ready" || !session.seed) {
    return {
      session,
      error: "Demo is still building or failed." as const,
    };
  }

  return { session, error: null };
}

export async function deleteDemoSession(sessionId: string) {
  const client = createDemoAdminClient();
  const { error } = await client
    .from("demo_sessions")
    .delete()
    .eq("id", sessionId);

  if (error) {
    throw new Error(error.message);
  }
}

/** Delete the current cookie session row (if any) and clear the cookie. */
export async function destroyCurrentDemoSession() {
  const sessionId = await getDemoSessionIdFromCookie();
  if (sessionId) {
    await deleteDemoSession(sessionId);
  }
  await clearDemoSessionCookie();
  return sessionId;
}

export async function purgeExpiredDemoSessions() {
  const client = createDemoAdminClient();
  const { error } = await client
    .from("demo_sessions")
    .delete()
    .lt("expires_at", new Date().toISOString());

  if (error) {
    throw new Error(error.message);
  }
}
