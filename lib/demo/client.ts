import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseEnv } from "@/lib/supabase/env";

/** Service-role client for demo sandbox only. Never expose to the browser. */
export function createDemoAdminClient(): SupabaseClient {
  const { url } = getSupabaseEnv();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!key) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY. Add the Supabase service_role secret to .env.local (and Vercel) — Project Settings → API → service_role. Never expose it as NEXT_PUBLIC_.",
    );
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
