export const dynamic = "force-dynamic";

import { DashboardShell } from "@/components/DashboardShell";
import { getRukishaView } from "@/lib/orchestration/rukisha";
import { getCpfFinancialServicesView } from "@/lib/orchestration/cpf-financial-services";
import { getCpfCapitalAdvisoryView } from "@/lib/orchestration/cpf-capital-advisory";
import { getGroupView } from "@/lib/orchestration/group";
import { buildRefreshMeta } from "@/lib/orchestration/refresh-meta";

/** Group View genuinely needs all three subsidiaries' totals (unavoidable —
 * see docs/Phase 5 - Development.docx §9.2) even though it renders only
 * group-level content; the other three dedicated routes do not pay this cost. */
export default async function GroupPage() {
  const [rukisha, cpffs, cpfca] = await Promise.all([
    getRukishaView(),
    getCpfFinancialServicesView(),
    getCpfCapitalAdvisoryView(),
  ]);
  const group = await getGroupView({
    rukisha: rukisha.totals,
    cpffs: cpffs.totals,
    cpfca: cpfca.totals,
  });
  const refreshMeta = buildRefreshMeta();
  return <DashboardShell group={group} refreshMeta={refreshMeta} />;
}
