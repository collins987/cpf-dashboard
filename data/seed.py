"""Dummy-data generation and loading for the CPF Group Analytics Dashboard.

Generates illustrative data for Rukisha, CPF Financial Services and
CPF Capital & Advisory (per the Phase 2 Analysis document) with pandas and
Faker, then loads it into Supabase Postgres via DATABASE_URL.

Against the schema defined in the Phase 3 Software Design Document, §5
Database Design. Every generator is a parameterized function (Core Design
Principles §5) — not a one-off hard-coded script — so the dataset size or
shape can change without editing the function body.

All figures are illustrative dummy data for demonstration purposes only,
per the Phase 1 Scope Note.

FREE-TIER DATA CONTRACT
========================
Every application table must remain below MAX_ROWS_PER_TABLE so the dataset
is fully retrievable through Supabase's default API response behaviour
(1 000-row limit) without pagination or increased max-rows settings.
"""

from __future__ import annotations

import os
import random
import sys
import uuid
from datetime import date, timedelta
from pathlib import Path

import pandas as pd
from dotenv import load_dotenv
from faker import Faker
from sqlalchemy import create_engine

load_dotenv(Path(__file__).resolve().parent.parent / ".env.local")
fake = Faker()

# ---------------------------------------------------------------------------
# Central configuration — Free-tier data contract
# ---------------------------------------------------------------------------

MAX_ROWS_PER_TABLE = 900
SEED = 42

RUKISHA = "rukisha"
CPF_FINANCIAL_SERVICES = "cpf_financial_services"
CPF_CAPITAL_ADVISORY = "cpf_capital_advisory"

TODAY = date(2026, 6, 30)
DEFAULT_OVERDUE_DAYS = 90

# Rukisha
NUM_LOANS = 850
NUM_WALLETS = 800
NUM_TRANSACTIONS = 850
NUM_SAVERS = 790

# CPF Financial Services
NUM_PENSION_SCHEMES = 42
AVG_MEMBERS_PER_SCHEME = 14       # worst-case 42 × 21 = 882
NUM_TRUST_ACCOUNTS = 30
AVG_BENEFICIARIES_PER_TRUST = 14  # worst-case 30 × 28 = 840
NUM_AGENCY_MANDATES = 12
AVG_TXNS_PER_MANDATE = 55         # worst-case 12 × 71 = 852
NUM_FEE_ENTRIES = 300

# CPF Capital & Advisory
NUM_REIT_HOLDERS = 650
NUM_DEALS = 7


def _uid() -> str:
    """UUID built from the seeded random module so generation is deterministic."""
    return str(uuid.UUID(int=random.getrandbits(128), version=4))


def _random_date_within(days_back: int) -> date:
    return TODAY - timedelta(days=random.randint(0, days_back))


# ---------------------------------------------------------------------------
# Rukisha
# ---------------------------------------------------------------------------


def generate_rukisha_loans(num_loans: int = NUM_LOANS) -> pd.DataFrame:
    """Loan accounts across the three Rukisha lending products.

    Generates a realistic mix of active, closed, and written-off loans with
    varying overdue days and outstanding balances.
    """
    products = ["personal", "business", "asset_finance"]
    rows = []
    for _ in range(num_loans):
        status_roll = random.random()
        if status_roll < 0.85:
            # Active loan — realistic overdue distribution
            status = "active"
            days_overdue = random.choices(
                [0, random.randint(1, DEFAULT_OVERDUE_DAYS - 1), random.randint(DEFAULT_OVERDUE_DAYS, 400)],
                weights=[0.72, 0.24, 0.04],
            )[0]
            outstanding_balance = round(random.uniform(5_000, 450_000), 2)
        elif status_roll < 0.95:
            # Closed loan — fully repaid
            status = "closed"
            days_overdue = 0
            outstanding_balance = 0
        else:
            # Written-off loan — bad debt
            status = "written_off"
            days_overdue = random.randint(DEFAULT_OVERDUE_DAYS, 400)
            outstanding_balance = round(random.uniform(5_000, 450_000), 2)

        rows.append(
            {
                "id": _uid(),
                "subsidiary_id": RUKISHA,
                "borrower_id": _uid(),
                "product": random.choice(products),
                "outstanding_balance": outstanding_balance,
                "days_overdue": days_overdue,
                "status": status,
            }
        )
    return pd.DataFrame(rows)


def generate_rukisha_repayments(loans: pd.DataFrame) -> pd.DataFrame:
    """One repayment-schedule row per loan with a realistic collection rate.

    Includes fully-paid, partially-paid, and unpaid repayments. Closed loans
    are always fully repaid; written-off loans always have zero repayment.
    """
    rows = []
    for _, loan in loans.iterrows():
        amount_due = round(random.uniform(2_000, 40_000), 2)

        if loan["status"] == "closed":
            collected_fraction = 1.0
        elif loan["status"] == "written_off":
            collected_fraction = 0.0
        else:
            collected_fraction = random.choices(
                [1.0, random.uniform(0.5, 0.99), 0.0],
                weights=[0.8, 0.15, 0.05],
            )[0]

        paid_date = _random_date_within(180).isoformat() if collected_fraction > 0 else None
        rows.append(
            {
                "id": _uid(),
                "loan_account_id": loan["id"],
                "amount_due": amount_due,
                "amount_paid": round(amount_due * collected_fraction, 2),
                "due_date": _random_date_within(180).isoformat(),
                "paid_date": paid_date,
            }
        )
    return pd.DataFrame(rows)


def generate_rukisha_wallets(num_wallets: int = NUM_WALLETS) -> pd.DataFrame:
    """Wallet rows with a realistic mix of active and dormant statuses."""
    rows = []
    for _ in range(num_wallets):
        is_active = random.random() < 0.75
        rows.append(
            {
                "id": _uid(),
                "subsidiary_id": RUKISHA,
                "status": "active" if is_active else "dormant",
                "last_transaction_at": (
                    _random_date_within(30).isoformat() if is_active
                    else _random_date_within(365).isoformat()
                ),
            }
        )
    return pd.DataFrame(rows)


def generate_rukisha_transactions(wallets: pd.DataFrame, num_transactions: int = NUM_TRANSACTIONS) -> pd.DataFrame:
    """Transactions referencing active wallets, with realistic type and amount mix."""
    active_wallet_ids = wallets[wallets["status"] == "active"]["id"].tolist()
    if not active_wallet_ids:
        active_wallet_ids = wallets["id"].tolist()
    rows = []
    for _ in range(num_transactions):
        rows.append(
            {
                "id": _uid(),
                "subsidiary_id": RUKISHA,
                "wallet_id": random.choice(active_wallet_ids),
                "type": random.choice(["merchant_payment", "transfer"]),
                "amount": round(random.uniform(100, 25_000), 2),
                "created_at": _random_date_within(30).isoformat(),
            }
        )
    return pd.DataFrame(rows)


def generate_rukisha_savings(num_savers: int = NUM_SAVERS) -> pd.DataFrame:
    """Savings accounts with a realistic goal-based / pension-linked split."""
    rows = []
    for _ in range(num_savers):
        savings_type = random.choices(["goal_based", "pension_linked"], weights=[0.65, 0.35])[0]
        rows.append(
            {
                "id": _uid(),
                "subsidiary_id": RUKISHA,
                "account_holder_id": _uid(),
                "savings_type": savings_type,
                "balance": round(random.uniform(500, 60_000), 2),
            }
        )
    return pd.DataFrame(rows)


# ---------------------------------------------------------------------------
# CPF Financial Services
# ---------------------------------------------------------------------------


def generate_pension_schemes(num_schemes: int = NUM_PENSION_SCHEMES) -> pd.DataFrame:
    """Pension schemes with a realistic active/closed mix."""
    rows = []
    for _ in range(num_schemes):
        rows.append(
            {
                "id": _uid(),
                "subsidiary_id": CPF_FINANCIAL_SERVICES,
                "status": "active" if random.random() < 0.90 else "closed",
            }
        )
    return pd.DataFrame(rows)


def generate_scheme_members(schemes: pd.DataFrame, avg_members_per_scheme: int = AVG_MEMBERS_PER_SCHEME) -> pd.DataFrame:
    """Members distributed across schemes with realistic variance."""
    rows = []
    lo = max(1, int(avg_members_per_scheme * 0.5))
    hi = int(avg_members_per_scheme * 1.5)
    for scheme_id in schemes["id"]:
        for _ in range(random.randint(lo, hi)):
            rows.append({"id": _uid(), "pension_scheme_id": scheme_id, "member_id": _uid()})
    return pd.DataFrame(rows)


def _trailing_periods(months: int = 6) -> list[str]:
    """The `months` calendar periods ("YYYY-MM") ending at TODAY's month —
    used so MoM/QoQ/YTD graphs (Phase 5 Extended UI Enhancements §9.7) have
    genuine multi-month data instead of a single hard-coded period."""
    periods = []
    for i in range(months - 1, -1, -1):
        y, m = TODAY.year, TODAY.month - i
        while m < 1:
            m += 12
            y -= 1
        periods.append(f"{y:04d}-{m:02d}")
    return periods


def generate_contributions(schemes: pd.DataFrame, periods: list[str] | None = None) -> pd.DataFrame:
    """One contribution per scheme per period, across the trailing months —
    real multi-period data (Phase 5 Extended UI Enhancements §9.7), not the
    single hard-coded "2026-06" this generator originally produced."""
    periods = periods or _trailing_periods()
    return pd.DataFrame(
        [
            {
                "id": _uid(),
                "pension_scheme_id": scheme_id,
                "amount": round(random.uniform(500_000, 12_000_000), 2),
                "period": period,
            }
            for period in periods
            for scheme_id in schemes["id"]
        ]
    )


def generate_withdrawals(schemes: pd.DataFrame, periods: list[str] | None = None) -> pd.DataFrame:
    """Withdrawals for ~60% of schemes, across the trailing months."""
    periods = periods or _trailing_periods()
    return pd.DataFrame(
        [
            {
                "id": _uid(),
                "pension_scheme_id": scheme_id,
                "amount": round(random.uniform(0, 3_000_000), 2),
                "period": period,
            }
            for period in periods
            for scheme_id in schemes["id"]
            if random.random() < 0.6
        ]
    )


def generate_trust_accounts(num_trusts: int = NUM_TRUST_ACCOUNTS) -> pd.DataFrame:
    """Trust accounts with a realistic active/closed mix."""
    rows = []
    for _ in range(num_trusts):
        rows.append(
            {
                "id": _uid(),
                "subsidiary_id": CPF_FINANCIAL_SERVICES,
                "trust_asset_value": round(random.uniform(20_000_000, 400_000_000), 2),
                "status": "active" if random.random() < 0.90 else "closed",
            }
        )
    return pd.DataFrame(rows)


def generate_trust_beneficiaries(trusts: pd.DataFrame, avg_beneficiaries: int = AVG_BENEFICIARIES_PER_TRUST) -> pd.DataFrame:
    """Beneficiaries distributed across trusts."""
    rows = []
    for trust_id in trusts["id"]:
        for _ in range(random.randint(10, avg_beneficiaries * 2)):
            rows.append({"id": _uid(), "trust_account_id": trust_id, "beneficiary_id": _uid()})
    return pd.DataFrame(rows)


def generate_agency_mandates(num_principals: int = NUM_AGENCY_MANDATES) -> pd.DataFrame:
    return pd.DataFrame(
        [{"id": _uid(), "subsidiary_id": CPF_FINANCIAL_SERVICES, "principal_id": _uid()} for _ in range(num_principals)]
    )


def generate_agency_transactions(mandates: pd.DataFrame, avg_per_mandate: int = AVG_TXNS_PER_MANDATE) -> pd.DataFrame:
    """Agency transactions distributed across mandates."""
    rows = []
    lo = int(avg_per_mandate * 0.7)
    hi = int(avg_per_mandate * 1.3)
    for mandate_id in mandates["id"]:
        for _ in range(random.randint(lo, hi)):
            rows.append(
                {
                    "id": _uid(),
                    "agency_mandate_id": mandate_id,
                    "amount": round(random.uniform(1_000, 150_000), 2),
                    "created_at": _random_date_within(90).isoformat(),
                }
            )
    return pd.DataFrame(rows)


def generate_fee_ledger(num_entries: int = NUM_FEE_ENTRIES, periods: list[str] | None = None) -> pd.DataFrame:
    """Fee entries spread evenly across the trailing months (same total row
    count as before — still within the <=900-rows-per-table cap)."""
    periods = periods or _trailing_periods()
    return pd.DataFrame(
        [
            {
                "id": _uid(),
                "subsidiary_id": CPF_FINANCIAL_SERVICES,
                "source": "agency",
                "fee_amount": round(random.uniform(10_000, 800_000), 2),
                "period": random.choice(periods),
            }
            for _ in range(num_entries)
        ]
    )


# ---------------------------------------------------------------------------
# CPF Capital & Advisory
# ---------------------------------------------------------------------------


def generate_reit_holdings(num_holders: int = NUM_REIT_HOLDERS) -> pd.DataFrame:
    return pd.DataFrame(
        [
            {
                "id": _uid(),
                "subsidiary_id": CPF_CAPITAL_ADVISORY,
                "holder_id": _uid(),
                "unit_balance": round(random.uniform(50, 20_000), 2),
            }
            for _ in range(num_holders)
        ]
    )


def generate_reit_nav_history(start_nav: float = 20.10, end_nav: float = 21.85, months: int = 6) -> pd.DataFrame:
    rows = []
    step = (end_nav - start_nav) / max(months - 1, 1)
    for i in range(months):
        period = (TODAY.replace(day=1) - timedelta(days=30 * (months - 1 - i))).strftime("%Y-%m")
        rows.append({"id": _uid(), "subsidiary_id": CPF_CAPITAL_ADVISORY, "period": period, "nav_per_unit": round(start_nav + step * i, 2)})
    return pd.DataFrame(rows)


def generate_reit_distributions(period: str = "2026-06") -> pd.DataFrame:
    return pd.DataFrame(
        [{"id": _uid(), "subsidiary_id": CPF_CAPITAL_ADVISORY, "period": period, "distribution_per_unit": 2.14, "unit_price": 21.85}]
    )


def generate_deals(num_deals: int = NUM_DEALS) -> pd.DataFrame:
    rows = []
    for _ in range(num_deals):
        deal_value = round(random.uniform(800_000_000, 4_200_000_000), 2)
        rows.append(
            {
                "id": _uid(),
                "subsidiary_id": CPF_CAPITAL_ADVISORY,
                "deal_type": "structured_finance",
                "deal_value": deal_value,
                "advisory_fee": round(deal_value * random.uniform(0.015, 0.03), 2),
                "close_date": _random_date_within(180).isoformat(),
            }
        )
    return pd.DataFrame(rows)


def generate_issuances() -> pd.DataFrame:
    """Three named Sukuk issuances, matching the dashboard's dummy reference figures."""
    issuances = [
        ("LNZ-SK-01", 2_100_000_000, 0.1090, 2_190_000_000, 2_100_000_000 * 0.96),
        ("LNZ-SK-02", 2_300_000_000, 0.1125, 2_300_000_000, 2_300_000_000 * 1.04),
        ("LNZ-SK-KDF", 2_400_000_000, 0.1150, 2_400_000_000, 2_400_000_000 * 1.18),
    ]
    rows = []
    for code, issuance_value, profit_rate, amount_offered, amount_subscribed in issuances:
        rows.append(
            {
                "id": _uid(),
                "subsidiary_id": CPF_CAPITAL_ADVISORY,
                "instrument_type": "sukuk",
                "instrument_code": code,
                "issuance_value": issuance_value,
                "profit_rate": profit_rate,
                "amount_offered": amount_offered,
                "amount_subscribed": round(amount_subscribed, 2),
                "issue_date": _random_date_within(150).isoformat(),
            }
        )
    return pd.DataFrame(rows)


# ---------------------------------------------------------------------------
# Group — Connection layer aggregate (ADR-0002: aggregate-level, not per-customer)
# ---------------------------------------------------------------------------


def generate_pension_link_summary(period: str = "2026-06") -> pd.DataFrame:
    return pd.DataFrame(
        [
            {
                "id": _uid(),
                "period": period,
                "linked_savers_pct": 0.396,
                "linked_savers_count": 38_200,
                "aum_deployed_pct": 0.22,
                "returns_credited_pct": 0.087,
            }
        ]
    )


# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------


def validate_tables(tables: dict[str, pd.DataFrame]) -> bool:
    """Validates that every application table stays within the free-tier limit.

    Prints a report and returns True if all tables pass.
    """
    print()
    print("=" * 48)
    print("CPF DASHBOARD SEED VALIDATION")
    print("=" * 48)
    print()

    max_count = 0
    all_pass = True

    for table_name, frame in sorted(tables.items()):
        count = len(frame)
        max_count = max(max_count, count)
        status = "PASS" if count <= MAX_ROWS_PER_TABLE else "FAIL"
        if status == "FAIL":
            all_pass = False
        print(f"  {table_name:<25} {count:>5}    {status}")

    print()
    print(f"  Maximum table size:  {max_count}")
    print(f"  Configured maximum:  {MAX_ROWS_PER_TABLE}")
    print()
    result = "PASS" if all_pass else "FAIL"
    print(f"  RESULT: {result}")
    print()
    print("=" * 48)
    print()

    return all_pass


# ---------------------------------------------------------------------------
# Orchestration: generate everything, then load it
# ---------------------------------------------------------------------------


def generate_all(seed: int = SEED) -> dict[str, pd.DataFrame]:
    """Builds every table's dummy dataset. One parameterized function per table.

    Uses a fixed random seed for deterministic, reproducible generation.
    """
    random.seed(seed)
    Faker.seed(seed)

    rukisha_loans = generate_rukisha_loans()
    rukisha_wallets = generate_rukisha_wallets()
    pension_schemes = generate_pension_schemes()
    trust_accounts = generate_trust_accounts()
    agency_mandates = generate_agency_mandates()
    reit_holdings = generate_reit_holdings()
    deals = generate_deals()

    return {
        "loan_account": rukisha_loans,
        "repayment": generate_rukisha_repayments(rukisha_loans),
        "wallet": rukisha_wallets,
        "transaction": generate_rukisha_transactions(rukisha_wallets),
        "savings_account": generate_rukisha_savings(),
        "pension_scheme": pension_schemes,
        "scheme_member": generate_scheme_members(pension_schemes),
        "contribution": generate_contributions(pension_schemes),
        "withdrawal": generate_withdrawals(pension_schemes),
        "trust_account": trust_accounts,
        "trust_beneficiary": generate_trust_beneficiaries(trust_accounts),
        "agency_mandate": agency_mandates,
        "agency_transaction": generate_agency_transactions(agency_mandates),
        "fee_ledger": generate_fee_ledger(),
        "reit_holding": reit_holdings,
        "reit_nav_history": generate_reit_nav_history(),
        "reit_distribution": generate_reit_distributions(),
        "deal": deals,
        "issuance": generate_issuances(),
        "pension_link_summary": generate_pension_link_summary(),
    }


def load_to_postgres(tables: dict[str, pd.DataFrame], database_url: str | None = None) -> None:
    """Loads every generated DataFrame into its matching table (replacing existing rows)."""
    database_url = database_url or os.environ["DATABASE_URL"]
    engine = create_engine(database_url)
    with engine.begin() as connection:
        for table_name, frame in tables.items():
            frame.to_sql(table_name, connection, if_exists="replace", index=False)
            print(f"  Loaded {len(frame):>5} rows into {table_name}")


if __name__ == "__main__":
    dry_run = "--dry-run" in sys.argv

    data = generate_all()

    if not validate_tables(data):
        print("ABORTING: one or more tables exceed MAX_ROWS_PER_TABLE.")
        sys.exit(1)

    if dry_run:
        print("Dry run — skipping database load.")
    else:
        load_to_postgres(data)
        print("Seed complete.")
