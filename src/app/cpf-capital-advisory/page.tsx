export const dynamic = "force-dynamic";

import { DashboardShell } from "@/components/DashboardShell";
import { getCpfCapitalAdvisoryView } from "@/lib/orchestration/cpf-capital-advisory";
import { buildRefreshMeta } from "@/lib/orchestration/refresh-meta";

export default async function CpfCapitalAdvisoryPage() {
  const { views } = await getCpfCapitalAdvisoryView();
  const refreshMeta = buildRefreshMeta();
  return <DashboardShell cpfcaViews={views} refreshMeta={refreshMeta} />;
}
