import { cx } from "./cx.js";

/**
 * <Divider />  a plain rule
 * <Divider>or</Divider>  a rule with a word or a button in the middle; align="start" puts it near the left
 */
export function Divider({ children, align, className }) {
  if (!children) return <hr className={cx("ui-divider", className)} />;
  return <div className={cx("ui-divider", align === "start" && "ui-divider--start", className)} role="separator">{children}</div>;
}
