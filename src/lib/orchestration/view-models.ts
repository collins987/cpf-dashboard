/** Shapes the Orchestration layer hands to the UI layer — never raw rows. */

export interface Kpi {
  label: string;
  value: string;
  deltaLabel: string;
  deltaDirection: "up" | "down" | "flat";
  note?: string;
  exactValue?: string;
}

export interface TrendSeries {
  label: string;
  color: "rukisha" | "cpffs" | "cpfca";
  rawValues: number[]; // actual metric values per bucket — Recharts scales automatically
  monthLabels: string[];
  latestValueLabel: string;
  quarterBoundaryLabel?: string; // if set, draw a vertical boundary line at this X-axis label
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
