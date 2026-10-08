export const dynamic = "force-dynamic";

import { DashboardShell } from "@/components/DashboardShell";
import { getCpfFinancialServicesView } from "@/lib/orchestration/cpf-financial-services";
import { buildRefreshMeta } from "@/lib/orchestration/refresh-meta";

export default async function CpfFinancialServicesPage() {
  const { view } = await getCpfFinancialServicesView();
  const refreshMeta = buildRefreshMeta();
  return <DashboardShell cpffs={view} refreshMeta={refreshMeta} />;
}
