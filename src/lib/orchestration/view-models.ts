/** Shapes the Orchestration layer hands to the UI layer — never raw rows. */

export interface Kpi {
  label: string;
  value: string;
  deltaLabel: string;
  deltaDirection: "up" | "down" | "flat";
  note?: string;
  exactValue?: string;
  /**
   * Real period-over-period delta, present only for KPIs whose backing table
   * has a genuine date column (see docs/Phase 5 - Development.docx §9.5).
   * When present, the active Period selector drives deltaLabel/deltaDirection
   * for real; when absent, deltaLabel/deltaDirection above remain the
   * documented static placeholder.
   */
  byPeriodDelta?: Record<
    "MoM" | "QoQ" | "YTD",
    { deltaLabel: string; deltaDirection: "up" | "down" | "flat" }
  >;
}

export interface TrendSeries {
  /** Base label (no period prefix), e.g. "Transaction Value (KES M)". */
  label: string;
  color: "rukisha" | "cpffs" | "cpfca";
  points: number[]; // 6 points, already scaled 0-100 for the sparkline
  monthLabels: string[];
  latestValueLabel: string;
  /**
   * When present, the trend is backed by real dated rows: title/summary
   * genuinely change per MoM/QoQ/YTD selection (see monthly-trend.ts).
   * When absent, the series is an illustrative placeholder (the backing
   * table has no date column yet) — label/latestValueLabel stay fixed.
   */
  byPeriod?: Record<"MoM" | "QoQ" | "YTD", { titlePrefix: string; latestValueLabel: string }>;
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
