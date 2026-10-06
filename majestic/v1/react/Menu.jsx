import { useEffect, useId, useRef, useState } from "react";
import { cx } from "./cx.js";

const CHEVRON = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>;

/**
 * <Menu label="Options" items={[
 *   { label: "Edit", icon: <PencilIcon />, hint: "⌘E", onSelect: edit },
 *   { separator: true },
 *   { label: "Delete", danger: true, onSelect: remove } ]} />
 * The menu button pattern: Enter, Space or ArrowDown opens on the first item, ArrowUp on the last; arrows,
 * Home and End move; a letter jumps; Escape closes and focus returns to the button. A { heading } item labels a section.
 * ariaLabel: what a screen reader calls the button when its visible label is short ("Move", on every card).
 */
export function Menu({ label, ariaLabel, items, align, buttonClassName, className }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [flip, setFlip] = useState(false);
  const btn = useRef(null), menu = useRef(null), start = useRef("first");
  const enabled = () => [...(menu.current?.querySelectorAll('[role="menuitem"]:not([aria-disabled="true"])') || [])];

  useEffect(() => {
    if (!open) return;
    const list = enabled();
    (start.current === "last" ? list[list.length - 1] : list[0])?.focus();
    setFlip(align === "end" || (menu.current && menu.current.getBoundingClientRect().right > window.innerWidth - 8));
    const outside = (e) => { if (!menu.current?.contains(e.target) && !btn.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, [open]);

  function close(back) { setOpen(false); if (back) btn.current?.focus(); }
  function onButtonKey(e) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); start.current = e.key === "ArrowUp" ? "last" : "first"; setOpen(true); }
  }
  function onMenuKey(e) {
    const list = enabled(), i = list.indexOf(document.activeElement);
    let next = null;
    if (e.key === "ArrowDown") next = list[(i + 1) % list.length];
    else if (e.key === "ArrowUp") next = list[(i - 1 + list.length) % list.length];
    else if (e.key === "Home") next = list[0];
    else if (e.key === "End") next = list[list.length - 1];
    else if (e.key === "Escape") { e.preventDefault(); return close(true); }
    else if (e.key === "Tab") return close(false);
    else if (e.key.length === 1 && /\S/.test(e.key)) {
      const order = [...list.slice(i + 1), ...list.slice(0, i + 1)];
      next = order.find((x) => x.textContent.trim().toLowerCase().startsWith(e.key.toLowerCase())) || null;
    }
    if (next) { e.preventDefault(); next.focus(); }
  }

  return (
    <span className={cx("ui-menu-wrap", className)} data-align={flip ? "end" : undefined}>
      <button
        ref={btn} type="button" className={cx("ui-btn ui-menu-trigger", buttonClassName)}
        aria-haspopup="menu" aria-expanded={open} aria-controls={id} aria-label={ariaLabel}
        onClick={() => { start.current = "first"; setOpen((o) => !o); }} onKeyDown={onButtonKey}
      >
        {label}{CHEVRON}
      </button>
      <div ref={menu} id={id} className="ui-menu" role="menu" aria-label={typeof label === "string" ? label : undefined} hidden={!open} onKeyDown={onMenuKey}>
        {items.map((it, i) => it.separator ? <div key={i} className="ui-menu-sep" role="separator" />
          : it.heading ? <div key={i} className="ui-menu-label" role="presentation">{it.heading}</div>
          : (
            <button
              key={i} type="button" role="menuitem" tabIndex={-1}
              className={cx("ui-menu-item", it.danger && "ui-menu-item--danger")}
              aria-disabled={it.disabled || undefined}
              onClick={() => { if (it.disabled) return; it.onSelect?.(); close(true); }}
            >
              {it.icon}{it.label}{it.hint ? <span className="ui-menu-hint" aria-hidden="true">{it.hint}</span> : null}
            </button>
          ))}
      </div>
    </span>
  );
}
