import { DashboardShell } from "@/components/DashboardShell";
import { getRukishaView } from "@/lib/orchestration/rukisha";
import { getCpfFinancialServicesView } from "@/lib/orchestration/cpf-financial-services";
import { getCpfCapitalAdvisoryView } from "@/lib/orchestration/cpf-capital-advisory";
import { getGroupView } from "@/lib/orchestration/group";

/**
 * The Orchestration layer's entry point for this route: fetches/computes
 * every tab's view model once, server-side, before the page ever reaches
 * the browser. The Entry/Interface layer (DashboardShell and below) only
 * ever sees the finished view models — never raw rows or Supabase.
 */
export default function Home() {
  const rukisha = getRukishaView();
  const cpffs = getCpfFinancialServicesView();
  const cpfca = getCpfCapitalAdvisoryView();
  const group = getGroupView();

  return <DashboardShell rukisha={rukisha} cpffs={cpffs} cpfca={cpfca} group={group} />;
}
