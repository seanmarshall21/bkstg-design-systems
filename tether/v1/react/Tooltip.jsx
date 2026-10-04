import { cloneElement, useId, useState } from "react";
import { cx } from "./cx.js";

/**
 * <Tooltip text="Copy link"><button aria-label="Copy">…</button></Tooltip>
 * Shows on hover and keyboard focus, after --tooltip-delay. Escape hides it until the pointer or focus leaves.
 * side: "top" (default) | "bottom". The child must be focusable.
 */
export function Tooltip({ text, side = "top", children, className }) {
  const id = useId();
  const [dismissed, setDismissed] = useState(false);
  const child = cloneElement(children, { "aria-describedby": id });
  return (
    <span
      className={cx("ui-tooltip-wrap", dismissed && "is-dismissed", className)}
      data-side={side === "bottom" ? "bottom" : undefined}
      onKeyDown={(e) => { if (e.key === "Escape") setDismissed(true); }}
      onMouseLeave={() => setDismissed(false)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDismissed(false); }}
    >
      {child}
      <span role="tooltip" id={id} className="ui-tooltip">{text}</span>
    </span>
  );
}
