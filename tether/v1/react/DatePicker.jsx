import { useEffect, useRef, useState } from "react";
import { cx } from "./cx.js";
import { Calendar, fromIso } from "./Calendar.jsx";

const CAL = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>;

/**
 * <DatePicker label="Show date" value={date} onChange={setDate} placeholder="Pick a date" />
 * A button showing the date; it opens a calendar under it. A choice, Escape or a click outside closes it.
 */
export function DatePicker({ value, onChange, placeholder = "Pick a date", label, className }) {
  const [open, setOpen] = useState(false);
  const root = useRef(null), btn = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const out = (e) => { if (!root.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", out);
    return () => document.removeEventListener("mousedown", out);
  }, [open]);
  const d = fromIso(value);
  return (
    <div ref={root} className={cx("ui-datepicker", className)} onKeyDown={(e) => { if (e.key === "Escape" && open) { e.stopPropagation(); setOpen(false); btn.current?.focus(); } }}>
      <button ref={btn} type="button" className="ui-input ui-datepicker-btn" aria-haspopup="dialog" aria-expanded={open} aria-label={label ? `${label}: ${d ? d.toDateString() : "none"}` : undefined}
        data-empty={d ? undefined : ""} onClick={() => setOpen((o) => !o)}>
        {CAL}<span>{d ? d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" }) : placeholder}</span>
      </button>
      {open ? (
        <div className="ui-datepicker-pop" role="dialog" aria-label={label || "Choose a date"}>
          <Calendar value={value} autoFocus onChange={(s) => { onChange?.(s); setOpen(false); btn.current?.focus(); }} />
        </div>
      ) : null}
    </div>
  );
}
