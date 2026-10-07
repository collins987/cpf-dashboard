-- ============================================================
--  CPF Dashboard — Three-Way KPI Verification Script
--  Created: 2026-10-07
--
--  READ-ONLY — every statement is a SELECT.
--  Run each block against the Supabase/Postgres database and
--  compare the output to the matching dashboard tile.
--
--  Structure mirrors the Phase 2 Analysis specification:
--    §1  Rukisha — Lending (4 KPIs)
--    §2  Rukisha — Payments & Transfers (4 KPIs)
--    §3  Rukisha — Savings (4 KPIs)
--    §4  CPF Financial Services — Pension Fund Admin (4 KPIs)
--    §5  CPF Financial Services — Trust Fund Admin (4 KPIs)
--    §6  CPF Financial Services — Agency Services (4 KPIs)
--    §7  CPF Capital & Advisory — REITs (4 KPIs)
--    §8  CPF Capital & Advisory — Structured Finance (4 KPIs)
--    §9  CPF Capital & Advisory — Debt Capital Markets (4 KPIs)
--    §10 Group — Subsidiary Headline AUM + Active Clients
--    §11 Group — Combined Scorecard (4 KPIs)
--    §12 Group — Connection / Flow (pension_link_summary)
--    §13 Row count validation (free-tier ≤900 contract)
--    §14 Referential integrity spot-checks
-- ============================================================


-- ============================================================
-- §1  RUKISHA — Lending
-- ============================================================

-- KPI 1: Portfolio Value
-- Spec: SUM(outstanding_balance) WHERE status = 'active'
-- App:  calculatePortfolioValue → filter active, sum outstandingBalance
SELECT
  'Rukisha: Portfolio Value' AS kpi,
  COALESCE(SUM(outstanding_balance), 0) AS raw_value,
  'KES ' || TRIM(TO_CHAR(SUM(outstanding_balance), '999,999,999,999')) AS formatted
FROM loan_account
WHERE subsidiary_id = 'rukisha'
  AND status = 'active';

-- KPI 2: Active Borrowers
-- Spec: COUNT(DISTINCT borrower_id) WHERE status = 'active'
-- App:  calculateActiveBorrowers → filter active, count distinct borrowerId
SELECT
  'Rukisha: Active Borrowers' AS kpi,
  COUNT(DISTINCT borrower_id) AS raw_value
FROM loan_account
WHERE subsidiary_id = 'rukisha'
  AND status = 'active';

-- KPI 3: Repayment Rate
-- Spec: SUM(amount_paid) / SUM(amount_due) on all Rukisha loans
-- App:  calculateRepaymentRate → received / scheduled
SELECT
  'Rukisha: Repayment Rate' AS kpi,
  ROUND(
    SUM(r.amount_paid)::numeric / NULLIF(SUM(r.amount_due), 0),
    4
  ) AS raw_decimal,
  ROUND(
    SUM(r.amount_paid)::numeric / NULLIF(SUM(r.amount_due), 0) * 100,
    1
  ) AS display_pct
FROM repayment r
JOIN loan_account l ON l.id = r.loan_account_id
WHERE l.subsidiary_id = 'rukisha';

-- KPI 4: Default Rate (Blended)
-- Spec: loans with days_overdue > 90 / ALL loans (not just active)
-- App:  calculateDefaultRate → overdue count / total count, threshold = 90
SELECT
  'Rukisha: Default Rate (Blended)' AS kpi,
  COUNT(*) FILTER (WHERE days_overdue > 90) AS overdue_count,
  COUNT(*) AS total_count,
  ROUND(
    COUNT(*) FILTER (WHERE days_overdue > 90)::numeric
    / NULLIF(COUNT(*), 0),
    4
  ) AS raw_decimal,
  ROUND(
    COUNT(*) FILTER (WHERE days_overdue > 90)::numeric
    / NULLIF(COUNT(*), 0) * 100,
    1
  ) AS display_pct
FROM loan_account
WHERE subsidiary_id = 'rukisha';

-- KPI 4b: Default Rate by Product
-- Spec: Same formula, grouped by product
-- App:  calculateDefaultRateByProduct
SELECT
  'Rukisha: Default Rate by Product' AS kpi,
  product,
  COUNT(*) FILTER (WHERE days_overdue > 90) AS overdue_count,
  COUNT(*) AS total_count,
  ROUND(
    COUNT(*) FILTER (WHERE days_overdue > 90)::numeric
    / NULLIF(COUNT(*), 0) * 100,
    1
  ) AS display_pct
FROM loan_account
WHERE subsidiary_id = 'rukisha'
GROUP BY product
ORDER BY product;


-- ============================================================
-- §2  RUKISHA — Payments & Transfers
-- ============================================================

-- KPI 5: Transaction Volume
-- Spec: COUNT(*) of transactions
-- App:  calculateTransactionVolume → transactions.length
SELECT
  'Rukisha: Transaction Volume' AS kpi,
  COUNT(*) AS raw_value
FROM transaction
WHERE subsidiary_id = 'rukisha';

-- KPI 6: Transaction Value
-- Spec: SUM(amount)
-- App:  calculateTransactionValue → sum of t.amount
SELECT
  'Rukisha: Transaction Value' AS kpi,
  COALESCE(SUM(amount), 0) AS raw_value,
  'KES ' || TRIM(TO_CHAR(SUM(amount), '999,999,999,999')) AS formatted
FROM transaction
WHERE subsidiary_id = 'rukisha';

-- KPI 7: Active Wallets
-- Spec: COUNT(*) WHERE status = 'active'
-- App:  calculateActiveWallets → filter active, count
SELECT
  'Rukisha: Active Wallets' AS kpi,
  COUNT(*) AS raw_value
FROM wallet
WHERE subsidiary_id = 'rukisha'
  AND status = 'active';

-- KPI 8: Avg. Transaction Size
-- Spec: SUM(amount) / COUNT(*) = AVG(amount)
-- App:  calculateAvgTransactionSize → value / volume
SELECT
  'Rukisha: Avg Transaction Size' AS kpi,
  ROUND(AVG(amount)::numeric, 0) AS raw_value,
  'KES ' || TRIM(TO_CHAR(ROUND(AVG(amount)::numeric, 0), '999,999,999')) AS formatted
FROM transaction
WHERE subsidiary_id = 'rukisha';


-- ============================================================
-- §3  RUKISHA — Savings
-- ============================================================

-- KPI 9: Goal-Based Savings
-- Spec: SUM(balance) WHERE savings_type = 'goal_based'
-- App:  calculateGoalBasedSavings → filter goal_based, sum balance
SELECT
  'Rukisha: Goal-Based Savings' AS kpi,
  COALESCE(SUM(balance), 0) AS raw_value
FROM savings_account
WHERE subsidiary_id = 'rukisha'
  AND savings_type = 'goal_based';

-- KPI 10: Pension-Linked Savings (+ contributors)
-- Spec: SUM(balance) WHERE savings_type = 'pension_linked'; Contributors = COUNT(DISTINCT account_holder_id)
-- App:  calculatePensionLinkedSavings → {total, contributors}
SELECT
  'Rukisha: Pension-Linked Savings' AS kpi,
  COALESCE(SUM(balance), 0) AS total_balance,
  COUNT(DISTINCT account_holder_id) AS contributors
FROM savings_account
WHERE subsidiary_id = 'rukisha'
  AND savings_type = 'pension_linked';

-- KPI 11: Active Savers
-- Spec: COUNT(DISTINCT account_holder_id) across both savings types
-- App:  calculateActiveSavers → distinct accountHolderId across ALL savings
SELECT
  'Rukisha: Active Savers' AS kpi,
  COUNT(DISTINCT account_holder_id) AS raw_value
FROM savings_account
WHERE subsidiary_id = 'rukisha';

-- KPI 12: Savings-to-Loan Ratio
-- Spec: Total Savings / Portfolio Value (active loans)
-- App:  calculateSavingsToLoanRatio(goalBased + pensionLinked.total, portfolioValue)
WITH savings_total AS (
  SELECT COALESCE(SUM(balance), 0) AS total
  FROM savings_account
  WHERE subsidiary_id = 'rukisha'
),
portfolio AS (
  SELECT COALESCE(SUM(outstanding_balance), 0) AS value
  FROM loan_account
  WHERE subsidiary_id = 'rukisha'
    AND status = 'active'
)
SELECT
  'Rukisha: Savings-to-Loan Ratio' AS kpi,
  ROUND(s.total / NULLIF(p.value, 0), 2) AS ratio
FROM savings_total s, portfolio p;


-- ============================================================
-- §4  CPF FINANCIAL SERVICES — Pension Fund Administration
-- ============================================================

-- KPI 13: Member Contributions (period)
-- Spec: SUM(amount) from contribution rows for cpf_financial_services schemes
-- App:  calculateMemberContributions → sum of c.amount (no period filter)
SELECT
  'CPF FS: Member Contributions' AS kpi,
  COALESCE(SUM(amount), 0) AS raw_value
FROM contribution
WHERE pension_scheme_id IN (
  SELECT id FROM pension_scheme
  WHERE subsidiary_id = 'cpf_financial_services'
);

-- KPI 14: Fund Balance
-- Spec: Opening Balance + Contributions − Withdrawals + Investment Returns
-- App:  calculateFundBalance(17_900_000_000, contributions, withdrawals, 420_000_000)
-- Constants: OPENING_BALANCE = 17,900,000,000; INVESTMENT_RETURNS = 420,000,000
WITH c AS (
  SELECT COALESCE(SUM(amount), 0) AS total
  FROM contribution
  WHERE pension_scheme_id IN (
    SELECT id FROM pension_scheme
    WHERE subsidiary_id = 'cpf_financial_services'
  )
),
w AS (
  SELECT COALESCE(SUM(amount), 0) AS total
  FROM withdrawal
  WHERE pension_scheme_id IN (
    SELECT id FROM pension_scheme
    WHERE subsidiary_id = 'cpf_financial_services'
  )
)
SELECT
  'CPF FS: Fund Balance' AS kpi,
  c.total AS contributions,
  w.total AS withdrawals,
  17900000000 + c.total - w.total + 420000000 AS fund_balance
FROM c, w;

-- KPI 15: Active Schemes
-- Spec: COUNT(*) WHERE status = 'active'
-- App:  calculateActiveSchemes → filter active, count
SELECT
  'CPF FS: Active Schemes' AS kpi,
  COUNT(*) AS raw_value
FROM pension_scheme
WHERE subsidiary_id = 'cpf_financial_services'
  AND status = 'active';

-- KPI 16: Members
-- Spec: COUNT(DISTINCT member_id)
-- App:  calculateMembers → distinct memberId
SELECT
  'CPF FS: Members' AS kpi,
  COUNT(DISTINCT member_id) AS raw_value
FROM scheme_member
WHERE pension_scheme_id IN (
  SELECT id FROM pension_scheme
  WHERE subsidiary_id = 'cpf_financial_services'
);


-- ============================================================
-- §5  CPF FINANCIAL SERVICES — Trust Fund Administration
-- ============================================================

-- KPI 17: Assets Under Administration (AUA)
-- Spec: SUM(trust_asset_value) WHERE status = 'active'
-- App:  calculateAssetsUnderAdministration → filter active, sum trustAssetValue
SELECT
  'CPF FS: Assets Under Administration' AS kpi,
  COALESCE(SUM(trust_asset_value), 0) AS raw_value
FROM trust_account
WHERE subsidiary_id = 'cpf_financial_services'
  AND status = 'active';

-- KPI 18: Number of Trusts
-- Spec: COUNT(*) WHERE status = 'active'
-- App:  calculateNumberOfTrusts → filter active, count
SELECT
  'CPF FS: Number of Trusts' AS kpi,
  COUNT(*) AS raw_value
FROM trust_account
WHERE subsidiary_id = 'cpf_financial_services'
  AND status = 'active';

-- KPI 19: Trust Beneficiaries
-- Spec: COUNT(DISTINCT beneficiary_id) across ALL trusts for cpf_financial_services
-- App:  calculateTrustBeneficiaries → distinct beneficiaryId
-- Note: Neither app nor SQL filters to active trusts only for beneficiary count
SELECT
  'CPF FS: Trust Beneficiaries' AS kpi,
  COUNT(DISTINCT beneficiary_id) AS raw_value
FROM trust_beneficiary
WHERE trust_account_id IN (
  SELECT id FROM trust_account
  WHERE subsidiary_id = 'cpf_financial_services'
);

-- KPI 20: Trust Fund Growth
-- Spec: (current AUA − prior AUA) / prior AUA
-- App:  calculateTrustFundGrowth(aua, 8_950_000_000)
-- Constant: PRIOR_PERIOD_AUA = 8,950,000,000
WITH aua AS (
  SELECT COALESCE(SUM(trust_asset_value), 0) AS current_aua
  FROM trust_account
  WHERE subsidiary_id = 'cpf_financial_services'
    AND status = 'active'
)
SELECT
  'CPF FS: Trust Fund Growth' AS kpi,
  aua.current_aua,
  8950000000 AS prior_aua,
  ROUND(
    (aua.current_aua - 8950000000)::numeric / NULLIF(8950000000, 0),
    4
  ) AS raw_decimal,
  ROUND(
    (aua.current_aua - 8950000000)::numeric / NULLIF(8950000000, 0) * 100,
    1
  ) AS display_pct
FROM aua;


-- ============================================================
-- §6  CPF FINANCIAL SERVICES — Agency Services
-- ============================================================

-- KPI 21: Agency Transaction Value
-- Spec: SUM(amount) from agency_transaction
-- App:  calculateAgencyTransactionValue → sum of t.amount
SELECT
  'CPF FS: Agency Transaction Value' AS kpi,
  COALESCE(SUM(t.amount), 0) AS raw_value
FROM agency_transaction t
JOIN agency_mandate m ON m.id = t.agency_mandate_id
WHERE m.subsidiary_id = 'cpf_financial_services';

-- KPI 22: Agency Transaction Volume
-- Spec: COUNT(*) of agency_transaction
-- App:  calculateAgencyTransactionVolume → transactions.length
SELECT
  'CPF FS: Agency Transaction Volume' AS kpi,
  COUNT(*) AS raw_value
FROM agency_transaction t
JOIN agency_mandate m ON m.id = t.agency_mandate_id
WHERE m.subsidiary_id = 'cpf_financial_services';

-- KPI 23: Principals Served
-- Spec: COUNT(DISTINCT principal_id) from agency_mandate
-- App:  calculatePrincipalsServed → distinct principalId
SELECT
  'CPF FS: Principals Served' AS kpi,
  COUNT(DISTINCT principal_id) AS raw_value
FROM agency_mandate
WHERE subsidiary_id = 'cpf_financial_services';

-- KPI 24: Agency Fee Income
-- Spec: SUM(fee_amount) WHERE source = 'agency'
-- App:  calculateAgencyFeeIncome → filter source === 'agency', sum feeAmount
SELECT
  'CPF FS: Agency Fee Income' AS kpi,
  COALESCE(SUM(fee_amount), 0) AS raw_value
FROM fee_ledger
WHERE subsidiary_id = 'cpf_financial_services'
  AND source = 'agency';


-- ============================================================
-- §7  CPF CAPITAL & ADVISORY — Alternative Investments (REITs)
-- ============================================================

-- KPI 25: AUM in REIT Vehicles
-- Spec: SUM(unit_balance) × latest nav_per_unit
-- App:  calculateReitAum(holdings, latestNav) → totalUnits * latestNavPerUnit
WITH latest_nav AS (
  SELECT nav_per_unit
  FROM reit_nav_history
  WHERE subsidiary_id = 'cpf_capital_advisory'
  ORDER BY period DESC
  LIMIT 1
),
holdings AS (
  SELECT SUM(unit_balance) AS total_units
  FROM reit_holding
  WHERE subsidiary_id = 'cpf_capital_advisory'
)
SELECT
  'CPF C&A: AUM in REIT Vehicles' AS kpi,
  h.total_units,
  n.nav_per_unit,
  h.total_units * n.nav_per_unit AS reit_aum
FROM holdings h, latest_nav n;

-- KPI 26: Unit Holders
-- Spec: COUNT(DISTINCT holder_id)
-- App:  calculateUnitHolders → distinct holderId
SELECT
  'CPF C&A: Unit Holders' AS kpi,
  COUNT(DISTINCT holder_id) AS raw_value
FROM reit_holding
WHERE subsidiary_id = 'cpf_capital_advisory';

-- KPI 27: Unit NAV
-- Spec: Latest nav_per_unit (by period DESC)
-- App:  getLatestUnitNav → sort by period descending, take first
SELECT
  'CPF C&A: Unit NAV' AS kpi,
  nav_per_unit AS raw_value,
  period AS nav_period
FROM reit_nav_history
WHERE subsidiary_id = 'cpf_capital_advisory'
ORDER BY period DESC
LIMIT 1;

-- KPI 28: Distribution Yield (Annualized)
-- Spec: distribution_per_unit / unit_price (latest period)
-- App:  calculateDistributionYield(reitDistributions[0]) → distributionPerUnit / unitPrice
SELECT
  'CPF C&A: Distribution Yield' AS kpi,
  distribution_per_unit,
  unit_price,
  ROUND(
    distribution_per_unit::numeric / NULLIF(unit_price, 0),
    4
  ) AS raw_decimal,
  ROUND(
    distribution_per_unit::numeric / NULLIF(unit_price, 0) * 100,
    2
  ) AS display_pct,
  period
FROM reit_distribution
WHERE subsidiary_id = 'cpf_capital_advisory'
ORDER BY period DESC
LIMIT 1;


-- ============================================================
-- §8  CPF CAPITAL & ADVISORY — Structured & Project Finance
-- ============================================================

-- KPI 29: Deal Count (YTD)
-- Spec: COUNT(*) WHERE deal_type = 'structured_finance' AND close_date >= '2026-01-01'
-- App:  calculateDealCountYtd → deals.length (query pre-filters)
SELECT
  'CPF C&A: Deal Count (YTD)' AS kpi,
  COUNT(*) AS raw_value
FROM deal
WHERE subsidiary_id = 'cpf_capital_advisory'
  AND deal_type = 'structured_finance'
  AND close_date >= '2026-01-01';

-- KPI 30: Deal Value (YTD)
-- Spec: SUM(deal_value) with same filters
-- App:  calculateDealValueYtd → sum of d.dealValue
SELECT
  'CPF C&A: Deal Value (YTD)' AS kpi,
  COALESCE(SUM(deal_value), 0) AS raw_value
FROM deal
WHERE subsidiary_id = 'cpf_capital_advisory'
  AND deal_type = 'structured_finance'
  AND close_date >= '2026-01-01';

-- KPI 31: Average Deal Size
-- Spec: Deal Value / Deal Count
-- App:  calculateAverageDealSize(dealValue, dealCount)
SELECT
  'CPF C&A: Average Deal Size' AS kpi,
  ROUND(AVG(deal_value)::numeric, 0) AS raw_value
FROM deal
WHERE subsidiary_id = 'cpf_capital_advisory'
  AND deal_type = 'structured_finance'
  AND close_date >= '2026-01-01';

-- KPI 32: Advisory Fee Income
-- Spec: SUM(advisory_fee) from deals
-- App:  calculateAdvisoryFeeIncome → sum of d.advisoryFee
SELECT
  'CPF C&A: Advisory Fee Income' AS kpi,
  COALESCE(SUM(advisory_fee), 0) AS raw_value
FROM deal
WHERE subsidiary_id = 'cpf_capital_advisory'
  AND deal_type = 'structured_finance'
  AND close_date >= '2026-01-01';


-- ============================================================
-- §9  CPF CAPITAL & ADVISORY — Debt Capital Markets (Sukuk/Bonds)
-- ============================================================

-- KPI 33: Issuance Count (YTD)
-- Spec: COUNT(*) WHERE issue_date >= '2026-01-01'
-- App:  calculateIssuanceCountYtd → issuances.length (query pre-filters)
SELECT
  'CPF C&A: Issuance Count (YTD)' AS kpi,
  COUNT(*) AS raw_value
FROM issuance
WHERE subsidiary_id = 'cpf_capital_advisory'
  AND issue_date >= '2026-01-01';

-- KPI 34: Issuance Value (YTD)
-- Spec: SUM(issuance_value)
-- App:  calculateIssuanceValueYtd → sum of i.issuanceValue
SELECT
  'CPF C&A: Issuance Value (YTD)' AS kpi,
  COALESCE(SUM(issuance_value), 0) AS raw_value
FROM issuance
WHERE subsidiary_id = 'cpf_capital_advisory'
  AND issue_date >= '2026-01-01';

-- KPI 35: Weighted Avg. Profit Rate
-- Spec: SUM(profit_rate × issuance_value) / SUM(issuance_value)
-- App:  calculateWeightedAvgProfitRate → weighted sum / total value
SELECT
  'CPF C&A: Weighted Avg Profit Rate' AS kpi,
  ROUND(
    SUM(profit_rate * issuance_value)::numeric
    / NULLIF(SUM(issuance_value), 0),
    4
  ) AS raw_decimal,
  ROUND(
    SUM(profit_rate * issuance_value)::numeric
    / NULLIF(SUM(issuance_value), 0) * 100,
    2
  ) AS display_pct
FROM issuance
WHERE subsidiary_id = 'cpf_capital_advisory'
  AND issue_date >= '2026-01-01';

-- KPI 36: Subscription Rate (per issuance — bullet chart)
-- Spec: amount_subscribed / amount_offered
-- App:  calculateSubscriptionRate → amountSubscribed / amountOffered
-- Dashboard shows latest issuance's rate as the headline tile + all in bullet chart
SELECT
  'CPF C&A: Subscription Rate' AS kpi,
  instrument_code,
  amount_subscribed,
  amount_offered,
  ROUND(
    amount_subscribed::numeric / NULLIF(amount_offered, 0),
    4
  ) AS raw_decimal,
  ROUND(
    amount_subscribed::numeric / NULLIF(amount_offered, 0) * 100,
    0
  ) AS display_pct
FROM issuance
WHERE subsidiary_id = 'cpf_capital_advisory'
  AND issue_date >= '2026-01-01'
ORDER BY issue_date;


-- ============================================================
-- §10  GROUP — Subsidiary Headline AUM + Active Clients
-- ============================================================

-- Rukisha Headline AUM = Portfolio Value + Goal-Based Savings + Pension-Linked Savings
-- Active Clients = Active Wallets
WITH rukisha_components AS (
  SELECT
    (SELECT COALESCE(SUM(outstanding_balance), 0)
       FROM loan_account
       WHERE subsidiary_id = 'rukisha' AND status = 'active'
    ) AS portfolio_value,
    (SELECT COALESCE(SUM(balance), 0)
       FROM savings_account
       WHERE subsidiary_id = 'rukisha' AND savings_type = 'goal_based'
    ) AS goal_based_savings,
    (SELECT COALESCE(SUM(balance), 0)
       FROM savings_account
       WHERE subsidiary_id = 'rukisha' AND savings_type = 'pension_linked'
    ) AS pension_linked_savings,
    (SELECT COUNT(*)
       FROM wallet
       WHERE subsidiary_id = 'rukisha' AND status = 'active'
    ) AS active_wallets
)
SELECT
  'Group: Rukisha' AS subsidiary,
  portfolio_value,
  goal_based_savings,
  pension_linked_savings,
  portfolio_value + goal_based_savings + pension_linked_savings AS headline_aum,
  active_wallets AS active_clients
FROM rukisha_components;

-- CPF Financial Services Headline AUM = Fund Balance + AUA (Trust)
-- Active Clients = Members
WITH cpffs_components AS (
  SELECT
    (SELECT COALESCE(SUM(trust_asset_value), 0)
       FROM trust_account
       WHERE subsidiary_id = 'cpf_financial_services' AND status = 'active'
    ) AS trust_aua,
    17900000000 AS opening_balance,
    420000000 AS investment_returns,
    (SELECT COALESCE(SUM(amount), 0)
       FROM contribution
       WHERE pension_scheme_id IN (
         SELECT id FROM pension_scheme
         WHERE subsidiary_id = 'cpf_financial_services')
    ) AS contributions,
    (SELECT COALESCE(SUM(amount), 0)
       FROM withdrawal
       WHERE pension_scheme_id IN (
         SELECT id FROM pension_scheme
         WHERE subsidiary_id = 'cpf_financial_services')
    ) AS withdrawals,
    (SELECT COUNT(DISTINCT member_id)
       FROM scheme_member
       WHERE pension_scheme_id IN (
         SELECT id FROM pension_scheme
         WHERE subsidiary_id = 'cpf_financial_services')
    ) AS members
)
SELECT
  'Group: CPF Financial Services' AS subsidiary,
  trust_aua,
  opening_balance + contributions - withdrawals + investment_returns AS fund_balance,
  trust_aua + (opening_balance + contributions - withdrawals + investment_returns) AS headline_aum,
  members AS active_clients
FROM cpffs_components;

-- CPF Capital & Advisory Headline AUM = REIT AUM + Deal Value (YTD) + Issuance Value (YTD)
-- Active Clients = Unit Holders
WITH cpfca_components AS (
  SELECT
    (SELECT SUM(h.unit_balance) * n.nav_per_unit
       FROM reit_holding h,
            (SELECT nav_per_unit FROM reit_nav_history
              WHERE subsidiary_id = 'cpf_capital_advisory'
              ORDER BY period DESC LIMIT 1) n
       WHERE h.subsidiary_id = 'cpf_capital_advisory'
       GROUP BY n.nav_per_unit
    ) AS reit_aum,
    (SELECT COALESCE(SUM(deal_value), 0)
       FROM deal
       WHERE subsidiary_id = 'cpf_capital_advisory'
         AND deal_type = 'structured_finance'
         AND close_date >= '2026-01-01'
    ) AS deal_value_ytd,
    (SELECT COALESCE(SUM(issuance_value), 0)
       FROM issuance
       WHERE subsidiary_id = 'cpf_capital_advisory'
         AND issue_date >= '2026-01-01'
    ) AS issuance_value_ytd,
    (SELECT COUNT(DISTINCT holder_id)
       FROM reit_holding
       WHERE subsidiary_id = 'cpf_capital_advisory'
    ) AS unit_holders
)
SELECT
  'Group: CPF Capital & Advisory' AS subsidiary,
  reit_aum,
  deal_value_ytd,
  issuance_value_ytd,
  reit_aum + deal_value_ytd + issuance_value_ytd AS headline_aum,
  unit_holders AS active_clients
FROM cpfca_components;


-- ============================================================
-- §11  GROUP — Combined Scorecard
-- ============================================================

WITH rukisha AS (
  SELECT
    (SELECT COALESCE(SUM(outstanding_balance), 0)
       FROM loan_account WHERE subsidiary_id = 'rukisha' AND status = 'active')
    + (SELECT COALESCE(SUM(balance), 0)
       FROM savings_account WHERE subsidiary_id = 'rukisha')
    AS headline_aum,
    (SELECT COUNT(*) FROM wallet
       WHERE subsidiary_id = 'rukisha' AND status = 'active')
    AS active_clients,
    (SELECT COALESCE(SUM(amount), 0) FROM transaction
       WHERE subsidiary_id = 'rukisha')
    AS transaction_value
),
cpffs AS (
  SELECT
    (SELECT COALESCE(SUM(trust_asset_value), 0)
       FROM trust_account WHERE subsidiary_id = 'cpf_financial_services'
         AND status = 'active')
    + 17900000000 + 420000000
    + (SELECT COALESCE(SUM(amount), 0) FROM contribution
         WHERE pension_scheme_id IN
          (SELECT id FROM pension_scheme WHERE subsidiary_id = 'cpf_financial_services'))
    - (SELECT COALESCE(SUM(amount), 0) FROM withdrawal
         WHERE pension_scheme_id IN
          (SELECT id FROM pension_scheme WHERE subsidiary_id = 'cpf_financial_services'))
    AS headline_aum,
    (SELECT COUNT(DISTINCT member_id) FROM scheme_member
       WHERE pension_scheme_id IN
        (SELECT id FROM pension_scheme WHERE subsidiary_id = 'cpf_financial_services'))
    AS active_clients,
    (SELECT COALESCE(SUM(amount), 0) FROM contribution
       WHERE pension_scheme_id IN
        (SELECT id FROM pension_scheme WHERE subsidiary_id = 'cpf_financial_services'))
    + (SELECT COALESCE(SUM(t.amount), 0) FROM agency_transaction t
         JOIN agency_mandate m ON m.id = t.agency_mandate_id
         WHERE m.subsidiary_id = 'cpf_financial_services')
    AS transaction_value
),
cpfca AS (
  SELECT
    (SELECT SUM(h.unit_balance) * n.nav_per_unit
       FROM reit_holding h,
            (SELECT nav_per_unit FROM reit_nav_history
              WHERE subsidiary_id = 'cpf_capital_advisory'
              ORDER BY period DESC LIMIT 1) n
       WHERE h.subsidiary_id = 'cpf_capital_advisory'
       GROUP BY n.nav_per_unit)
    + (SELECT COALESCE(SUM(deal_value), 0) FROM deal
         WHERE subsidiary_id = 'cpf_capital_advisory'
           AND deal_type = 'structured_finance' AND close_date >= '2026-01-01')
    + (SELECT COALESCE(SUM(issuance_value), 0) FROM issuance
         WHERE subsidiary_id = 'cpf_capital_advisory' AND issue_date >= '2026-01-01')
    AS headline_aum,
    (SELECT COUNT(DISTINCT holder_id) FROM reit_holding
       WHERE subsidiary_id = 'cpf_capital_advisory')
    AS active_clients,
    -- Per Phase 2 spec, Group Transaction/Deal Value SHOULD include C&A deal + issuance
    -- but the app implementation EXCLUDES these (see DISCREPANCY #1 in audit report)
    (SELECT COALESCE(SUM(deal_value), 0) FROM deal
       WHERE subsidiary_id = 'cpf_capital_advisory'
         AND deal_type = 'structured_finance' AND close_date >= '2026-01-01')
    + (SELECT COALESCE(SUM(issuance_value), 0) FROM issuance
         WHERE subsidiary_id = 'cpf_capital_advisory' AND issue_date >= '2026-01-01')
    AS transaction_value
)
SELECT
  'Group Scorecard' AS section,
  -- KPI: Total Group AUM/AUA
  r.headline_aum + f.headline_aum + c.headline_aum AS total_group_aum,
  -- KPI: Total Active Clients (simple sum, not deduplicated)
  r.active_clients + f.active_clients + c.active_clients AS total_active_clients,
  -- KPI: Group Transaction/Deal Value — AS THE APP CURRENTLY COMPUTES IT (excluding C&A)
  r.transaction_value + f.transaction_value AS app_transaction_value,
  -- KPI: Group Transaction/Deal Value — AS THE PHASE 2 SPEC DEFINES IT (including C&A)
  r.transaction_value + f.transaction_value + c.transaction_value AS spec_transaction_value,
  -- The difference
  c.transaction_value AS cpfca_excluded_amount
FROM rukisha r, cpffs f, cpfca c;


-- ============================================================
-- §12  GROUP — Connection / Flow (pension_link_summary)
-- ============================================================

SELECT
  'Group: Connection / Flow' AS section,
  period,
  linked_savers_count,
  ROUND(aum_deployed_pct * 100, 0) AS aum_deployed_pct_display,
  ROUND(returns_credited_pct * 100, 1) AS returns_credited_pct_display
FROM pension_link_summary
ORDER BY period DESC
LIMIT 1;


-- ============================================================
-- §13  Row Count Validation (free-tier ≤900 contract)
-- ============================================================

SELECT
  'Row Count Check' AS section,
  table_name,
  row_count,
  CASE WHEN row_count <= 900 THEN 'PASS' ELSE 'FAIL — exceeds 900' END AS status
FROM (
  SELECT 'loan_account' AS table_name, COUNT(*) AS row_count FROM loan_account
  UNION ALL SELECT 'repayment', COUNT(*) FROM repayment
  UNION ALL SELECT 'wallet', COUNT(*) FROM wallet
  UNION ALL SELECT 'transaction', COUNT(*) FROM transaction
  UNION ALL SELECT 'savings_account', COUNT(*) FROM savings_account
  UNION ALL SELECT 'pension_scheme', COUNT(*) FROM pension_scheme
  UNION ALL SELECT 'scheme_member', COUNT(*) FROM scheme_member
  UNION ALL SELECT 'contribution', COUNT(*) FROM contribution
  UNION ALL SELECT 'withdrawal', COUNT(*) FROM withdrawal
  UNION ALL SELECT 'trust_account', COUNT(*) FROM trust_account
  UNION ALL SELECT 'trust_beneficiary', COUNT(*) FROM trust_beneficiary
  UNION ALL SELECT 'agency_mandate', COUNT(*) FROM agency_mandate
  UNION ALL SELECT 'agency_transaction', COUNT(*) FROM agency_transaction
  UNION ALL SELECT 'fee_ledger', COUNT(*) FROM fee_ledger
  UNION ALL SELECT 'reit_holding', COUNT(*) FROM reit_holding
  UNION ALL SELECT 'reit_nav_history', COUNT(*) FROM reit_nav_history
  UNION ALL SELECT 'reit_distribution', COUNT(*) FROM reit_distribution
  UNION ALL SELECT 'deal', COUNT(*) FROM deal
  UNION ALL SELECT 'issuance', COUNT(*) FROM issuance
  UNION ALL SELECT 'pension_link_summary', COUNT(*) FROM pension_link_summary
) counts
ORDER BY table_name;


-- ============================================================
-- §14  Referential Integrity Spot-Checks
-- ============================================================

-- Orphaned repayments (loan_account_id not in loan_account)
SELECT
  'Orphaned repayments' AS check_name,
  COUNT(*) AS orphan_count
FROM repayment r
WHERE NOT EXISTS (
  SELECT 1 FROM loan_account l WHERE l.id = r.loan_account_id
);

-- Orphaned scheme_member (pension_scheme_id not in pension_scheme)
SELECT
  'Orphaned scheme_member' AS check_name,
  COUNT(*) AS orphan_count
FROM scheme_member sm
WHERE NOT EXISTS (
  SELECT 1 FROM pension_scheme ps WHERE ps.id = sm.pension_scheme_id
);

-- Orphaned contributions (pension_scheme_id not in pension_scheme)
SELECT
  'Orphaned contributions' AS check_name,
  COUNT(*) AS orphan_count
FROM contribution c
WHERE NOT EXISTS (
  SELECT 1 FROM pension_scheme ps WHERE ps.id = c.pension_scheme_id
);

-- Orphaned trust_beneficiary (trust_account_id not in trust_account)
SELECT
  'Orphaned trust_beneficiary' AS check_name,
  COUNT(*) AS orphan_count
FROM trust_beneficiary tb
WHERE NOT EXISTS (
  SELECT 1 FROM trust_account ta WHERE ta.id = tb.trust_account_id
);

-- Orphaned agency_transaction (agency_mandate_id not in agency_mandate)
SELECT
  'Orphaned agency_transactions' AS check_name,
  COUNT(*) AS orphan_count
FROM agency_transaction at2
WHERE NOT EXISTS (
  SELECT 1 FROM agency_mandate am WHERE am.id = at2.agency_mandate_id
);
