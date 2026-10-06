import { forwardRef } from "react";
import { cx } from "./cx.js";

/**
 * <Switch checked={on} onChange={(e) => setOn(e.target.checked)}>Notifications</Switch>
 * A real checkbox with role="switch": Space toggles it, forms submit it.
 */
export const Switch = forwardRef(function Switch({ children, className, ...rest }, ref) {
  const input = <input ref={ref} type="checkbox" role="switch" className={cx("ui-switch", className)} {...rest} />;
  return children ? <label className="ui-switch-row">{input}{children}</label> : input;
});
