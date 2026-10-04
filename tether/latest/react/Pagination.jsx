import { cx } from "./cx.js";

const ARROW = (d) => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>;

/** The page numbers to show: always the first and last, the current one and its neighbors, gaps as null */
export function pageList(page, count) {
  const want = new Set([1, count, page - 1, page, page + 1].filter((n) => n >= 1 && n <= count));
  const out = [];
  [...want].sort((a, b) => a - b).forEach((n, i, all) => { if (i && n - all[i - 1] > 1) out.push(null); out.push(n); });
  return out;
}

/**
 * <Pagination page={page} count={12} onChange={setPage} />
 * Previous and Next, then the numbers; in a narrow container the numbers give way to "Page 2 of 12".
 */
export function Pagination({ page, count, onChange, label = "Pagination", className }) {
  const go = (n) => () => onChange?.(n);
  return (
    <nav className={cx("ui-pagination", className)} aria-label={label}>
      <button type="button" className="ui-btn ui-btn--sm" onClick={go(page - 1)} disabled={page <= 1}>{ARROW("m15 18-6-6 6-6")}Previous</button>
      <ul className="ui-pagination-pages">
        {pageList(page, count).map((n, i) => (
          <li key={i}>{n === null ? <span className="ui-page-gap" aria-hidden="true">…</span>
            : <button type="button" className="ui-page" aria-current={n === page ? "page" : undefined} aria-label={`Page ${n}`} onClick={go(n)}>{n}</button>}</li>
        ))}
      </ul>
      <span className="ui-pagination-info" aria-live="polite">{`Page ${page} of ${count}`}</span>
      <button type="button" className="ui-btn ui-btn--sm" onClick={go(page + 1)} disabled={page >= count}>Next{ARROW("m9 18 6-6-6-6")}</button>
    </nav>
  );
}
