import { forwardRef, useId } from "react";
import { cx } from "./cx.js";

/**
 * <Field label="Email" hint="We never share it." error={err}> wraps any one control,
 * wiring the label, the hint and the error to it for screen readers.
 * <Input /> and <Textarea /> are the bare controls.
 */
export function Field({ label, hint, error, children, className }) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const control = typeof children === "function"
    ? children({ id, "aria-describedby": [hintId, errorId].filter(Boolean).join(" ") || undefined, "aria-invalid": error ? true : undefined })
    : children;
  return (
    <div className={cx("ui-field", className)}>
      {label ? <label className="ui-label" htmlFor={id}>{label}</label> : null}
      {control}
      {hint ? <span className="ui-hint" id={hintId}>{hint}</span> : null}
      {error ? <span className="ui-error" id={errorId}>{error}</span> : null}
    </div>
  );
}

export const Input = forwardRef(function Input({ className, ...rest }, ref) {
  return <input ref={ref} className={cx("ui-input", className)} {...rest} />;
});

export const Textarea = forwardRef(function Textarea({ className, ...rest }, ref) {
  return <textarea ref={ref} className={cx("ui-input", className)} {...rest} />;
});
