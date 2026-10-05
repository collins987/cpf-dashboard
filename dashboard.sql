-- ============================================================
--  CPF Dashboard — verification queries
--  Run each block, compare to the matching tile on the dashboard.
--  Formulas mirror src/lib/calculations/* exactly.
-- ============================================================


-- ---------- RUKISHA — Lending ----------
SELECT
  -- Portfolio Value: sum of outstanding_balance for ACTIVE loans
  SUM(outstanding_balance) FILTER (WHERE status = 'active')              AS portfolio_value,

  -- Active Borrowers: distinct borrowers on active loans
  COUNT(DISTINCT borrower_id) FILTER (WHERE status = 'active')           AS active_borrowers,

  -- Default Rate (blended): loans with days_overdue > 90 / ALL loans
  ROUND(
    COUNT(*) FILTER (WHERE days_overdue > 90)::numeric
    / NULLIF(COUNT(*), 0) * 100, 1
  ) AS default_rate_pct
FROM loan_account
WHERE subsidiary_id = 'rukisha';

-- Default Rate by product (Personal / Business / Asset Finance)
SELECT product,
       ROUND(COUNT(*) FILTER (WHERE days_overdue > 90)::numeric
             / NULLIF(COUNT(*), 0) * 100, 1) AS default_rate_pct
FROM loan_account
WHERE subsidiary_id = 'rukisha'
GROUP BY product
ORDER BY product;

-- Repayment Rate: sum(amount_paid) / sum(amount_due) across repayments on Rukisha loans
SELECT ROUND(SUM(r.amount_paid)::numeric / NULLIF(SUM(r.amount_due), 0) * 100, 1)
         AS repayment_rate_pct
FROM repayment r
JOIN loan_account l ON l.id = r.loan_account_id
WHERE l.subsidiary_id = 'rukisha';


-- ---------- RUKISHA — Payments & Transfers ----------
SELECT
  COUNT(*)                                                 AS transaction_volume,
  SUM(amount)                                              AS transaction_value,
  ROUND(AVG(amount)::numeric, 0)                           AS avg_transaction_size,
  (SELECT COUNT(*) FROM wallet
    WHERE subsidiary_id = 'rukisha' AND status = 'active') AS active_wallets
FROM transaction
WHERE subsidiary_id = 'rukisha';


-- ---------- RUKISHA — Savings ----------
SELECT savings_type,
       SUM(balance)                      AS total_balance,
       COUNT(DISTINCT account_holder_id) AS contributors
FROM savings_account
WHERE subsidiary_id = 'rukisha'
GROUP BY savings_type;

-- Active Savers (distinct across both savings types) + Savings-to-Loan Ratio
WITH savings AS (
  SELECT COUNT(DISTINCT account_holder_id) AS active_savers,
         SUM(balance)                      AS total_savings
  FROM savings_account WHERE subsidiary_id = 'rukisha'
),
loans AS (
  SELECT SUM(outstanding_balance) AS portfolio_value
  FROM loan_account
  WHERE subsidiary_id = 'rukisha' AND status = 'active'
)
SELECT s.active_savers,
       ROUND(s.total_savings / NULLIF(l.portfolio_value, 0), 2) AS savings_to_loan_ratio
FROM savings s, loans l;


-- ---------- CPF FINANCIAL SERVICES — Pension Fund Administration ----------
-- Member Contributions, Fund Balance, Active Schemes, Members.
-- Fund Balance = 17_900_000_000 (opening) + contributions - withdrawals + 420_000_000 (returns).
WITH c AS (
  SELECT COALESCE(SUM(amount), 0) AS total_contributions
  FROM contribution
  WHERE pension_scheme_id IN (SELECT id FROM pension_scheme
                               WHERE subsidiary_id = 'cpf_financial_services')
),
w AS (
  SELECT COALESCE(SUM(amount), 0) AS total_withdrawals
  FROM withdrawal
  WHERE pension_scheme_id IN (SELECT id FROM pension_scheme
                               WHERE subsidiary_id = 'cpf_financial_services')
)
SELECT
  c.total_contributions                                                             AS member_contributions,
  17900000000 + c.total_contributions - w.total_withdrawals + 420000000             AS fund_balance,
  (SELECT COUNT(*) FROM pension_scheme
     WHERE subsidiary_id = 'cpf_financial_services' AND status = 'active')          AS active_schemes,
  (SELECT COUNT(DISTINCT member_id) FROM scheme_member
     WHERE pension_scheme_id IN (SELECT id FROM pension_scheme
                                  WHERE subsidiary_id = 'cpf_financial_services')) AS members
FROM c, w;


-- ---------- CPF FINANCIAL SERVICES — Trust Fund Administration ----------
-- AUA, # Trusts, # Beneficiaries, Trust Fund Growth (vs 8_950_000_000 prior).
WITH aua AS (
  SELECT SUM(trust_asset_value) AS current_aua,
         COUNT(*)               AS num_trusts
  FROM trust_account
  WHERE subsidiary_id = 'cpf_financial_services' AND status = 'active'
)
SELECT
  aua.current_aua,
  aua.num_trusts,
  (SELECT COUNT(DISTINCT beneficiary_id) FROM trust_beneficiary
     WHERE trust_account_id IN (SELECT id FROM trust_account
                                 WHERE subsidiary_id = 'cpf_financial_services')) AS trust_beneficiaries,
  ROUND((aua.current_aua - 8950000000)::numeric / 8950000000 * 100, 1)            AS trust_fund_growth_pct
FROM aua;


-- ---------- CPF FINANCIAL SERVICES — Agency Services ----------
SELECT
  SUM(t.amount)                                 AS agency_transaction_value,
  COUNT(*)                                      AS agency_transaction_volume,
  (SELECT COUNT(DISTINCT principal_id) FROM agency_mandate
     WHERE subsidiary_id = 'cpf_financial_services') AS principals_served,
  (SELECT SUM(fee_amount) FROM fee_ledger
     WHERE subsidiary_id = 'cpf_financial_services' AND source = 'agency') AS agency_fee_income
FROM agency_transaction t
JOIN agency_mandate m ON m.id = t.agency_mandate_id
WHERE m.subsidiary_id = 'cpf_financial_services';


-- ---------- CPF CAPITAL & ADVISORY — REITs ----------
-- AUM = sum(unit_balance) * latest nav_per_unit; Unit NAV = latest nav_per_unit.
WITH latest_nav AS (
  SELECT nav_per_unit
  FROM reit_nav_history
  WHERE subsidiary_id = 'cpf_capital_advisory'
  ORDER BY period DESC
  LIMIT 1
),
holdings AS (
  SELECT SUM(unit_balance)             AS total_units,
         COUNT(DISTINCT holder_id)     AS unit_holders
  FROM reit_holding
  WHERE subsidiary_id = 'cpf_capital_advisory'
),
dist AS (
  SELECT distribution_per_unit, unit_price
  FROM reit_distribution
  WHERE subsidiary_id = 'cpf_capital_advisory'
  ORDER BY period DESC
  LIMIT 1
)
SELECT
  holdings.total_units * latest_nav.nav_per_unit                       AS reit_aum,
  holdings.unit_holders,
  latest_nav.nav_per_unit                                              AS unit_nav,
  ROUND(dist.distribution_per_unit / NULLIF(dist.unit_price, 0) * 100, 2)
                                                                       AS distribution_yield_pct
FROM holdings, latest_nav, dist;


-- ---------- CPF CAPITAL & ADVISORY — Structured Finance (YTD 2026) ----------
SELECT
  COUNT(*)                                            AS deal_count_ytd,
  SUM(deal_value)                                     AS deal_value_ytd,
  ROUND(AVG(deal_value)::numeric, 0)                  AS average_deal_size,
  SUM(advisory_fee)                                   AS advisory_fee_income
FROM deal
WHERE subsidiary_id = 'cpf_capital_advisory'
  AND deal_type = 'structured_finance'
  AND close_date >= '2026-01-01';


-- ---------- CPF CAPITAL & ADVISORY — Issuances (YTD 2026) ----------
SELECT
  COUNT(*)                                                                   AS issuance_count_ytd,
  SUM(issuance_value)                                                        AS issuance_value_ytd,
  ROUND(SUM(profit_rate * issuance_value)::numeric
        / NULLIF(SUM(issuance_value), 0) * 100, 2)                           AS weighted_avg_profit_rate_pct
FROM issuance
WHERE subsidiary_id = 'cpf_capital_advisory'
  AND issue_date >= '2026-01-01';

-- Per-issuance subscription rate (bullet chart on the dashboard)
SELECT instrument_code,
       ROUND(amount_subscribed::numeric / NULLIF(amount_offered, 0) * 100, 0)
         AS subscription_rate_pct
FROM issuance
WHERE subsidiary_id = 'cpf_capital_advisory'
  AND issue_date >= '2026-01-01'
ORDER BY issue_date;


-- ---------- GROUP VIEW — Snapshot + Scorecard ----------
-- Headline AUM per subsidiary = sum of its component values.
WITH rukisha AS (
  SELECT
    (SELECT COALESCE(SUM(outstanding_balance), 0)
       FROM loan_account WHERE subsidiary_id='rukisha' AND status='active')
    + (SELECT COALESCE(SUM(balance), 0)
       FROM savings_account WHERE subsidiary_id='rukisha')               AS headline_aum,
    (SELECT COUNT(*) FROM wallet
       WHERE subsidiary_id='rukisha' AND status='active')                AS active_clients,
    (SELECT COALESCE(SUM(amount), 0) FROM transaction
       WHERE subsidiary_id='rukisha')                                    AS transaction_value
),
cpffs AS (
  SELECT
    (SELECT COALESCE(SUM(trust_asset_value), 0)
       FROM trust_account WHERE subsidiary_id='cpf_financial_services'
         AND status='active')
    + 17900000000 + 420000000
    + (SELECT COALESCE(SUM(amount), 0) FROM contribution
         WHERE pension_scheme_id IN
          (SELECT id FROM pension_scheme WHERE subsidiary_id='cpf_financial_services'))
    - (SELECT COALESCE(SUM(amount), 0) FROM withdrawal
         WHERE pension_scheme_id IN
          (SELECT id FROM pension_scheme WHERE subsidiary_id='cpf_financial_services')) AS headline_aum,
    (SELECT COUNT(DISTINCT member_id) FROM scheme_member
       WHERE pension_scheme_id IN
        (SELECT id FROM pension_scheme WHERE subsidiary_id='cpf_financial_services')) AS active_clients,
    (SELECT COALESCE(SUM(amount), 0) FROM contribution
       WHERE pension_scheme_id IN
        (SELECT id FROM pension_scheme WHERE subsidiary_id='cpf_financial_services'))
    + (SELECT COALESCE(SUM(t.amount), 0) FROM agency_transaction t
         JOIN agency_mandate m ON m.id = t.agency_mandate_id
         WHERE m.subsidiary_id='cpf_financial_services')                    AS transaction_value
),
cpfca AS (
  SELECT
    (SELECT SUM(h.unit_balance) * n.nav_per_unit
       FROM reit_holding h,
            (SELECT nav_per_unit FROM reit_nav_history
              WHERE subsidiary_id='cpf_capital_advisory'
              ORDER BY period DESC LIMIT 1) n
       WHERE h.subsidiary_id='cpf_capital_advisory'
       GROUP BY n.nav_per_unit)
    + (SELECT COALESCE(SUM(deal_value), 0) FROM deal
         WHERE subsidiary_id='cpf_capital_advisory'
           AND deal_type='structured_finance' AND close_date >= '2026-01-01')
    + (SELECT COALESCE(SUM(issuance_value), 0) FROM issuance
         WHERE subsidiary_id='cpf_capital_advisory' AND issue_date >= '2026-01-01') AS headline_aum,
    (SELECT COUNT(DISTINCT holder_id) FROM reit_holding
       WHERE subsidiary_id='cpf_capital_advisory')                                   AS active_clients
)
SELECT
  r.headline_aum          AS rukisha_aum,
  r.active_clients        AS rukisha_clients,
  f.headline_aum          AS cpffs_aum,
  f.active_clients        AS cpffs_clients,
  c.headline_aum          AS cpfca_aum,
  c.active_clients        AS cpfca_clients,
  (r.headline_aum + f.headline_aum + c.headline_aum)         AS total_group_aum,
  (r.active_clients + f.active_clients + c.active_clients)   AS total_active_clients,
  (r.transaction_value + f.transaction_value)                AS total_transaction_value
FROM rukisha r, cpffs f, cpfca c;


-- ---------- GROUP VIEW — Pension-link summary (flow row) ----------
SELECT period,
       linked_savers_count,
       ROUND(aum_deployed_pct * 100, 0)      AS aum_deployed_pct,
       ROUND(returns_credited_pct * 100, 1)  AS returns_credited_pct
FROM pension_link_summary
ORDER BY period DESC
LIMIT 1;
