export const dynamic = "force-dynamic";

import { DashboardShell } from "@/components/DashboardShell";
import { getRukishaView } from "@/lib/orchestration/rukisha";
import { getCpfFinancialServicesView } from "@/lib/orchestration/cpf-financial-services";
import { getCpfCapitalAdvisoryView } from "@/lib/orchestration/cpf-capital-advisory";
import { getGroupView } from "@/lib/orchestration/group";
import { buildRefreshMeta } from "@/lib/orchestration/refresh-meta";

/**
 * The Orchestration layer's entry point for this route: fetches/computes
 * every tab's view model once, server-side, before the page ever reaches
 * the browser. The Entry/Interface layer (DashboardShell and below) only
 * ever sees the finished view models — never raw rows or Supabase.
 */
export default async function Home() {
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

  return (
    <DashboardShell
      rukisha={rukisha.view}
      cpffs={cpffs.view}
      cpfca={cpfca.view}
      group={group}
      refreshMeta={refreshMeta}
    />
  );
}
