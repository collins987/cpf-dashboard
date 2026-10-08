export const dynamic = "force-dynamic";

import { DashboardShell } from "@/components/DashboardShell";
import { getRukishaView } from "@/lib/orchestration/rukisha";
import { getCpfFinancialServicesView } from "@/lib/orchestration/cpf-financial-services";
import { getCpfCapitalAdvisoryView } from "@/lib/orchestration/cpf-capital-advisory";
import { getGroupView } from "@/lib/orchestration/group";
import { buildRefreshMeta } from "@/lib/orchestration/refresh-meta";

export default async function GroupPage() {
  const [rukisha, cpffs, cpfca] = await Promise.all([
    getRukishaView(),
    getCpfFinancialServicesView(),
    getCpfCapitalAdvisoryView(),
  ]);
  const groupViews = await getGroupView({
    rukisha: rukisha.totals,
    cpffs: cpffs.totals,
    cpfca: cpfca.totals,
  });
  const refreshMeta = buildRefreshMeta();
  return <DashboardShell groupViews={groupViews} refreshMeta={refreshMeta} />;
}
