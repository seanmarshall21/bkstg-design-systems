import { useEffect, useRef, useState } from "react";
import { cx } from "./cx.js";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DOW = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"], DOW_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const toIso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const fromIso = (s) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ""); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; };
const Arrow = ({ d }) => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>;

/**
 * <Calendar value="2026-04-18" onChange={setDate} events={["2026-04-11"]} />
 * A month as a grid: arrows move a day, Page Up/Down a month, Home/End the week. Dates are "YYYY-MM-DD" strings.
 */
export function Calendar({ value, onChange, events = [], today = new Date(), autoFocus = false, label, className }) {
  const [cursor, setCursor] = useState(() => fromIso(value) || today);
  const focus = useRef(autoFocus), grid = useRef(null);
  useEffect(() => { if (focus.current) grid.current?.querySelector('[tabindex="0"]')?.focus(); focus.current = false; });
  const y = cursor.getFullYear(), mo = cursor.getMonth(), start = new Date(y, mo, 1 - new Date(y, mo, 1).getDay());
  const move = (days, months) => { focus.current = true; setCursor((c) => (months ? new Date(c.getFullYear(), c.getMonth() + months, Math.min(c.getDate(), 28)) : new Date(c.getFullYear(), c.getMonth(), c.getDate() + days))); };
  function onKey(e) {
    const m = { ArrowLeft: [-1], ArrowRight: [1], ArrowUp: [-7], ArrowDown: [7], Home: [-cursor.getDay()], End: [6 - cursor.getDay()], PageUp: [0, -1], PageDown: [0, 1] }[e.key];
    if (m) { e.preventDefault(); move(m[0], m[1]); }
  }
  const titleId = `cal-${y}-${mo}`;
  return (
    <div className={cx("ui-calendar", className)}>
      <div className="ui-calendar-head">
        <button type="button" className="ui-btn ui-btn--sm ui-btn--icon ui-btn--ghost" aria-label="Previous month" onClick={() => setCursor(new Date(y, mo - 1, 1))}><Arrow d="m15 18-6-6 6-6" /></button>
        <h3 className="ui-calendar-title" id={titleId} aria-live="polite">{`${MONTHS[mo]} ${y}`}</h3>
        <button type="button" className="ui-btn ui-btn--sm ui-btn--icon ui-btn--ghost" aria-label="Next month" onClick={() => setCursor(new Date(y, mo + 1, 1))}><Arrow d="m9 18 6-6-6-6" /></button>
      </div>
      <table role="grid" aria-labelledby={titleId} aria-label={label} ref={grid} onKeyDown={onKey}>
        <thead><tr>{DOW.map((d, i) => <th key={d} scope="col" abbr={DOW_LONG[i]}>{d}</th>)}</tr></thead>
        <tbody>
          {Array.from({ length: 6 }, (_, w) => (
            <tr key={w}>
              {Array.from({ length: 7 }, (_, d) => {
                const day = new Date(start.getFullYear(), start.getMonth(), start.getDate() + w * 7 + d), s = toIso(day), ev = events.includes(s);
                return (
                  <td key={s} role="gridcell">
                    <button
                      type="button" className="ui-day" tabIndex={s === toIso(cursor) ? 0 : -1}
                      aria-label={`${DOW_LONG[day.getDay()]}, ${MONTHS[day.getMonth()]} ${day.getDate()}${ev ? ", has events" : ""}`}
                      aria-current={s === toIso(today) ? "date" : undefined} aria-selected={s === value}
                      data-outside={day.getMonth() !== mo ? "" : undefined} data-event={ev ? "" : undefined}
                      onClick={() => { setCursor(day); onChange?.(s); }}
                    >{day.getDate()}</button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
