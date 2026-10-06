import { cx } from "./cx.js";

/**
 * <ButtonGroup label="View" value={view} onChange={setView} items={[
 *   { value: "list", label: "List" }, { value: "board", label: "Board" } ]} />
 * One pressed at a time. With multiple, value is an array and each button toggles on its own.
 * Each button reports its state with aria-pressed.
 */
export function ButtonGroup({ label, items, value, onChange, multiple = false, className }) {
  const on = (v) => (multiple ? (value || []).includes(v) : value === v);
  function press(v) {
    if (!onChange) return;
    if (!multiple) return onChange(v);
    const list = value || [];
    onChange(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  }
  return (
    <div className={cx("ui-btngroup", className)} role="group" aria-label={label}>
      {items.map((it) => (
        <button
          key={it.value} type="button" className="ui-btngroup-item" disabled={it.disabled}
          aria-pressed={on(it.value)} aria-label={it.ariaLabel} onClick={() => press(it.value)}
        >
          {it.icon}{it.label}
        </button>
      ))}
    </div>
  );
}
