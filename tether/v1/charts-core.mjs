// charts-core.mjs: the kit's charts as pure geometry. One function turns data into a tree of SVG and HTML nodes;
// toHtml() writes it as a string (charts.js, for any site), toReact() builds the same nodes as React elements
// (react/Chart.jsx), so both draw the same chart. check-react.mjs renders one chart both ways and compares them.
//
// Every chart is drawn complete; animate() only plays it in (bars grow, lines draw, rings and donuts sweep, numbers
// count) when the motion level allows, so Still, the device's reduce-motion setting, or a stalled observer all
// leave the finished chart showing. Each chart carries a data table for screen readers; the SVG is decoration.
//
// Colors: one series uses the primary (--chart-line); several use --series-1.. in order, never cycled; a tone
// (good, warn, neg) is for data that means good or bad. Fills sit 2px apart in the card's color (WCAG 1.4.11:
// each then only needs 3:1 against the card). Sizes are in real pixels: the caller passes the width it has.

export const VIZ_TYPES = ["bar", "line", "area", "donut", "pie", "spark", "ring", "meter", "gauge", "heatmap", "funnel"];
const GAP = 2, R = 4; // the gap between fills, the rounding of a bar's free end

// ── data ─────────────────────────────────────────────────────────────────────
/** Read a chart from data attributes (any site, no code). Returns { ok, spec } or { ok: false, error }.
 *  data-ui-viz      bar | line | area | donut | pie | spark | ring | meter
 *  data-label       what the chart shows (the table's caption and the figure's name)
 *  data-labels      categories, comma separated: "Jan,Feb,Mar"
 *  data-values      one series: "12,18,9"   or   data-series  several: "Desktop: 12,18,9; Mobile: 4,6,8"
 *  data-stacked     stack the series (bar)          data-horizontal   bars run sideways (bar)
 *  data-value, data-max   a ring's value and its whole (max defaults to 100)
 *  data-prefix, data-suffix, data-decimals   how numbers read: "$", "%", 1
 *  data-tone        good | warn | neg   for one series that means good or bad
 *  data-center      the words under a donut's or ring's middle number ("Leads")
 *  data-bars        a sparkline of bars instead of a line;  data-max on a meter: the whole (the rest shows as free)
 *  gauge            data-value and data-max, like a ring, drawn as a half circle
 *  heatmap          data-series, one row each ("Mon: 1,4,2; Tue: 3,0,5"), data-labels for the columns
 *  funnel           data-values per stage, data-labels for the stages, widest first */
export function specFrom(get) {
  const type = (get("data-ui-viz") || "").trim();
  if (!VIZ_TYPES.includes(type)) return { ok: false, error: `data-ui-viz must be one of: ${VIZ_TYPES.join(", ")}.` };
  const num = s => { const n = Number(String(s).trim()); return Number.isFinite(n) ? n : NaN; };
  const labels = (get("data-labels") || "").split(",").map(s => s.trim()).filter(Boolean);
  let series = [];
  const raw = get("data-series");
  if (raw) {
    for (const part of raw.split(";").map(s => s.trim()).filter(Boolean)) {
      const i = part.indexOf(":"); if (i < 1) return { ok: false, error: `data-series: "${part.slice(0, 30)}" needs a name, a colon, then numbers.` };
      const values = part.slice(i + 1).split(",").map(num);
      if (values.some(Number.isNaN)) return { ok: false, error: `data-series: ${part.slice(0, i)} has something that is not a number.` };
      series.push({ name: part.slice(0, i).trim(), values });
    }
  } else if (get("data-values")) {
    const values = get("data-values").split(",").map(num);
    if (values.some(Number.isNaN)) return { ok: false, error: "data-values: use numbers separated by commas." };
    series = [{ name: get("data-label") || "Value", values }];
  }
  const spec = { type, label: get("data-label") || "Chart", labels, series, stacked: get("data-stacked") !== null && get("data-stacked") !== undefined,
    horizontal: get("data-horizontal") !== null && get("data-horizontal") !== undefined, bars: get("data-bars") !== null && get("data-bars") !== undefined, tone: get("data-tone") || "", center: get("data-center") || "",
    prefix: get("data-prefix") || "", suffix: get("data-suffix") || "", decimals: +(get("data-decimals") || 0) };
  if (type === "ring" || type === "gauge") { spec.value = num(get("data-value")); spec.max = get("data-max") ? num(get("data-max")) : 100;
    if (Number.isNaN(spec.value) || Number.isNaN(spec.max) || spec.max <= 0) return { ok: false, error: "A ring or gauge needs data-value (and data-max, if not 100) as numbers." }; }
  else if (!series.length || !series[0].values.length) return { ok: false, error: "Give data-values or data-series." };
  if (type === "meter" && get("data-max")) { spec.max = num(get("data-max")); if (!(spec.max > 0)) return { ok: false, error: "data-max must be a number above 0." }; }
  if (["donut", "pie", "meter", "funnel"].includes(type) && series.length > 1) return { ok: false, error: `A ${type} shows one set of parts: use data-values with data-labels.` };
  if (["donut", "pie", "meter", "funnel", "heatmap"].includes(type) && series.some(x => x.values.some(v => v < 0))) return { ok: false, error: `A ${type}'s parts cannot be negative.` };
  return { ok: true, spec };
}

// ── helpers ──────────────────────────────────────────────────────────────────
const el = (tag, attrs = {}, ...children) => ({ tag, attrs, children: children.flat().filter(c => c !== null && c !== undefined && c !== false) });
const f1 = n => Math.round(n * 10) / 10;
export const formatValue = (spec, v) => spec.prefix + Number(v).toLocaleString("en-US", { minimumFractionDigits: spec.decimals, maximumFractionDigits: spec.decimals }) + spec.suffix;
const shortNum = v => Math.abs(v) >= 1e6 ? f1(v / 1e6) + "M" : Math.abs(v) >= 1e3 ? f1(v / 1e3) + "k" : String(f1(v));
// one hue, light to dark, for amounts (heatmap) and stages in order (funnel): the primary mixed into the card.
// The darkest step is the primary itself (3:1 on the card); lighter steps rely on labels, hover and the table.
export const RAMP = [22, 40, 58, 78, 100];
const rampColor = pct => pct >= 100 ? "var(--chart-line)" : `color-mix(in srgb, var(--chart-line) ${pct}%, var(--p))`;
const colorOf = (spec, i) => spec.series.length > 1 && spec.type !== "heatmap" || ["donut", "pie", "meter"].includes(spec.type) ? `var(--series-${(i % 5) + 1})`
  : spec.tone === "good" ? "var(--good)" : spec.tone === "warn" ? "var(--warn)" : spec.tone === "neg" ? "var(--neg)" : "var(--chart-line)";
// a tidy top for the value axis: 1, 2, 2.5 or 5 times a power of ten
function niceMax(v) { if (v <= 0) return 1; const p = 10 ** Math.floor(Math.log10(v)), m = v / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p; }
// a bar: rounded at its free end only (the end away from the baseline), flat on the baseline
function barPath(x, y, w, h, horizontal, round) {
  if (w <= 0 || h <= 0) return "";
  const r = Math.min(round ? R : 0, horizontal ? w : h, horizontal ? h / 2 : w / 2);
  if (horizontal) return `M${f1(x)} ${f1(y)}H${f1(x + w - r)}Q${f1(x + w)} ${f1(y)} ${f1(x + w)} ${f1(y + r)}V${f1(y + h - r)}Q${f1(x + w)} ${f1(y + h)} ${f1(x + w - r)} ${f1(y + h)}H${f1(x)}Z`;
  return `M${f1(x)} ${f1(y + h)}V${f1(y + r)}Q${f1(x)} ${f1(y)} ${f1(x + r)} ${f1(y)}H${f1(x + w - r)}Q${f1(x + w)} ${f1(y)} ${f1(x + w)} ${f1(y + r)}V${f1(y + h)}Z`;
}

// ── the pieces around the plot: legend and data table ──────────────────────────
function legend(spec, names) {
  if (names.length < 2) return null;
  return el("ul", { class: "ui-viz-legend" }, names.map((n, i) => el("li", {}, el("span", { class: "ui-viz-key", style: `background:${colorOf(spec, i)}`, "aria-hidden": "true" }), n)));
}
function table(spec) {
  const cap = el("caption", {}, spec.label);
  if (spec.type === "ring" || spec.type === "gauge") return el("table", { class: "ui-sr-only" }, cap, el("tbody", {}, el("tr", {}, el("th", { scope: "row" }, spec.center || "Value"), el("td", {}, `${formatValue(spec, spec.value)} of ${formatValue(spec, spec.max)}`))));
  const s = spec.series, cats = spec.labels.length ? spec.labels : s[0].values.map((_, i) => String(i + 1));
  if (spec.type === "funnel") {
    const first = s[0].values[0] || 1;
    return el("table", { class: "ui-sr-only" }, cap, el("thead", {}, el("tr", {}, el("th", { scope: "col" }, "Stage"), el("th", { scope: "col" }, "Value"), el("th", { scope: "col" }, "Of the first"))),
      el("tbody", {}, s[0].values.map((v, i) => el("tr", {}, el("th", { scope: "row" }, cats[i] || String(i + 1)), el("td", {}, formatValue(spec, v)), el("td", {}, `${Math.round(v / first * 100)}%`)))));
  }
  if (["donut", "pie", "meter"].includes(spec.type)) {
    const total = s[0].values.reduce((a, b) => a + b, 0) || 1;
    return el("table", { class: "ui-sr-only" }, cap, el("thead", {}, el("tr", {}, el("th", { scope: "col" }, "Part"), el("th", { scope: "col" }, "Value"), el("th", { scope: "col" }, "Share"))),
      el("tbody", {}, s[0].values.map((v, i) => el("tr", {}, el("th", { scope: "row" }, cats[i] || String(i + 1)), el("td", {}, formatValue(spec, v)), el("td", {}, `${Math.round(v / total * 100)}%`)))));
  }
  return el("table", { class: "ui-sr-only" }, cap, el("thead", {}, el("tr", {}, el("th", { scope: "col" }, ""), s.map(x => el("th", { scope: "col" }, x.name)))),
    el("tbody", {}, cats.map((c, i) => el("tr", {}, el("th", { scope: "row" }, c), s.map(x => el("td", {}, x.values[i] === undefined ? "" : formatValue(spec, x.values[i])))))));
}

// ── the plots ────────────────────────────────────────────────────────────────
function axisPlot(spec, width, height, type) {
  const s = spec.series, n = Math.max(...s.map(x => x.values.length)), cats = spec.labels.length ? spec.labels : Array.from({ length: n }, (_, i) => String(i + 1));
  const horizontal = type === "bar" && spec.horizontal, stacked = type === "bar" && spec.stacked && s.length > 1;
  const top = stacked ? Math.max(...cats.map((_, i) => s.reduce((a, x) => a + Math.max(0, x.values[i] || 0), 0))) : Math.max(0, ...s.flatMap(x => x.values));
  const max = niceMax(top), ticks = [0, 0.25, 0.5, 0.75, 1].map(k => k * max);
  const pad = horizontal ? { t: 4, r: 12, b: 22, l: Math.min(140, 12 + 7 * Math.max(...cats.map(c => c.length))) } : { t: 10, r: 8, b: 26, l: 12 + 7 * Math.max(...ticks.map(t => shortNum(t).length)) };
  const W = Math.max(120, width), H = Math.max(80, height), pw = W - pad.l - pad.r, ph = H - pad.t - pad.b;
  const kids = [];
  // grid and ticks, recessive
  for (const t of ticks) {
    if (horizontal) { const x = pad.l + t / max * pw; kids.push(el("line", { class: "ui-viz-grid", x1: f1(x), x2: f1(x), y1: pad.t, y2: f1(pad.t + ph) }), el("text", { class: "ui-viz-tick", x: f1(x), y: f1(H - 6), "text-anchor": "middle" }, shortNum(t))); }
    else { const y = pad.t + ph - t / max * ph; kids.push(el("line", { class: "ui-viz-grid", x1: pad.l, x2: f1(W - pad.r), y1: f1(y), y2: f1(y) }), el("text", { class: "ui-viz-tick", x: pad.l - 8, y: f1(y + 4), "text-anchor": "end" }, shortNum(t))); }
  }
  const band = (horizontal ? ph : pw) / cats.length;
  // show every Nth label so they never touch: about 7px a character at caption size, plus a 10px gap (no DOM measuring, so HTML and React match)
  const every = Math.max(1, Math.ceil((Math.max(...cats.map(c => String(c).length)) * 7 + 10) / band));
  cats.forEach((c, i) => {
    if (horizontal) kids.push(el("text", { class: "ui-viz-tick", x: pad.l - 8, y: f1(pad.t + band * (i + 0.5) + 4), "text-anchor": "end" }, c));
    else if (i % every === 0) kids.push(el("text", { class: "ui-viz-tick", x: f1(pad.l + band * (i + 0.5)), y: f1(H - 8), "text-anchor": "middle" }, c));
  });
  if (type === "bar") {
    const group = band * (s.length > 1 && !stacked ? 0.78 : 0.56), k = stacked ? 1 : s.length, bw = Math.max(2, (group - GAP * (k - 1)) / k);
    cats.forEach((c, i) => {
      let acc = 0;
      s.forEach((x, j) => {
        const v = Math.max(0, x.values[i] || 0), len = v / max * (horizontal ? pw : ph), last = !stacked || j === s.length - 1 || s.slice(j + 1).every(y => !(y.values[i] > 0));
        const start = band * i + (band - group) / 2 + (stacked ? 0 : j * (bw + GAP));
        // stacked: every segment but the base gives up GAP at its start, so fills never touch
        const lead = stacked && acc > 0 ? GAP : 0, sz = Math.max(0, len - lead);
        const d = horizontal ? barPath(pad.l + acc + lead, pad.t + start, sz, bw, true, last) : barPath(pad.l + start, pad.t + ph - acc - len, bw, sz, false, last);
        if (d) kids.push(el("path", { class: "ui-viz-mark ui-viz-bar", d, fill: colorOf(spec, j), "data-i": i, "data-s": j, "data-tip": `${c}${s.length > 1 ? ", " + x.name : ""}: ${formatValue(spec, x.values[i] || 0)}` }));
        if (stacked) acc += len; // side by side, every bar starts at the baseline
      });
    });
  } else {
    // line and area: one path per series; the area fills to the baseline under its line
    s.forEach((x, j) => {
      const pts = x.values.map((v, i) => [pad.l + (cats.length === 1 ? pw / 2 : i / (cats.length - 1) * pw), pad.t + ph - Math.max(0, v) / max * ph]);
      const line = pts.map((p, i) => (i ? "L" : "M") + f1(p[0]) + " " + f1(p[1])).join("");
      if (type === "area") kids.push(el("path", { class: "ui-viz-area", d: `${line}L${f1(pts[pts.length - 1][0])} ${f1(pad.t + ph)}L${f1(pts[0][0])} ${f1(pad.t + ph)}Z`, fill: colorOf(spec, j) }));
      kids.push(el("path", { class: "ui-viz-mark ui-viz-line", d: line, stroke: colorOf(spec, j), fill: "none", "data-s": j }));
    });
    kids.push(el("line", { class: "ui-viz-cross", x1: 0, x2: 0, y1: pad.t, y2: f1(pad.t + ph), hidden: "" }));
  }
  return { svg: el("svg", { class: "ui-viz-svg", width: W, height: H, viewBox: `0 0 ${W} ${H}`, "aria-hidden": "true", focusable: "false", "data-pad": `${pad.l},${pad.r}`, "data-n": cats.length }, kids), names: s.map(x => x.name) };
}

function roundPlot(spec, width, height) {
  // donut, pie and ring: circles with a dash per part (a sweep is a dash growing), parts GAP apart
  const size = Math.max(80, Math.min(width, height)), c = size / 2, ring = spec.type === "ring";
  const thick = spec.type === "pie" ? c - 2 : ring ? Math.max(8, size * 0.1) : Math.max(14, size * 0.17), r = spec.type === "pie" ? (c - 2) / 2 : c - thick / 2 - 2;
  const L = 2 * Math.PI * r, kids = [el("circle", { class: "ui-viz-track", cx: c, cy: c, r: f1(r), "stroke-width": f1(thick), fill: "none" })];
  let middle = null;
  if (ring) {
    const part = Math.max(0, Math.min(1, spec.value / spec.max));
    kids.push(el("circle", { class: "ui-viz-mark ui-viz-sweep", cx: c, cy: c, r: f1(r), fill: "none", stroke: colorOf(spec, 0), "stroke-width": f1(thick), "stroke-linecap": part > 0 && part < 1 ? "round" : "butt",
      "stroke-dasharray": `${f1(part * L)} ${f1(L)}`, transform: `rotate(-90 ${c} ${c})`, "data-tip": `${formatValue(spec, spec.value)} of ${formatValue(spec, spec.max)}` }));
    middle = { value: Math.round(part * 100), suffix: "%", label: spec.center };
  } else {
    const vals = spec.series[0].values, total = vals.reduce((a, b) => a + b, 0) || 1, cats = spec.labels;
    let at = 0; const gap = vals.filter(v => v > 0).length > 1 ? GAP : 0;
    vals.forEach((v, i) => {
      const len = v / total * L;
      if (len > gap) kids.push(el("circle", { class: "ui-viz-mark ui-viz-sweep", cx: c, cy: c, r: f1(r), fill: "none", stroke: colorOf(spec, i), "stroke-width": f1(thick),
        "stroke-dasharray": `${f1(len - gap)} ${f1(L - len + gap)}`, "stroke-dashoffset": f1(-at), transform: `rotate(-90 ${c} ${c})`, "data-i": i, "data-tip": `${cats[i] || i + 1}: ${formatValue(spec, v)} (${Math.round(v / total * 100)}%)` }));
      at += len;
    });
    if (spec.type === "donut") middle = { value: total, prefix: spec.prefix, suffix: spec.suffix, label: spec.center };
  }
  const svg = el("svg", { class: "ui-viz-svg", width: size, height: size, viewBox: `0 0 ${size} ${size}`, "aria-hidden": "true", focusable: "false" }, kids);
  const mid = middle ? el("div", { class: "ui-viz-middle", "aria-hidden": "true" }, el("strong", { "data-count-to": middle.value, "data-count-prefix": middle.prefix || "", "data-count-suffix": middle.suffix || "" }, (middle.prefix || "") + Number(middle.value).toLocaleString("en-US") + (middle.suffix || "")), middle.label ? el("span", {}, middle.label) : null) : null;
  return { svg: el("div", { class: "ui-viz-round", style: `width:${size}px;height:${size}px` }, svg, mid), names: ring ? [] : spec.labels };
}

function sparkPlot(spec, width, height) {
  const v = spec.series[0].values, W = Math.max(40, width), H = Math.max(16, height), max = Math.max(...v, 0) || 1, min = Math.min(...v, 0);
  const kids = [];
  if (spec.horizontal || spec.stacked) { /* not meaningful for a sparkline; ignored */ }
  if (spec.bars) {
    const bw = Math.max(2, (W - GAP * (v.length - 1)) / v.length);
    v.forEach((x, i) => { const h = Math.max(1, (x - min) / (max - min || 1) * (H - 2)); kids.push(el("path", { class: "ui-viz-mark ui-viz-bar", d: barPath(i * (bw + GAP), H - h, bw, h, false, true), fill: colorOf(spec, 0), "data-i": i, "data-tip": `${spec.labels[i] || i + 1}: ${formatValue(spec, x)}` })); });
  } else {
    const pts = v.map((x, i) => [v.length === 1 ? W / 2 : i / (v.length - 1) * (W - 4) + 2, 2 + (H - 4) * (1 - (x - min) / (max - min || 1))]);
    kids.push(el("path", { class: "ui-viz-mark ui-viz-line", d: pts.map((p, i) => (i ? "L" : "M") + f1(p[0]) + " " + f1(p[1])).join(""), fill: "none", stroke: colorOf(spec, 0) }));
  }
  return { svg: el("svg", { class: "ui-viz-svg", width: W, height: H, viewBox: `0 0 ${W} ${H}`, "aria-hidden": "true", focusable: "false" }, kids), names: [] };
}

function meterPlot(spec, width) {
  // one bar of parts, GAP apart, rounded at the two outer ends; the rest of the whole is the track
  const v = spec.series[0].values, W = Math.max(80, width), H = 10, total = spec.max || v.reduce((a, b) => a + b, 0) || 1;
  const kids = [el("rect", { class: "ui-viz-trackbar", x: 0, y: 0, width: W, height: H, rx: H / 2 })];
  let x = 0; const shown = v.filter(n => n > 0).length;
  v.forEach((n, i) => {
    const len = n / total * W; if (len <= 0) return;
    const idx = v.slice(0, i).filter(k => k > 0).length, first = idx === 0, last = idx === shown - 1, w = Math.max(0, len - (last ? 0 : GAP));
    kids.push(el("rect", { class: "ui-viz-mark ui-viz-seg", x: f1(x), y: 0, width: f1(w), height: H, rx: first || last ? H / 2 : 0, fill: colorOf(spec, i), "data-i": i, "data-tip": `${spec.labels[i] || i + 1}: ${formatValue(spec, n)}` }));
    x += len;
  });
  return { svg: el("svg", { class: "ui-viz-svg", width: W, height: H, viewBox: `0 0 ${W} ${H}`, "aria-hidden": "true", focusable: "false" }, kids), names: spec.labels };
}


function gaugePlot(spec, width) {
  // a half ring: the track, then the value from the left end; the number sits in the middle of the arc
  const W = Math.max(120, Math.min(width, 280)), thick = Math.max(10, W * 0.09), r = W / 2 - thick / 2 - 2, cx = W / 2, cy = W / 2, H = Math.round(cy + thick / 2 + 4);
  const L = Math.PI * r, part = Math.max(0, Math.min(1, spec.value / spec.max)), arc = `M${f1(cx - r)} ${f1(cy)}A${f1(r)} ${f1(r)} 0 0 1 ${f1(cx + r)} ${f1(cy)}`;
  const kids = [el("path", { class: "ui-viz-track", d: arc, fill: "none", "stroke-width": f1(thick), "stroke-linecap": "round" })];
  if (part > 0) kids.push(el("path", { class: "ui-viz-mark ui-viz-sweep", d: arc, fill: "none", stroke: colorOf(spec, 0), "stroke-width": f1(thick), "stroke-linecap": "round",
    "stroke-dasharray": `${f1(part * L)} ${f1(L)}`, "data-tip": `${formatValue(spec, spec.value)} of ${formatValue(spec, spec.max)}` }));
  const svg = el("svg", { class: "ui-viz-svg", width: W, height: H, viewBox: `0 0 ${W} ${H}`, "aria-hidden": "true", focusable: "false" }, kids);
  const mid = el("div", { class: "ui-viz-middle ui-viz-middle--gauge", "aria-hidden": "true" }, el("strong", { "data-count-to": spec.value, "data-count-prefix": spec.prefix, "data-count-suffix": spec.suffix }, formatValue(spec, spec.value)), spec.center ? el("span", {}, spec.center) : null);
  return { svg: el("div", { class: "ui-viz-round ui-viz-round--gauge", style: `width:${W}px;height:${H}px` }, svg, mid), names: [] };
}

function heatPlot(spec, width) {
  // rows by columns of cells, GAP apart; each cell's step is its value's share of the largest
  const rows = spec.series, cols = spec.labels.length ? spec.labels : rows[0].values.map((_, i) => String(i + 1));
  const lw = Math.min(110, 10 + 7 * Math.max(...rows.map(r => r.name.length))), W = Math.max(160, width), cw = (W - lw) / cols.length, ch = Math.min(28, Math.max(14, cw));
  const max = Math.max(1, ...rows.flatMap(r => r.values)), H = rows.length * ch + 18, kids = [];
  rows.forEach((r, y) => {
    kids.push(el("text", { class: "ui-viz-tick", x: lw - 8, y: f1(y * ch + ch / 2 + 4), "text-anchor": "end" }, r.name));
    cols.forEach((c, x) => {
      const v = r.values[x] || 0, step = RAMP[Math.min(RAMP.length - 1, Math.floor(v / max * (RAMP.length - 0.001)))];
      kids.push(el("rect", { class: "ui-viz-mark ui-viz-cell", x: f1(lw + x * cw), y: f1(y * ch), width: f1(Math.max(1, cw - GAP)), height: f1(ch - GAP), rx: 3,
        fill: v > 0 ? rampColor(step) : "var(--mid)", "data-i": x, "data-tip": `${r.name}, ${c}: ${formatValue(spec, v)}` }));
    });
  });
  cols.forEach((c, x) => { if (cols.length <= 14 || x % Math.ceil(cols.length / 12) === 0) kids.push(el("text", { class: "ui-viz-tick", x: f1(lw + x * cw + cw / 2), y: f1(H - 4), "text-anchor": "middle" }, c)); });
  const svg = el("svg", { class: "ui-viz-svg", width: W, height: H, viewBox: `0 0 ${W} ${H}`, "aria-hidden": "true", focusable: "false" }, kids);
  const key = el("div", { class: "ui-viz-ramp", "aria-hidden": "true" }, el("span", {}, "Less"), RAMP.map(p => el("i", { style: `background:${rampColor(p)}` })), el("span", {}, "More"));
  return { svg, names: [], extra: key };
}

function funnelPlot(spec, width) {
  // stages as centered bars, widest first, each a darker-to-lighter step of one hue; the label and value sit beside it
  const v = spec.series[0].values, cats = spec.labels, W = Math.max(160, width), first = v[0] || 1, bh = 30, H = v.length * (bh + GAP * 3);
  const lw = Math.min(150, 12 + 7 * Math.max(...cats.map(c => c.length), 4)), pw = W - lw - 90, kids = [];
  v.forEach((n, i) => {
    const w = Math.max(2, n / first * pw), x = lw + (pw - w) / 2, y = i * (bh + GAP * 3), step = RAMP[Math.max(0, RAMP.length - 1 - i)];
    kids.push(el("text", { class: "ui-viz-tick ui-viz-tick--strong", x: lw - 10, y: f1(y + bh / 2 + 4), "text-anchor": "end" }, cats[i] || String(i + 1)));
    kids.push(el("rect", { class: "ui-viz-mark ui-viz-seg", x: f1(x), y: f1(y), width: f1(w), height: bh, rx: R, fill: rampColor(step), "data-i": i, "data-tip": `${cats[i] || i + 1}: ${formatValue(spec, n)} (${Math.round(n / first * 100)}% of ${cats[0] || "the first"})` }));
    kids.push(el("text", { class: "ui-viz-tick", x: f1(lw + pw + 10), y: f1(y + bh / 2 + 4), "text-anchor": "start" }, `${formatValue(spec, n)} · ${Math.round(n / first * 100)}%`));
  });
  return { svg: el("svg", { class: "ui-viz-svg", width: W, height: H, viewBox: `0 0 ${W} ${H}`, "aria-hidden": "true", focusable: "false" }, kids), names: [] };
}

/** The whole chart for a width (and height, for axis charts): a list of nodes to put inside the figure */
export function chartNodes(spec, width = 600, height = 220) {
  const t = spec.type;
  const plot = t === "bar" || t === "line" || t === "area" ? axisPlot(spec, width, height, t) : t === "spark" ? sparkPlot(spec, width, height)
    : t === "meter" ? meterPlot(spec, width) : t === "gauge" ? gaugePlot(spec, width) : t === "heatmap" ? heatPlot(spec, width) : t === "funnel" ? funnelPlot(spec, width) : roundPlot(spec, width, height);
  return [el("div", { class: "ui-viz-plot" }, plot.svg, el("span", { class: "ui-viz-tip", "aria-hidden": "true", hidden: "" })), plot.extra || null, legend(spec, plot.names), table(spec)];
}
/** An error, shown where the chart would be, so a typo is never a silent blank */
export const errorNodes = msg => [el("p", { class: "ui-viz-error", role: "note" }, "Chart data could not be read: " + msg)];

// ── writing the tree ─────────────────────────────────────────────────────────
const escText = s => String(s).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
const escAttr = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
export function toHtml(nodes) {
  return nodes.filter(Boolean).map(n => typeof n === "object" ? `<${n.tag}${Object.entries(n.attrs).map(([k, v]) => ` ${k}="${escAttr(v)}"`).join("")}>${toHtml(n.children)}</${n.tag}>` : escText(n)).join("");
}
const REACT_NAME = { class: "className", "stroke-width": "strokeWidth", "stroke-dasharray": "strokeDasharray", "stroke-dashoffset": "strokeDashoffset", "stroke-linecap": "strokeLinecap", "text-anchor": "textAnchor", viewBox: "viewBox" };
const styleObj = s => Object.fromEntries(s.split(";").filter(Boolean).map(p => { const [k, ...v] = p.split(":"); return [k.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase()), v.join(":").trim()]; }));
/** The same tree as React elements: h is React.createElement */
export function toReact(nodes, h) {
  return nodes.filter(Boolean).map((n, i) => {
    if (typeof n !== "object") return n;
    const props = { key: i };
    for (const [k, v] of Object.entries(n.attrs)) {
      if (k === "style") props.style = styleObj(v);
      else if (k === "hidden") props.hidden = true;
      else props[REACT_NAME[k] || k] = v;
    }
    return h(n.tag, props, ...toReact(n.children, h));
  });
}

// ── hover: one value under the pointer (lines: the nearest category, every series) ──────────────────────────
export function hideTip(fig) {
  if (!fig) return; const t = fig.querySelector(".ui-viz-tip"), x = fig.querySelector(".ui-viz-cross");
  if (t) t.hidden = true; if (x) x.setAttribute("hidden", "");
}
export function showTip(fig, spec, e) {
  const tip = fig.querySelector(".ui-viz-tip"), plot = fig.querySelector(".ui-viz-plot"); if (!tip || !plot) return;
  const box = plot.getBoundingClientRect(); let text = "";
  const mark = e.target.closest && e.target.closest("[data-tip]");
  if (mark) text = mark.getAttribute("data-tip");
  else if (spec.type === "line" || spec.type === "area") {
    const svg = fig.querySelector(".ui-viz-svg"), [pl, pr] = (svg.getAttribute("data-pad") || "0,0").split(",").map(Number), n = +svg.getAttribute("data-n");
    const w = svg.getBoundingClientRect().width, i = Math.round((e.clientX - box.left - pl) / Math.max(1, w - pl - pr) * (n - 1));
    if (i >= 0 && i < n) {
      const cx = pl + (n === 1 ? (w - pl - pr) / 2 : i / (n - 1) * (w - pl - pr)), cross = svg.querySelector(".ui-viz-cross");
      cross.setAttribute("x1", cx); cross.setAttribute("x2", cx); cross.removeAttribute("hidden");
      text = (spec.labels[i] ? spec.labels[i] + ": " : "") + spec.series.map(x => (spec.series.length > 1 ? x.name + " " : "") + (x.values[i] === undefined ? "" : formatValue(spec, x.values[i]))).join(", ");
    }
  }
  if (!text) { hideTip(fig); return; }
  tip.textContent = text; tip.hidden = false;
  const x = e.clientX - box.left, y = e.clientY - box.top;
  tip.style.left = Math.max(0, Math.min(box.width - tip.offsetWidth, x - tip.offsetWidth / 2)) + "px";
  tip.style.top = Math.max(0, y - tip.offsetHeight - 12) + "px";
}

// ── motion: play a drawn chart in ────────────────────────────────────────────
/** level: "full" | "calm" | "still". Reads the kit's motion tokens; does nothing it cannot undo. */
export function animate(fig, level) {
  if (!fig || typeof fig.animate !== "function" || level === "still") return;
  if (typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const css = getComputedStyle(fig), ms = (n, d) => { const v = css.getPropertyValue(n).trim(); return v ? (v.endsWith("ms") ? parseFloat(v) : parseFloat(v) * 1000) : d; };
  const slow = ms("--dur-slow", 600), fast = ms("--dur-fast", 150), stagger = ms("--motion-stagger", 40), ease = css.getPropertyValue("--ease-enter").trim() || "cubic-bezier(.16,1,.3,1)";
  const svg = fig.querySelector(".ui-viz-svg"); if (!svg) return;
  if (level === "calm") { fig.querySelector(".ui-viz-plot")?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: fast, easing: "ease-out" }); return; }
  const horizontal = fig.classList.contains("ui-viz--horizontal");
  const funnel = fig.classList.contains("ui-viz--funnel");
  fig.querySelectorAll(".ui-viz-cell").forEach(c => c.animate([{ opacity: 0 }, { opacity: 1 }], { duration: fast * 2, delay: +(c.getAttribute("data-i") || 0) * (stagger / 2), easing: "ease-out", fill: "backwards" }));
  fig.querySelectorAll(".ui-viz-bar, .ui-viz-seg").forEach(b => {
    const i = +(b.getAttribute("data-i") || 0);
    b.style.transformBox = "fill-box"; b.style.transformOrigin = funnel ? "center center" : horizontal || b.classList.contains("ui-viz-seg") ? "left center" : "center bottom";
    b.animate([{ transform: horizontal || b.classList.contains("ui-viz-seg") ? "scaleX(0)" : "scaleY(0)" }, { transform: "none" }], { duration: slow, delay: i * stagger, easing: ease, fill: "backwards" });
  });
  fig.querySelectorAll(".ui-viz-line").forEach(p => {
    const len = typeof p.getTotalLength === "function" ? p.getTotalLength() : 0; if (!len) return;
    p.animate([{ strokeDasharray: `${len} ${len}`, strokeDashoffset: len }, { strokeDasharray: `${len} ${len}`, strokeDashoffset: 0 }], { duration: slow * 1.4, easing: ease, fill: "backwards" });
  });
  fig.querySelectorAll(".ui-viz-area").forEach(a => a.animate([{ opacity: 0 }, { opacity: 1 }], { duration: slow, delay: slow * 0.4, easing: "ease-out", fill: "backwards" }));
  fig.querySelectorAll(".ui-viz-sweep").forEach((c, i) => {
    const [len, rest] = (c.getAttribute("stroke-dasharray") || "0 0").split(" ").map(Number);
    c.animate([{ strokeDasharray: `0 ${len + rest}` }, { strokeDasharray: `${len} ${rest}` }], { duration: slow, delay: i * stagger, easing: ease, fill: "backwards" });
  });
  // the middle number counts up; the finished number is already in the text
  fig.querySelectorAll("[data-count-to]").forEach(n => {
    const to = +n.getAttribute("data-count-to"), pre = n.getAttribute("data-count-prefix") || "", suf = n.getAttribute("data-count-suffix") || "", t0 = performance.now(), dur = slow * 1.2;
    const step = now => { const k = Math.min(1, (now - t0) / dur), e = 1 - (1 - k) ** 3; n.textContent = pre + Math.round(to * e).toLocaleString("en-US") + suf; if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
}
/** The motion level of the page: the Look's setting, then the device's */
export function motionLevel() {
  const m = typeof document !== "undefined" && document.documentElement.getAttribute("data-motion");
  return m === "still" || m === "calm" ? m : "full";
}
