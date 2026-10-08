export const dynamic = "force-dynamic";

import { DashboardShell } from "@/components/DashboardShell";
import { buildRefreshMeta } from "@/lib/orchestration/refresh-meta";

export default async function AboutPage() {
  const refreshMeta = buildRefreshMeta();
  return <DashboardShell refreshMeta={refreshMeta} />;
}
