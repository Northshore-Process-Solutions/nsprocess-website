"use server";

import { redirect } from "next/navigation";

import { generateDemoSeed } from "@/lib/demo/seed";
import {
  clearDemoSessionCookie,
  createBuildingDemoSession,
  deleteDemoSession,
  getDemoSessionIdFromCookie,
  markDemoSessionError,
  markDemoSessionReady,
  purgeExpiredDemoSessions,
  setDemoSessionCookie,
} from "@/lib/demo/session";
import type { DemoIntake } from "@/lib/demo/types";

export type DemoActionResult = {
  ok: boolean;
  sessionId?: string;
  error?: string;
};

function clean(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

export async function startDemoSession(
  formData: FormData,
): Promise<DemoActionResult> {
  try {
    await purgeExpiredDemoSessions();
  } catch {
    // Non-fatal if purge fails; session create will still surface real errors.
  }

  const intake: DemoIntake = {
    businessName: clean(formData.get("businessName")),
    industry: clean(formData.get("industry")),
    size: clean(formData.get("size")),
    location: clean(formData.get("location")),
    description: clean(formData.get("description")),
    contactName: clean(formData.get("contactName")),
  };

  if (!intake.businessName || !intake.description) {
    return {
      ok: false,
      error: "Business name and a short description are required.",
    };
  }

  try {
    const session = await createBuildingDemoSession(intake);
    await setDemoSessionCookie(session.id);

    // Build seed in the same request so the visitor lands on a ready demo.
    try {
      const seed = await generateDemoSeed(intake);
      await markDemoSessionReady(session.id, seed);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to build demo data.";
      await markDemoSessionError(session.id, message);
      return { ok: false, sessionId: session.id, error: message };
    }

    return { ok: true, sessionId: session.id };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to start demo.";
    return { ok: false, error: message };
  }
}

export async function endDemoSession() {
  const sessionId = await getDemoSessionIdFromCookie();
  if (sessionId) {
    try {
      await deleteDemoSession(sessionId);
    } catch {
      // Cookie clear still happens below.
    }
  }
  await clearDemoSessionCookie();
  redirect("/demo");
}
