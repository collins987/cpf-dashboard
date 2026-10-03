import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * The single point of contact with Supabase (Adapter pattern, Core Design
 * Principles §6-7). Every other module reaches the database through the
 * query functions in this folder — never by importing @supabase/supabase-js
 * directly — so swapping the backend later touches one file, not every call site.
 */
let client: SupabaseClient | null = null;

export class DataAccessError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "DataAccessError";
  }
}

export function getSupabaseClient(): SupabaseClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new DataAccessError(
      "Supabase is not configured. Copy .env.local.example to .env.local and fill in your project's values.",
    );
  }

  client = createClient(url, anonKey);
  return client;
}
