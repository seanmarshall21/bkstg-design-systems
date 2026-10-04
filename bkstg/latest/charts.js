// charts.js: the kit's charts on any page, no code. Load it once as a module:
//   <script type="module" src="charts.js"></script>
// then describe a chart with attributes (see charts-core.mjs, specFrom, for every one):
//   <figure data-ui-viz="bar" data-label="Monthly expenses" data-labels="Jan,Feb,Mar" data-values="4,7,5" data-prefix="$"></figure>
// It draws at the figure's real width, redraws when that changes, plays in once when it scrolls into view (only as
// far as the motion level allows), shows a value on hover, and keeps a data table for screen readers.
// window.UIViz = { init(scope), draw(figure) } for pages that add charts later (the workbench does).
import { specFrom, chartNodes, errorNodes, toHtml, animate, motionLevel, showTip, hideTip } from "./charts-core.mjs";

function draw(fig) {
  fig.classList.add("ui-viz");
  const r = specFrom(n => fig.getAttribute(n));
  if (!r.ok) { fig.innerHTML = toHtml(errorNodes(r.error)); fig._viz = null; return; }
  const spec = r.spec, css = getComputedStyle(fig);
  fig._viz = spec;
  fig.classList.add("ui-viz--" + spec.type);
  fig.classList.toggle("ui-viz--horizontal", !!spec.horizontal);
  if (fig.tagName !== "FIGURE" && !fig.hasAttribute("role")) fig.setAttribute("role", "figure");
  fig.setAttribute("aria-label", spec.label);
  const w = Math.round(fig.clientWidth) || 600, h = parseFloat(css.getPropertyValue("--viz-h")) || (spec.type === "spark" ? 40 : 220);
  fig.innerHTML = toHtml(chartNodes(spec, w, h));
  fig._vizW = w;
}

// play in once, when at least a quarter of the chart is on screen
const seen = typeof IntersectionObserver === "function" ? new IntersectionObserver(entries => {
  for (const e of entries) if (e.isIntersecting) { seen.unobserve(e.target); animate(e.target, motionLevel()); }
}, { threshold: 0.25 }) : null;
// redraw when the width changes, without playing in again
const sized = typeof ResizeObserver === "function" ? new ResizeObserver(entries => {
  for (const e of entries) { const fig = e.target, w = Math.round(e.contentRect.width); if (fig._viz && Math.abs(w - (fig._vizW || 0)) > 8) draw(fig); }
}) : null;

function init(scope = document) {
  const list = scope.matches && scope.matches("[data-ui-viz]") ? [scope] : Array.from(scope.querySelectorAll("[data-ui-viz]"));
  for (const fig of list) {
    if (fig._vizWired) { draw(fig); continue; }
    fig._vizWired = true; draw(fig);
    if (sized) sized.observe(fig);
    // data-viz-motion="none": the page animates it (GSAP, its own); the kit only draws it
    if (seen && fig._viz && fig.getAttribute("data-viz-motion") !== "none") seen.observe(fig);
  }
}

// hover: the value of the bar, part or point under the pointer (lines: the nearest category, every series)
document.addEventListener("pointermove", e => {
  const fig = e.target.closest && e.target.closest(".ui-viz");
  document.querySelectorAll(".ui-viz-tip:not([hidden])").forEach(t => { const f = t.closest(".ui-viz"); if (f !== fig) hideTip(f); });
  if (fig && fig._viz) showTip(fig, fig._viz, e);
});

// charts added later (a workbench card, a page that renders on demand) are found and drawn too
if (typeof MutationObserver === "function") new MutationObserver(records => {
  for (const r of records) for (const n of r.addedNodes) if (n.nodeType === 1 && (n.matches("[data-ui-viz]") || n.querySelector("[data-ui-viz]"))) init(n);
}).observe(document.documentElement, { childList: true, subtree: true });
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => init()); else init();

window.UIViz = { init, draw };
