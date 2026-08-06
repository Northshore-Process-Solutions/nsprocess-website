import { createClient } from "@supabase/supabase-js";

import { getSupabaseEnv } from "@/lib/supabase/env";

/** Public anon client for server-side website intake writes allowed by RLS. */
export function createPublicSupabaseClient() {
  const { url, key } = getSupabaseEnv();
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/** Service-role client for privileged server reads/writes (share links, etc.). */
export function createServiceRoleClient() {
  const { url } = getSupabaseEnv();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!key) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY. Add the Supabase service_role secret to .env.local (and Vercel).",
    );
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
