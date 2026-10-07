/**
 * Calculation text shown in each KPI tile's info tooltip, keyed by label.
 * Mirrors the Phase 2 Analysis document §1 — kept here (UI layer) rather
 * than in the Core Logic layer, since it's display copy, not a calculation.
 */
export const KPI_CALCULATIONS: Record<string, string> = {
  "Portfolio Value": "Sum of outstanding balances across active loan accounts.",
  "Active Borrowers": "Distinct borrowers with an active loan account.",
  "Repayment Rate": "Repayments received ÷ repayments scheduled, this period.",
  "Default Rate (Blended)": "Loans 90+ days overdue ÷ total loans, by product.",
  "Transaction Volume": "Count of merchant payments and transfers this period.",
  "Transaction Value": "Sum of merchant payment and transfer amounts.",
  "Active Wallets": "Distinct wallets with ≥1 transaction this period.",
  "Avg. Transaction Size": "Transaction Value ÷ Transaction Volume.",
  "Goal-Based Savings": "Sum of goal-based savings account balances.",
  "Pension-Linked Savings": "Sum of pension-linked savings balances.",
  "Active Savers": "Distinct savers across both savings products.",
  "Savings-to-Loan Ratio": "Total savings balance ÷ Portfolio Value.",
  "Member Contributions (period)": "Sum of contributions received this period.",
  "Fund Balance": "Opening balance + contributions − withdrawals + returns.",
  "Active Schemes": "Distinct pension schemes currently active.",
  Members: "Distinct members across active schemes.",
  "Assets Under Administration": "Sum of trust asset values.",
  "Number of Trusts": "Distinct active trusts under administration.",
  "Trust Beneficiaries": "Distinct beneficiaries across active trusts.",
  "Trust Fund Growth": "(Current AUA − prior AUA) ÷ prior AUA.",
  "Agency Transaction Value": "Sum of agency transaction amounts.",
  "Agency Transaction Volume": "Count of agency transactions this period.",
  "Principals Served": "Distinct principals under agency mandate.",
  "Agency Fee Income": "Sum of fees earned on agency transactions.",
  "AUM in REIT Vehicles": "Unit balance × unit NAV, summed across holders.",
  "Unit Holders": "Distinct REIT unit holders.",
  "Unit NAV": "Latest net asset value per unit.",
  "Distribution Yield (Annualized)": "Annual distribution per unit ÷ unit price.",
  "Deal Count (YTD)": "Structured finance deals closed this year.",
  "Deal Value (YTD)": "Sum of deal values closed this year.",
  "Average Deal Size": "Deal Value (YTD) ÷ Deal Count (YTD).",
  "Advisory Fee Income": "Sum of advisory fees on closed deals.",
  "Issuance Count (YTD)": "Sukuk/bond issuances closed this year.",
  "Issuance Value (YTD)": "Sum of issuance values closed this year.",
  "Weighted Avg. Profit Rate": "Profit rate weighted by issuance value.",
  "Subscription Rate": "Amount subscribed ÷ amount offered, per issuance.",

  "Total Group AUM/AUA":
    "Sum of Headline AUM across Rukisha, CPF Financial Services, and CPF Capital & Advisory.",
  "Total Active Clients":
    "Sum of Active Clients (wallets, members, unit holders) across all three subsidiaries. Not deduplicated.",
  "Group Transaction/Deal Value":
    "Transaction Value [Rukisha] + Member Contributions [CPF FS] + Agency Transaction Value [CPF FS] + Deal Value [CPF C&A] + Issuance Value [CPF C&A].",
  "Business Lines":
    "Constant = 3: Rukisha (digital financial services), CPF Financial Services (pensions, trust & agency), CPF Capital & Advisory (capital markets).",
};
