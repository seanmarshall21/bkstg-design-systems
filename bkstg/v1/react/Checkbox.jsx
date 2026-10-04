import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { cx } from "./cx.js";

/**
 * <Checkbox checked={on} onChange={(e) => setOn(e.target.checked)} hint="We send one a week.">Newsletter</Checkbox>
 * A real checkbox: Space toggles it, its label is clickable, forms submit it.
 * indeterminate shows the mixed state, for a "select all" box when only some are checked.
 */
export const Checkbox = forwardRef(function Checkbox({ children, hint, indeterminate = false, className, ...rest }, ref) {
  const inner = useRef(null);
  useImperativeHandle(ref, () => inner.current);
  // indeterminate is a property, never an attribute, so it is set on the element; the browser then reports "mixed"
  useEffect(() => { if (inner.current) inner.current.indeterminate = indeterminate; }, [indeterminate]);
  const input = <input ref={inner} type="checkbox" className={cx("ui-check", className)} {...rest} />;
  if (!children) return input;
  return (
    <label className="ui-check-row">
      {input}
      {hint ? <span className="ui-check-text">{children}<small>{hint}</small></span> : children}
    </label>
  );
});

/** <Choices legend="Notify me about">…checkboxes or radios…</Choices>: a fieldset, so the group has a name */
export function Choices({ legend, children, className, ...rest }) {
  return (
    <fieldset className={cx("ui-choices", className)} {...rest}>
      {legend ? <legend className="ui-label">{legend}</legend> : null}
      {children}
    </fieldset>
  );
}
