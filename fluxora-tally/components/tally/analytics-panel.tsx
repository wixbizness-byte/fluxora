import { formatValue, parseNumber } from "../../lib/dashboard-utils";
import type { DailyCommissionPoint, DashboardState, TallyField } from "../../lib/types";

type Props = {
  dashboard: DashboardState;
  points: DailyCommissionPoint[];
};

type ChartPoint = DailyCommissionPoint & { x: number; y: number };

function totalField(dashboard: DashboardState, fieldId: string) {
  const field = dashboard.fields.find((item) => item.id === fieldId);
  if (!field) return { field: null, value: 0, formatted: "—" };
  const value = dashboard.accounts.reduce(
    (total, account) => total + (parseNumber(account.values[fieldId]) ?? 0),
    0,
  );
  return { field, value, formatted: formatValue(dashboard, String(value), field) };
}

function formatMoney(dashboard: DashboardState, value: number) {
  return `${dashboard.settings.currencySymbol}${value.toLocaleString("en-PH", {
    minimumFractionDigits: dashboard.settings.decimalPlaces,
    maximumFractionDigits: dashboard.settings.decimalPlaces,
  })}`;
}

function compactMoney(dashboard: DashboardState, value: number) {
  const absolute = Math.abs(value);
  if (absolute >= 1_000_000) return `${dashboard.settings.currencySymbol}${(value / 1_000_000).toFixed(1)}M`;
  if (absolute >= 1_000) return `${dashboard.settings.currencySymbol}${(value / 1_000).toFixed(1)}k`;
  return formatMoney(dashboard, value);
}

function dateLabel(date: string, includeYear = false) {
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    ...(includeYear ? { year: "numeric" as const } : {}),
    timeZone: "Asia/Manila",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function percentChange(today: number, baseline: number | null) {
  if (baseline === null || baseline === 0) return null;
  return ((today - baseline) / baseline) * 100;
}

function fieldCard(
  label: string,
  metric: ReturnType<typeof totalField>,
  helper: string,
  trend?: number | null,
) {
  return { label, value: metric.formatted, helper, trend };
}

function chartGeometry(points: DailyCommissionPoint[], width = 820, height = 300) {
  const left = 58;
  const right = 18;
  const top = 20;
  const bottom = 38;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const values = points.flatMap((point) => point.commission === null ? [] : [point.commission]);
  const max = Math.max(1, ...values);
  const ceiling = max * 1.15;
  const xFor = (index: number) => left + (points.length <= 1 ? 0 : (index / (points.length - 1)) * plotWidth);
  const yFor = (value: number) => top + plotHeight - (value / ceiling) * plotHeight;
  const mapped = points.map((point, index) => point.commission === null ? null : ({ ...point, x: xFor(index), y: yFor(point.commission) })) as Array<ChartPoint | null>;

  const segments: ChartPoint[][] = [];
  let segment: ChartPoint[] = [];
  mapped.forEach((point) => {
    if (point) segment.push(point);
    else if (segment.length) { segments.push(segment); segment = []; }
  });
  if (segment.length) segments.push(segment);

  const grid = [0, .25, .5, .75, 1].map((ratio) => ({
    y: top + plotHeight - ratio * plotHeight,
    value: ceiling * ratio,
  }));

  return { width, height, left, right, top, bottom, plotWidth, plotHeight, ceiling, mapped, segments, grid };
}

function AnalyticsChart({ dashboard, points }: Props) {
  const geometry = chartGeometry(points);
  const today = geometry.mapped.at(-1);
  const labelIndexes = Array.from(new Set([0, 6, 12, 18, 24, Math.max(0, points.length - 1)]));

  return <div className="analytics-chart-wrap">
    <svg className="analytics-chart" viewBox={`0 0 ${geometry.width} ${geometry.height}`} role="img" aria-label="Daily commission over the last 30 days">
      <g className="chart-grid">
        {geometry.grid.map((line) => <g key={line.y}>
          <line x1={geometry.left} x2={geometry.width - geometry.right} y1={line.y} y2={line.y} />
          <text x={geometry.left - 10} y={line.y + 4} textAnchor="end">{compactMoney(dashboard, line.value)}</text>
        </g>)}
      </g>

      {geometry.segments.map((segment, index) => {
        const path = segment.map((point, pointIndex) => `${pointIndex ? "L" : "M"}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
        const area = segment.length > 1
          ? `${path} L${segment.at(-1)!.x.toFixed(1)},${geometry.top + geometry.plotHeight} L${segment[0].x.toFixed(1)},${geometry.top + geometry.plotHeight} Z`
          : "";
        return <g key={index}>
          {area ? <path className="chart-area" d={area} /> : null}
          <path className="chart-line" d={path} />
        </g>;
      })}

      <g className="chart-points">
        {geometry.mapped.map((point, index) => point ? <circle key={point.date} cx={point.x} cy={point.y} r={index === geometry.mapped.length - 1 ? 5.5 : 3.2} className={index === geometry.mapped.length - 1 ? "chart-point chart-point-today" : "chart-point"}>
          <title>{`${dateLabel(point.date, true)}: ${formatMoney(dashboard, point.commission ?? 0)}`}</title>
        </circle> : null)}
      </g>

      {today ? <g className="chart-today-marker">
        <line x1={today.x} x2={today.x} y1={geometry.top} y2={geometry.top + geometry.plotHeight} />
        <text x={Math.min(today.x - 6, geometry.width - 18)} y={geometry.top + 12} textAnchor="end">Today</text>
      </g> : null}

      <g className="chart-axis-labels">
        {labelIndexes.map((index) => {
          const x = geometry.left + (index / Math.max(1, points.length - 1)) * geometry.plotWidth;
          return <text key={index} x={x} y={geometry.height - 8} textAnchor={index === 0 ? "start" : index === points.length - 1 ? "end" : "middle"}>{dateLabel(points[index].date)}</text>;
        })}
      </g>
    </svg>
  </div>;
}

function bestTrackedDay(points: DailyCommissionPoint[]) {
  return points.reduce<DailyCommissionPoint | null>((best, point) => {
    if (point.commission === null) return best;
    if (!best || (best.commission ?? 0) < point.commission) return point;
    return best;
  }, null);
}

export default function AnalyticsPanel({ dashboard, points }: Props) {
  const todayMetric = totalField(dashboard, "commission_today");
  const monthMetric = totalField(dashboard, "commission_month");
  const spendMetric = totalField(dashboard, "ad_spent");
  const profitMetric = totalField(dashboard, "overall_profit");

  const priorValues = points.slice(0, -1).flatMap((point) => point.commission === null ? [] : [point.commission]);
  const priorAverage = priorValues.length ? priorValues.reduce((total, value) => total + value, 0) / priorValues.length : null;
  const trend = percentChange(todayMetric.value, priorAverage);
  const tracked = points.filter((point) => point.commission !== null);
  const rollingTotal = tracked.reduce((total, point) => total + (point.commission ?? 0), 0);
  const bestDay = bestTrackedDay(points);

  const cards = [
    fieldCard("Commission today", todayMetric, priorAverage === null ? "Building comparison baseline" : "Compared with prior tracked days", trend),
    fieldCard("Commission this month", monthMetric, "Month-to-date commission"),
    fieldCard("Overall profit", profitMetric, "Current tracked profit"),
    fieldCard("Ad spend", spendMetric, "Current tracked spend"),
  ];

  return <section className="analytics-overview" aria-labelledby="analytics-title">
    <div className="analytics-title-row">
      <div>
        <p className="eyebrow">Analytics</p>
        <h2 id="analytics-title">Commission performance</h2>
        <p className="analytics-subtitle">A 30-day view of earnings across all active tally accounts.</p>
      </div>
      <div className="analytics-period"><span className="analytics-live-dot" /> Last 30 days</div>
    </div>

    <div className="analytics-kpi-grid">
      {cards.map((card) => <article className="analytics-kpi-card" key={card.label}>
        <div className="analytics-kpi-top"><span>{card.label}</span>{card.trend !== undefined && card.trend !== null ? <span className={`analytics-trend ${card.trend >= 0 ? "trend-positive" : "trend-negative"}`}>{card.trend >= 0 ? "+" : ""}{card.trend.toFixed(1)}%</span> : null}</div>
        <strong>{card.value}</strong>
        <p>{card.helper}</p>
      </article>)}
    </div>

    <div className="analytics-main-grid">
      <article className="analytics-chart-card">
        <div className="analytics-card-header">
          <div><span className="analytics-card-label">Daily commission</span><h3>Last 30 days vs today</h3></div>
          <div className="analytics-current"><span>Today</span><strong>{todayMetric.formatted}</strong></div>
        </div>
        <AnalyticsChart dashboard={dashboard} points={points} />
        {tracked.length < 2 ? <div className="analytics-data-note"><strong>History collection started today.</strong> The chart will build automatically as you update Commission today on future days.</div> : null}
      </article>

      <aside className="analytics-insights" aria-label="30-day commission insights">
        <article className="analytics-insight-card analytics-insight-primary">
          <span>30-day tracked total</span>
          <strong>{formatMoney(dashboard, rollingTotal)}</strong>
          <p>{tracked.length} of 30 days currently have recorded data</p>
        </article>
        <article className="analytics-insight-card">
          <span>Prior daily average</span>
          <strong>{priorAverage === null ? "—" : formatMoney(dashboard, priorAverage)}</strong>
          <p>{priorValues.length ? `Based on ${priorValues.length} recorded prior day${priorValues.length === 1 ? "" : "s"}` : "Available after another day of data"}</p>
        </article>
        <article className="analytics-insight-card">
          <span>Best tracked day</span>
          <strong>{bestDay?.commission === null || !bestDay ? "—" : formatMoney(dashboard, bestDay.commission)}</strong>
          <p>{bestDay ? dateLabel(bestDay.date, true) : "No history recorded yet"}</p>
        </article>
        <article className="analytics-insight-card">
          <span>Data coverage</span>
          <strong>{Math.round((tracked.length / Math.max(1, points.length)) * 100)}%</strong>
          <div className="analytics-progress" aria-hidden="true"><span style={{ width: `${(tracked.length / Math.max(1, points.length)) * 100}%` }} /></div>
          <p>Rolling 30-day history completeness</p>
        </article>
      </aside>
    </div>
  </section>;
}
