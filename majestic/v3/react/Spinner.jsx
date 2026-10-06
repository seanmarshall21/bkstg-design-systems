import { cx } from "./cx.js";

/**
 * <Spinner label="Loading results" size="sm" />
 * role="status" so a screen reader announces the label; the ring itself is decoration.
 */
export function Spinner({ label = "Loading", size = "md", className }) {
  return (
    <span role="status" className={className}>
      <span className={cx("ui-spinner", size !== "md" && `ui-spinner--${size}`)} aria-hidden="true" />
      <span className="ui-sr-only">{label}</span>
    </span>
  );
}
