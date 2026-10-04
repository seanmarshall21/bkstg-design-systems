import { useId } from "react";
import { cx } from "./cx.js";

/**
 * <RadioGroup legend="Ticket type" value={type} onChange={setType} options={[
 *   { value: "ga", label: "General admission", hint: "Both days" }, { value: "vip", label: "VIP" } ]} />
 * Native radios in a fieldset: the arrow keys move the choice, Tab leaves the group.
 */
export function RadioGroup({ legend, name, value, defaultValue, onChange, options, className }) {
  const auto = useId();
  const group = name || auto;
  return (
    <fieldset className={cx("ui-choices", className)}>
      {legend ? <legend className="ui-label">{legend}</legend> : null}
      {options.map((o) => (
        <label key={o.value} className="ui-check-row">
          <input
            type="radio" className="ui-radio" name={group} value={o.value} disabled={o.disabled}
            {...(value !== undefined ? { checked: value === o.value } : { defaultChecked: defaultValue === o.value })}
            onChange={(e) => onChange?.(e.target.value, e)}
          />
          {o.hint ? <span className="ui-check-text">{o.label}<small>{o.hint}</small></span> : o.label}
        </label>
      ))}
    </fieldset>
  );
}
