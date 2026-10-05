export interface RefreshMeta {
  refreshedAtLabel: string;
  lastUpdatedLabel: string;
  periodRanges: { MoM: string; QoQ: string; YTD: string };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

export function buildRefreshMeta(now: Date = new Date()): RefreshMeta {
  const eat = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  const day = eat.getUTCDate();
  const month = MONTHS[eat.getUTCMonth()];
  const year = eat.getUTCFullYear();
  const hhmm = `${pad(eat.getUTCHours())}:${pad(eat.getUTCMinutes())}`;

  const prev = new Date(Date.UTC(year, eat.getUTCMonth() - 1, 1));
  const prevMonth = MONTHS[prev.getUTCMonth()];
  const prevYear = prev.getUTCFullYear();

  const quarter = Math.floor(eat.getUTCMonth() / 3) + 1;
  const prevQuarter = quarter === 1 ? 4 : quarter - 1;
  const prevQuarterYear = quarter === 1 ? year - 1 : year;

  return {
    refreshedAtLabel: `${day} ${month} ${year}, ${hhmm} EAT`,
    lastUpdatedLabel: `${day} ${month} ${year}`,
    periodRanges: {
      MoM: `${month} ${year} vs ${prevMonth} ${prevYear}`,
      QoQ: `Q${quarter} ${year} vs Q${prevQuarter} ${prevQuarterYear}`,
      YTD: `Jan – ${month} ${year}`,
    },
  };
}
