import { cx } from "./cx.js";

/**
 * <Metric label="Tickets sold" value="18,880" change="+7.4%" />   change starting with "-" reads as down.
 * <Metric label="Refund requests" value="12" change="-2.0%" goodWhen="down" />   for numbers where less is better.
 * The arrow is decoration; the change is spoken as "up 7.4%, better" or "down 2%, better"; its color says good or bad.
 */
export function Metric({ label, value, change, goodWhen = "up", className }) {
  const down = typeof change === "string" && change.trim().startsWith("-");
  const good = down === (goodWhen === "down");
  const amount = change ? change.replace(/^[+-]/, "") : "";
  return (
    <div className={cx("ui-metric", className)}>
      <span className="ui-metric-label">{label}</span>
      <span className="ui-metric-row">
        <span className="ui-metric-value">{value}</span>
        {change ? (
          <span className={cx("ui-metric-delta", down && "ui-metric-delta--down", good ? "ui-metric-delta--good" : "ui-metric-delta--bad")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {down ? <path d="M7 7l10 10M17 7v10H7" /> : <path d="M7 17 17 7M7 7h10v10" />}
            </svg>
            <span className="ui-sr-only">{down ? "down" : "up"} </span>{amount}<span className="ui-sr-only">, {good ? "better" : "worse"}</span>
          </span>
        ) : null}
      </span>
    </div>
  );
}
