import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readCommunityConfig } from "./community.ts";

export function communityConfigFromEnv(): ReturnType<typeof readCommunityConfig> {
  return readCommunityConfig({
    url: import.meta.env.PUBLIC_SUPABASE_URL,
    anonKey: import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
  });
}

export function createCommunityClient(): SupabaseClient | null {
  const config = communityConfigFromEnv();
  if (!config) return null;
  return createClient(config.url, config.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
      storageKey: "lego-archive.brick-legends.auth.v1",
    },
  });
}
