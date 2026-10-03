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
"""

from __future__ import annotations

import os
import random
import uuid
from datetime import date, timedelta

import pandas as pd
from dotenv import load_dotenv
from faker import Faker
from sqlalchemy import create_engine

load_dotenv()
fake = Faker()

RUKISHA = "rukisha"
CPF_FINANCIAL_SERVICES = "cpf_financial_services"
CPF_CAPITAL_ADVISORY = "cpf_capital_advisory"

TODAY = date(2026, 6, 30)
DEFAULT_OVERDUE_DAYS = 90


def _uid() -> str:
    return str(uuid.uuid4())


def _random_date_within(days_back: int) -> date:
    return TODAY - timedelta(days=random.randint(0, days_back))


# ---------------------------------------------------------------------------
# Rukisha
# ---------------------------------------------------------------------------


def generate_rukisha_loans(num_loans: int = 1200) -> pd.DataFrame:
    """Loan accounts across the three Rukisha lending products."""
    products = ["personal", "business", "asset_finance"]
    rows = []
    for _ in range(num_loans):
        days_overdue = random.choices(
            [0, random.randint(1, DEFAULT_OVERDUE_DAYS - 1), random.randint(DEFAULT_OVERDUE_DAYS, 400)],
            weights=[0.72, 0.24, 0.04],
        )[0]
        rows.append(
            {
                "id": _uid(),
                "subsidiary_id": RUKISHA,
                "borrower_id": _uid(),
                "product": random.choice(products),
                "outstanding_balance": round(random.uniform(5_000, 450_000), 2),
                "days_overdue": days_overdue,
                "status": "active",
            }
        )
    return pd.DataFrame(rows)


def generate_rukisha_repayments(loans: pd.DataFrame) -> pd.DataFrame:
    """A repayment schedule row per loan, with a realistic collection rate."""
    rows = []
    for loan_id in loans["id"]:
        amount_due = round(random.uniform(2_000, 40_000), 2)
        collected_fraction = random.choices([1.0, random.uniform(0.5, 0.99), 0.0], weights=[0.8, 0.15, 0.05])[0]
        rows.append(
            {
                "id": _uid(),
                "loan_account_id": loan_id,
                "amount_due": amount_due,
                "amount_paid": round(amount_due * collected_fraction, 2),
                "due_date": _random_date_within(180).isoformat(),
                "paid_date": _random_date_within(180).isoformat() if collected_fraction > 0 else None,
            }
        )
    return pd.DataFrame(rows)


def generate_rukisha_wallets(num_wallets: int = 412_000) -> pd.DataFrame:
    """Active-wallet rows. Kept small for a dummy dataset; scaled via num_wallets."""
    sample_size = min(num_wallets, 5_000)  # a representative sample, not the full population
    rows = [
        {
            "id": _uid(),
            "subsidiary_id": RUKISHA,
            "status": "active",
            "last_transaction_at": _random_date_within(30).isoformat(),
        }
        for _ in range(sample_size)
    ]
    return pd.DataFrame(rows)


def generate_rukisha_transactions(wallets: pd.DataFrame, num_transactions: int = 8_000) -> pd.DataFrame:
    rows = []
    wallet_ids = wallets["id"].tolist()
    for _ in range(num_transactions):
        rows.append(
            {
                "id": _uid(),
                "subsidiary_id": RUKISHA,
                "wallet_id": random.choice(wallet_ids),
                "type": random.choice(["merchant_payment", "transfer"]),
                "amount": round(random.uniform(100, 25_000), 2),
                "created_at": _random_date_within(30).isoformat(),
            }
        )
    return pd.DataFrame(rows)


def generate_rukisha_savings(num_savers: int = 5_000) -> pd.DataFrame:
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


def generate_pension_schemes(num_schemes: int = 142) -> pd.DataFrame:
    return pd.DataFrame(
        [{"id": _uid(), "subsidiary_id": CPF_FINANCIAL_SERVICES, "status": "active"} for _ in range(num_schemes)]
    )


def generate_scheme_members(schemes: pd.DataFrame, avg_members_per_scheme: int = 680) -> pd.DataFrame:
    rows = []
    for scheme_id in schemes["id"]:
        for _ in range(random.randint(int(avg_members_per_scheme * 0.5), int(avg_members_per_scheme * 1.5))):
            rows.append({"id": _uid(), "pension_scheme_id": scheme_id, "member_id": _uid()})
    return pd.DataFrame(rows)


def generate_contributions(schemes: pd.DataFrame, period: str = "2026-06") -> pd.DataFrame:
    return pd.DataFrame(
        [
            {
                "id": _uid(),
                "pension_scheme_id": scheme_id,
                "amount": round(random.uniform(500_000, 12_000_000), 2),
                "period": period,
            }
            for scheme_id in schemes["id"]
        ]
    )


def generate_withdrawals(schemes: pd.DataFrame, period: str = "2026-06") -> pd.DataFrame:
    return pd.DataFrame(
        [
            {
                "id": _uid(),
                "pension_scheme_id": scheme_id,
                "amount": round(random.uniform(0, 3_000_000), 2),
                "period": period,
            }
            for scheme_id in schemes["id"]
            if random.random() < 0.6  # not every scheme has a withdrawal this period
        ]
    )


def generate_trust_accounts(num_trusts: int = 58) -> pd.DataFrame:
    return pd.DataFrame(
        [
            {
                "id": _uid(),
                "subsidiary_id": CPF_FINANCIAL_SERVICES,
                "trust_asset_value": round(random.uniform(20_000_000, 400_000_000), 2),
                "status": "active",
            }
            for _ in range(num_trusts)
        ]
    )


def generate_trust_beneficiaries(trusts: pd.DataFrame, avg_beneficiaries: int = 63) -> pd.DataFrame:
    rows = []
    for trust_id in trusts["id"]:
        for _ in range(random.randint(10, avg_beneficiaries * 2)):
            rows.append({"id": _uid(), "trust_account_id": trust_id, "beneficiary_id": _uid()})
    return pd.DataFrame(rows)


def generate_agency_mandates(num_principals: int = 24) -> pd.DataFrame:
    return pd.DataFrame(
        [{"id": _uid(), "subsidiary_id": CPF_FINANCIAL_SERVICES, "principal_id": _uid()} for _ in range(num_principals)]
    )


def generate_agency_transactions(mandates: pd.DataFrame, avg_per_mandate: int = 3_590) -> pd.DataFrame:
    rows = []
    for mandate_id in mandates["id"]:
        for _ in range(random.randint(int(avg_per_mandate * 0.7), int(avg_per_mandate * 1.3))):
            rows.append(
                {
                    "id": _uid(),
                    "agency_mandate_id": mandate_id,
                    "amount": round(random.uniform(1_000, 150_000), 2),
                    "created_at": _random_date_within(90).isoformat(),
                }
            )
    return pd.DataFrame(rows)


def generate_fee_ledger(num_entries: int = 400, period: str = "2026-06") -> pd.DataFrame:
    return pd.DataFrame(
        [
            {
                "id": _uid(),
                "subsidiary_id": CPF_FINANCIAL_SERVICES,
                "source": "agency",
                "fee_amount": round(random.uniform(10_000, 800_000), 2),
                "period": period,
            }
            for _ in range(num_entries)
        ]
    )


# ---------------------------------------------------------------------------
# CPF Capital & Advisory
# ---------------------------------------------------------------------------


def generate_reit_holdings(num_holders: int = 3_120) -> pd.DataFrame:
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


def generate_deals(num_deals: int = 7) -> pd.DataFrame:
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
# Orchestration: generate everything, then load it
# ---------------------------------------------------------------------------


def generate_all() -> dict[str, pd.DataFrame]:
    """Builds every table's dummy dataset. One parameterized function per table."""
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
            print(f"Loaded {len(frame):>6} rows into {table_name}")


if __name__ == "__main__":
    data = generate_all()
    load_to_postgres(data)
