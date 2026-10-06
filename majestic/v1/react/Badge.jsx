import { cx } from "./cx.js";

/**
 * <Badge tone="ok" dot>Live</Badge>
 * tone: "neutral" (default) | "ok" | "warn" | "critical" | "brand" | "outline"
 */
export function Badge({ tone = "neutral", dot = false, className, children, ...rest }) {
  return (
    <span className={cx("ui-badge", tone !== "neutral" && `ui-badge--${tone}`, className)} {...rest}>
      {dot ? <span className="ui-badge-dot" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}
