export const dynamic = "force-dynamic";

import { DashboardShell } from "@/components/DashboardShell";
import { getRukishaView } from "@/lib/orchestration/rukisha";
import { buildRefreshMeta } from "@/lib/orchestration/refresh-meta";

export default async function RukishaPage() {
  const { views } = await getRukishaView();
  const refreshMeta = buildRefreshMeta();
  return <DashboardShell rukishaViews={views} refreshMeta={refreshMeta} />;
}
