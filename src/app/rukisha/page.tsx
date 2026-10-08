export const dynamic = "force-dynamic";

import { DashboardShell } from "@/components/DashboardShell";
import { getRukishaView } from "@/lib/orchestration/rukisha";
import { buildRefreshMeta } from "@/lib/orchestration/refresh-meta";

/** Dedicated route (Phase 5 Extended UI Enhancement §9.2) — fetches only the
 * Rukisha view, not all four, cutting the original single-route fetch waterfall. */
export default async function RukishaPage() {
  const { view } = await getRukishaView();
  const refreshMeta = buildRefreshMeta();
  return <DashboardShell rukisha={view} refreshMeta={refreshMeta} />;
}
