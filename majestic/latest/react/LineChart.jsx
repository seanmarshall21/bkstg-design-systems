import { cx } from "./cx.js";

/**
 * <LineChart label="Tickets sold per month" values={[120, 180, 160]} labels={["Jan", "Feb", "Mar"]} />
 * The SVG stretches to its box; the values are the chart's text alternative (role="img" + aria-label).
 */
export function LineChart({ label, values = [], labels = [], className }) {
  if (values.length < 2) return null;
  const w = 600, h = 200, pad = 6;
  const max = Math.max(...values), min = Math.min(...values), span = max - min || 1;
  const pts = values.map((v, i) => [(i * w) / (values.length - 1), pad + (h - 2 * pad) * (1 - (v - min) / span)]);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  return (
    <div className={cx("ui-chart", className)} role="img" aria-label={`${label}: ${values.map((v, i) => (labels[i] ? `${labels[i]} ${v}` : v)).join(", ")}`}>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
        {[0.25, 0.5, 0.75].map((f) => <line key={f} className="ui-chart-grid" x1="0" x2={w} y1={h * f} y2={h * f} vectorEffect="non-scaling-stroke" />)}
        <path className="ui-chart-area" d={`${line} L${w} ${h} L0 ${h} Z`} />
        <path className="ui-chart-line" d={line} vectorEffect="non-scaling-stroke" />
      </svg>
      {labels.length ? <div className="ui-chart-axis" aria-hidden="true">{labels.map((l) => <span key={l}>{l}</span>)}</div> : null}
    </div>
  );
}
