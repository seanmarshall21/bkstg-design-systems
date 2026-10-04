import { useId } from "react";
import { cx } from "./cx.js";

/**
 * <ColorPicker label="Stage color" value={color} onChange={setColor} swatches={["#c6f135", "#4f46e5", "#db2777"]} />
 * Swatches (a radio group: arrows move), the browser's own picker, and a hex field, all in step.
 */
export function ColorPicker({ label, value, onChange, swatches = [], className }) {
  const id = useId();
  const valid = /^#[0-9a-f]{6}$/i.test(value || "");
  return (
    <div className={cx("ui-colorpick", className)}>
      <span className="ui-label" id={`${id}-l`}>{label}</span>
      {swatches.length ? (
        <div className="ui-swatches" role="radiogroup" aria-labelledby={`${id}-l`}
          onKeyDown={(e) => {
            const i = swatches.findIndex((s) => s.toLowerCase() === (value || "").toLowerCase());
            const n = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
            if (n) { e.preventDefault(); const next = swatches[(i + n + swatches.length) % swatches.length]; onChange?.(next); e.currentTarget.querySelectorAll(".ui-swatch")[swatches.indexOf(next)]?.focus(); }
          }}>
          {swatches.map((s, i) => {
            const on = s.toLowerCase() === (value || "").toLowerCase();
            return <button key={s} type="button" role="radio" className="ui-swatch" style={{ background: s }} aria-label={s} aria-checked={on}
              tabIndex={on || (!swatches.some((x) => x.toLowerCase() === (value || "").toLowerCase()) && i === 0) ? 0 : -1} onClick={() => onChange?.(s)} />;
          })}
        </div>
      ) : null}
      <div className="ui-colorpick-row">
        <input type="color" aria-label={`${label}, picker`} value={valid ? value : "#000000"} onChange={(e) => onChange?.(e.target.value)} />
        <input type="text" className="ui-input" aria-label={`${label}, hex`} defaultValue={value} key={value} maxLength={7} spellCheck={false}
          aria-invalid={!valid || undefined} onChange={(e) => { const v = e.target.value.trim(); if (/^#?[0-9a-f]{6}$/i.test(v)) onChange?.(v[0] === "#" ? v : `#${v}`); }} />
      </div>
    </div>
  );
}
