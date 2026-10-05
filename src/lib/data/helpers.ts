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
// PostgREST caps every SELECT at 1000 rows by default. Explicitly request a
// larger range so small-but->1000-row tables (loan_account at 1200, etc.) come
// back in one request. All tables in this project are well under this cap.
const MAX_ROWS = 50000;

export async function runSelect<T>(
  table: string,

  build: (query: QueryBuilder) => QueryBuilder,
  mapRow: (row: Record<string, unknown>) => T,
): Promise<T[]> {
  const client = getSupabaseClient();
  const { data, error } = await build(
    client
      .from(table)
      .select("*")
      .range(0, MAX_ROWS - 1),
  );
  if (error) {
    throw new DataAccessError(`Failed to fetch from "${table}"`, error);
  }
  return ((data as Record<string, unknown>[]) ?? []).map(mapRow);
}

// PostgREST sends filters in the URL; a large .in(...) list blows past the
// server's URL-length limit. Chunk the id list and union the results.
const IN_CHUNK_SIZE = 300;

export async function runSelectIn<T>(
  table: string,
  column: string,
  ids: string[],
  build: (query: QueryBuilder) => QueryBuilder,
  mapRow: (row: Record<string, unknown>) => T,
): Promise<T[]> {
  if (ids.length === 0) return [];
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += IN_CHUNK_SIZE) {
    chunks.push(ids.slice(i, i + IN_CHUNK_SIZE));
  }
  const results = await Promise.all(
    chunks.map((chunk) => runSelect(table, (q) => build(q.in(column, chunk)), mapRow)),
  );
  return results.flat();
}
