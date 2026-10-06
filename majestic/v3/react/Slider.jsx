import { useId, useState } from "react";
import { cx } from "./cx.js";

/**
 * <Slider label="Capacity" min={0} max={5000} step={100} value={cap} onChange={setCap} format={(v) => `${v} people`} />
 * A native range input: arrow keys, Page Up/Down, Home and End all work. The value is shown beside the label
 * and spoken through aria-valuetext when format is given.
 */
export function Slider({ label, min = 0, max = 100, step = 1, value, defaultValue, onChange, format, scale, className, ...rest }) {
  const id = useId();
  const [own, setOwn] = useState(defaultValue ?? min);
  const v = value ?? own;
  const pct = ((v - min) / (max - min || 1)) * 100;
  const text = format ? format(v) : Number(v).toLocaleString();
  return (
    <div className={className}>
      {label ? <div className="ui-slider-head"><label className="ui-label" htmlFor={id}>{label}</label><output htmlFor={id}>{text}</output></div> : null}
      <input
        id={id} type="range" className="ui-slider" min={min} max={max} step={step} value={v}
        aria-valuetext={format ? text : undefined} style={{ "--value": `${pct}%` }}
        onChange={(e) => { const n = Number(e.target.value); setOwn(n); onChange?.(n, e); }}
        {...rest}
      />
      {scale ? <div className="ui-slider-scale" aria-hidden="true">{scale.map((s) => <span key={s}>{s}</span>)}</div> : null}
    </div>
  );
}
