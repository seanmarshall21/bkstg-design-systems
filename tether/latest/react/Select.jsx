import { forwardRef } from "react";
import { cx } from "./cx.js";

/**
 * <Select value={v} onChange={...} options={[{ value: "a", label: "A" }]} />
 * A native <select>: the phone's own picker, full keyboard support, works in forms.
 */
export const Select = forwardRef(function Select({ options = [], className, children, ...rest }, ref) {
  return (
    <span className={cx("ui-select", className)}>
      <select ref={ref} className="ui-input" {...rest}>
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>
        ))}
        {children}
      </select>
    </span>
  );
});
