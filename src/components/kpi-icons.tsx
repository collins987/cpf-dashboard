import type { ComponentType } from "react";
import {
  TrendIcon,
  UsersIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  SwapIcon,
  CoinsIcon,
  WalletIcon,
  CalculatorIcon,
  TargetIcon,
  ShieldIcon,
  ScaleIcon,
  VaultIcon,
  ClipboardListIcon,
  BuildingIcon,
  ReceiptIcon,
  TagIcon,
  HandshakeIcon,
  DocumentIcon,
  PercentIcon,
  GlobeIcon,
  LayersIcon,
} from "./icons";

/**
 * KPI label -> themed icon, per the complete mapping table in
 * docs/Phase 5 - Development.docx §9.4. KPIs that share a theme (e.g. four
 * "banknotes" KPIs) deliberately reuse the same icon component (DRY) rather
 * than each getting a near-duplicate SVG.
 */
export const ICON_FOR_KPI: Record<string, ComponentType> = {
  "Portfolio Value": CoinsIcon,
  "Active Borrowers": UsersIcon,
  "Repayment Rate": CheckCircleIcon,
  "Default Rate (Blended)": AlertCircleIcon,
  "Transaction Volume": SwapIcon,
  "Transaction Value": CoinsIcon,
  "Active Wallets": WalletIcon,
  "Avg. Transaction Size": CalculatorIcon,
  "Goal-Based Savings": TargetIcon,
  "Pension-Linked Savings": ShieldIcon,
  "Active Savers": UsersIcon,
  "Savings-to-Loan Ratio": ScaleIcon,
  "Member Contributions (period)": CoinsIcon,
  "Fund Balance": VaultIcon,
  "Active Schemes": ClipboardListIcon,
  "Assets Under Administration": BuildingIcon,
  "Number of Trusts": BuildingIcon,
  "Trust Beneficiaries": UsersIcon,
  "Trust Fund Growth": TrendIcon,
  "Agency Transaction Value": CoinsIcon,
  "Agency Transaction Volume": SwapIcon,
  "Principals Served": UsersIcon,
  "Agency Fee Income": ReceiptIcon,
  "AUM in REIT Vehicles": BuildingIcon,
  "Unit Holders": UsersIcon,
  "Unit NAV": TagIcon,
  "Distribution Yield (Annualized)": TrendIcon,
  "Deal Count (YTD)": HandshakeIcon,
  "Deal Value (YTD)": CoinsIcon,
  "Average Deal Size": CalculatorIcon,
  "Advisory Fee Income": ReceiptIcon,
  "Issuance Count (YTD)": DocumentIcon,
  "Issuance Value (YTD)": CoinsIcon,
  "Weighted Avg. Profit Rate": PercentIcon,
  "Subscription Rate": CheckCircleIcon,
  "Total Group AUM/AUA": GlobeIcon,
  "Total Active Clients": UsersIcon,
  "Group Transaction/Deal Value": CoinsIcon,
  "Business Lines": LayersIcon,
};

/** Fallback for any KPI label not yet in the mapping (e.g. a future KPI). */
export const DEFAULT_KPI_ICON: ComponentType = TrendIcon;
