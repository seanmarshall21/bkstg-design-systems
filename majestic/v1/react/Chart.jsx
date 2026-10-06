import { createElement, useEffect, useRef, useState } from "react";
import { chartNodes, toReact, watchChart, VIZ_MOTION_PARTS, showTip, hideTip } from "../charts-core.mjs";
import { cx } from "./cx.js";

/**
 * The kit's charts in React: the same geometry as charts.js (charts-core.mjs), so both draw the same chart.
 * <Chart type="bar" label="Monthly expenses" labels={["Jan", "Feb"]} values={[4200, 7100]} prefix="$" />
 * <Chart type="bar" stacked label="File transfer" labels={months} series={[{ name: "Desktop", values }, { name: "Mobile", values }]} />
 * <Chart type="donut" label="Leads by source" center="Leads" labels={sources} values={counts} />
 * <Chart type="ring" label="Target reached" value={48} center="of target" />
 * type: bar | line | area | donut | pie | spark | ring | meter.  horizontal, stacked (bar); bars (spark); max (ring, meter);
 * prefix, suffix, decimals; tone good | warn | neg for one series that means good or bad.
 * animate={false} when Motion (or anything else) plays it in instead.
 * motion={{ duration: 300, delay: 200, trigger: "repeat" }}: this chart's own timing, over the system's chart motion
 * (parts: duration, stagger, delay, ease, effect, trigger, start, count; see charts-core.mjs). Read when it plays,
 * except trigger and start, which are read once when the chart mounts.
 * Draws at its real width, plays in once when it scrolls into view (as far as the motion level allows), and keeps a
 * data table for screen readers.
 */
export function Chart({ type, label = "Chart", labels = [], values, series, stacked = false, horizontal = false, bars = false, value, max,
  prefix = "", suffix = "", decimals = 0, tone = "", center = "", height, animate: play = true, motion, className }) {
  const ref = useRef(null);
  const [width, setWidth] = useState(600);
  const spec = { type, label, labels, series: series || (values ? [{ name: label, values }] : []), stacked, horizontal, bars, tone, center,
    prefix, suffix, decimals, value, max: max ?? (type === "ring" ? 100 : undefined) };
  useEffect(() => {
    const fig = ref.current; if (!fig || typeof ResizeObserver !== "function") return undefined;
    const ro = new ResizeObserver(([e]) => { const w = Math.round(e.contentRect.width); setWidth(prev => Math.abs(w - prev) > 8 ? w : prev); });
    ro.observe(fig);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    return play && ref.current ? watchChart(ref.current) : undefined;
  }, []);
  const own = Object.fromEntries(Object.entries(motion || {}).filter(([k]) => VIZ_MOTION_PARTS.includes(k)).map(([k, v]) => [`data-viz-${k}`, String(v)]));
  const h = height ?? (type === "spark" ? 40 : 220);
  return (
    <figure ref={ref} className={cx("ui-viz", `ui-viz--${type}`, horizontal && "ui-viz--horizontal", className)} aria-label={label} {...own}
      onPointerMove={e => showTip(ref.current, spec, e)} onPointerLeave={() => hideTip(ref.current)}>
      {toReact(chartNodes(spec, width, h), createElement)}
    </figure>
  );
}
