import { getSupabaseClient, DataAccessError } from "./supabase-client";

// Supabase's own query-builder type is awkward to re-export cleanly; this
// alias keeps the "any" confined to this one adapter-boundary file.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type QueryBuilder = any;

/**
 * Runs a select against one table and maps each row into our own domain
 * type, so a raw Supabase/Postgres error (or row shape) never reaches the
 * Orchestration layer — only a typed DataAccessError or typed rows do.
 */
export async function runSelect<T>(
  table: string,

  build: (query: QueryBuilder) => QueryBuilder,
  mapRow: (row: Record<string, unknown>) => T,
): Promise<T[]> {
  const client = getSupabaseClient();
  const { data, error } = await build(client.from(table).select("*"));
  if (error) {
    throw new DataAccessError(`Failed to fetch from "${table}"`, error);
  }
  return ((data as Record<string, unknown>[]) ?? []).map(mapRow);
}
