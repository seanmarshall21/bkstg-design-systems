import { cx } from "./cx.js";

/**
 * <Compare label="Tickets sold, this year against last" items={[{ label: "This year", value: 18880 }, { label: "Last year", value: 16740 }]} />
 * The first item is the one that matters; the bars share one scale; the difference is written out.
 * format(n) turns a number into text (default: 18,880).
 */
export function Compare({ label, items, format = n => Number(n).toLocaleString("en-US"), className }) {
  const max = Math.max(...items.map(i => i.value), 1), [a, b] = items;
  const diff = b ? a.value - b.value : 0, pct = b && b.value ? Math.round(Math.abs(diff) / b.value * 1000) / 10 : 0;
  return (
    <div className={cx("ui-compare", className)} role="group" aria-label={label}>
      {items.map(it => (
        <div className="ui-compare-row" key={it.label}>
          <span className="ui-compare-label">{it.label}</span>
          <span className="ui-compare-bar" aria-hidden="true"><span style={{ "--value": `${Math.round(it.value / max * 100)}%` }} /></span>
          <strong className="ui-compare-value">{format(it.value)}</strong>
        </div>
      ))}
      {b ? <p className="ui-compare-diff">{diff === 0 ? `The same as ${b.label.toLowerCase()}` : `${format(Math.abs(diff))} (${pct}%) ${diff > 0 ? "more" : "less"} than ${b.label.toLowerCase()}`}</p> : null}
    </div>
  );
}

const STATE_WORD = { done: "Done", current: "In progress", upcoming: "Upcoming" };
/**
 * <Timeline label="Campaign" items={[{ title: "Kickoff", text: "Direction agreed", time: "Jan 14", state: "done" }]} />
 * state: done | current | upcoming. The state is written, not only shown by the dot.
 */
export function Timeline({ label, items, className }) {
  return (
    <ol className={cx("ui-timeline", className)} aria-label={label}>
      {items.map(it => (
        <li className="ui-timeline-item" data-state={it.state || "upcoming"} key={it.title} aria-current={it.state === "current" ? "step" : undefined}>
          <span className="ui-timeline-dot" aria-hidden="true" />
          <div>
            <p className="ui-timeline-title">{it.title}<span className={cx("ui-badge", it.state === "done" ? "ui-badge--ok" : it.state === "current" ? "ui-badge--brand" : "ui-badge--outline")}>{STATE_WORD[it.state || "upcoming"]}</span></p>
            {it.text ? <p className="ui-timeline-text">{it.text}</p> : null}
            {it.time ? <span className="ui-timeline-time">{it.time}</span> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

/** <StatGrid label="This week" items={[{ label: "Active projects", value: "9", note: "+2 since Monday" }]} /> */
export function StatGrid({ label, items, className }) {
  return (
    <dl className={cx("ui-statgrid", className)} aria-label={label}>
      {items.map(it => <div key={it.label}><dt>{it.label}</dt><dd>{it.value}</dd>{it.note ? <small>{it.note}</small> : null}</div>)}
    </dl>
  );
}
