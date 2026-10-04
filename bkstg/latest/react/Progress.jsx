import { cx } from "./cx.js";

/**
 * <Progress value={62} label="Uploading" />   0 to 100
 * <Progress label="Loading" />                 no value: indeterminate
 * label is required: it is the progress bar's accessible name.
 */
export function Progress({ value, label, showValue = true, className }) {
  const known = typeof value === "number";
  const v = known ? Math.max(0, Math.min(100, value)) : undefined;
  return (
    <div className={className}>
      {showValue ? <div className="ui-progress-label"><span>{label}</span>{known ? <span>{Math.round(v)}%</span> : null}</div> : null}
      <div
        className={cx("ui-progress", !known && "ui-progress--indeterminate")}
        role="progressbar"
        aria-label={label}
        aria-valuemin={known ? 0 : undefined}
        aria-valuemax={known ? 100 : undefined}
        aria-valuenow={known ? Math.round(v) : undefined}
      >
        <div className="ui-progress-bar" style={known ? { "--value": `${v}%` } : undefined} />
      </div>
    </div>
  );
}
