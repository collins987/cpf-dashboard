/** Shapes the Orchestration layer hands to the UI layer — never raw rows. */

export interface Kpi {
  label: string;
  value: string;
  deltaLabel: string;
  deltaDirection: "up" | "down" | "flat";
  note?: string;
  exactValue?: string;
}

export interface QoQChartSide {
  rawValues: number[];
  monthLabels: string[];
  title: string; // e.g. "Q3 2026 — Prior Quarter"
  dateRangeLabel: string; // e.g. "Jul 1 – Sep 30, 2026 (Completed)"
  allQuarterMonthLabels?: string[]; // current-quarter side only: all 3 month labels for X-axis padding
}

export interface TrendSeries {
  label: string;
  color: "rukisha" | "cpffs" | "cpfca";
  rawValues: number[]; // actual metric values per bucket — Recharts scales automatically
  monthLabels: string[];
  latestValueLabel: string;
  quarterBoundaryLabel?: string;
  qoqPair?: { prior: QoQChartSide; current: QoQChartSide };
}

export interface BulletRow {
  name: string;
  code: string;
  percentOfTarget: number; // 0-100, fill width
  valueLabel: string;
  onTarget: boolean;
}

export interface Pillar {
  title: string;
  kpis: Kpi[];
  trend?: TrendSeries;
  bullets?: BulletRow[];
}

export interface SubsidiaryView {
  tag: string;
  subtitle: string;
  pillars: Pillar[];
}

export interface SnapshotCard {
  name: string;
  color: "rukisha" | "cpffs" | "cpfca";
  headlineAum: string;
  activeClients: string;
  deltaLabel: string;
  headlineAumCalc: string;
  activeClientsCalc: string;
}

export interface FlowCard {
  name: string;
  color: "rukisha" | "cpffs" | "cpfca";
  statLabel: string;
  statValue: string;
  description: string;
}

export interface ScoreTile {
  label: string;
  value: string;
  note: string;
}

export interface GroupView {
  snapshot: SnapshotCard[];
  flow: FlowCard[];
  scorecard: ScoreTile[];
}

export interface SubsidiaryTotals {
  headlineAum: number;
  activeClients: number;
  transactionValue?: number;
}
