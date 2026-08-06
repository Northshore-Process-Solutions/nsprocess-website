"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { generateDemoSeed } from "@/lib/demo/seed";
import {
  clearDemoSessionCookie,
  createBuildingDemoSession,
  destroyCurrentDemoSession,
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

function revalidateDemoPortal() {
  revalidatePath("/demo", "layout");
}

export async function startDemoSession(
  formData: FormData,
): Promise<DemoActionResult> {
  try {
    await purgeExpiredDemoSessions();
  } catch {
    // Non-fatal if purge fails; session create will still surface real errors.
  }

  // Always drop any prior session so a new intake cannot reuse old seed/cookie.
  try {
    await destroyCurrentDemoSession();
  } catch {
    try {
      await clearDemoSessionCookie();
    } catch {
      // ignore
    }
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

    try {
      const seed = await generateDemoSeed(intake);
      await markDemoSessionReady(session.id, seed);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to build demo data.";
      await markDemoSessionError(session.id, message);
      return { ok: false, sessionId: session.id, error: message };
    }

    revalidateDemoPortal();
    return { ok: true, sessionId: session.id };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to start demo.";
    return { ok: false, error: message };
  }
}

export async function endDemoSession() {
  try {
    await destroyCurrentDemoSession();
  } catch {
    try {
      await clearDemoSessionCookie();
    } catch {
      // ignore
    }
  }

  try {
    await purgeExpiredDemoSessions();
  } catch {
    // Best-effort.
  }

  revalidateDemoPortal();
  redirect("/demo/start");
}
