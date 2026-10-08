import { KPI_CALCULATIONS } from "./kpi-calculations";

export type SearchEntryType = "subsidiary" | "service" | "kpi" | "page";

export interface SearchEntry {
  label: string;
  type: SearchEntryType;
  route: string;
}

const RUKISHA = "/rukisha";
const CPFFS = "/cpf-financial-services";
const CPFCA = "/cpf-capital-advisory";
const GROUP = "/group";
const ABOUT = "/about";

const SUBSIDIARIES: SearchEntry[] = [
  { label: "Rukisha", type: "subsidiary", route: RUKISHA },
  { label: "CPF Financial Services", type: "subsidiary", route: CPFFS },
  { label: "CPF Capital & Advisory", type: "subsidiary", route: CPFCA },
  { label: "Group View", type: "page", route: GROUP },
  { label: "About", type: "page", route: ABOUT },
];

const SERVICES: SearchEntry[] = [
  { label: "Lending", type: "service", route: RUKISHA },
  { label: "Payments & Transfers", type: "service", route: RUKISHA },
  { label: "Savings", type: "service", route: RUKISHA },
  { label: "Pension Fund Administration", type: "service", route: CPFFS },
  { label: "Trust Fund Administration", type: "service", route: CPFFS },
  { label: "Agency Services", type: "service", route: CPFFS },
  { label: "Alternative Investments (REITs)", type: "service", route: CPFCA },
  { label: "Structured & Project Finance Advisory", type: "service", route: CPFCA },
  { label: "Debt Capital Markets (Sukuk/Bonds)", type: "service", route: CPFCA },
];

const KPI_TO_ROUTE: Record<string, string> = {
  "Portfolio Value": RUKISHA,
  "Active Borrowers": RUKISHA,
  "Repayment Rate": RUKISHA,
  "Default Rate (Blended)": RUKISHA,
  "Transaction Volume": RUKISHA,
  "Transaction Value": RUKISHA,
  "Active Wallets": RUKISHA,
  "Avg. Transaction Size": RUKISHA,
  "Goal-Based Savings": RUKISHA,
  "Pension-Linked Savings": RUKISHA,
  "Active Savers": RUKISHA,
  "Savings-to-Loan Ratio": RUKISHA,
  "Member Contributions (period)": CPFFS,
  "Fund Balance": CPFFS,
  "Active Schemes": CPFFS,
  Members: CPFFS,
  "Assets Under Administration": CPFFS,
  "Number of Trusts": CPFFS,
  "Trust Beneficiaries": CPFFS,
  "Trust Fund Growth": CPFFS,
  "Agency Transaction Value": CPFFS,
  "Agency Transaction Volume": CPFFS,
  "Principals Served": CPFFS,
  "Agency Fee Income": CPFFS,
  "AUM in REIT Vehicles": CPFCA,
  "Unit Holders": CPFCA,
  "Unit NAV": CPFCA,
  "Distribution Yield (Annualized)": CPFCA,
  "Deal Count (YTD)": CPFCA,
  "Deal Value (YTD)": CPFCA,
  "Average Deal Size": CPFCA,
  "Advisory Fee Income": CPFCA,
  "Issuance Count (YTD)": CPFCA,
  "Issuance Value (YTD)": CPFCA,
  "Weighted Avg. Profit Rate": CPFCA,
  "Subscription Rate": CPFCA,
  "Total Group AUM/AUA": GROUP,
  "Total Active Clients": GROUP,
  "Group Transaction/Deal Value": GROUP,
  "Business Lines": GROUP,
};

const KPIS: SearchEntry[] = Object.keys(KPI_CALCULATIONS).map((label) => ({
  label,
  type: "kpi" as const,
  route: KPI_TO_ROUTE[label] ?? RUKISHA,
}));

export const SEARCH_CATALOG: SearchEntry[] = [...SUBSIDIARIES, ...SERVICES, ...KPIS];

export function searchCatalog(query: string, limit = 20): SearchEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return SEARCH_CATALOG.filter((e) => e.label.toLowerCase().includes(q)).slice(0, limit);
}
