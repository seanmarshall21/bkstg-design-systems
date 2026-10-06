import { useId, useLayoutEffect, useRef, useState } from "react";
import { cx } from "./cx.js";

/**
 * <Tabs label="Settings" tabs={[{ id: "a", label: "Account", content: <p>…</p> }]} />
 * variant: "underline" (default) | "pill". Controlled with value + onChange, or uncontrolled.
 * Arrows, Home and End move between tabs; the indicator slides to the selected one.
 */
export function Tabs({ tabs, label, variant = "underline", value, defaultValue, onChange, className }) {
  const base = useId();
  const [inner, setInner] = useState(defaultValue ?? tabs.find((t) => !t.disabled)?.id);
  const current = value ?? inner;
  const refs = useRef({});
  const indicator = useRef(null);
  const listRef = useRef(null);

  function choose(id, focus) {
    if (value === undefined) setInner(id);
    onChange?.(id);
    if (focus) refs.current[id]?.focus();
  }
  function onKey(e, id) {
    const on = tabs.filter((t) => !t.disabled);
    const i = on.findIndex((t) => t.id === id);
    const next = { ArrowRight: on[(i + 1) % on.length], ArrowLeft: on[(i - 1 + on.length) % on.length], Home: on[0], End: on[on.length - 1] }[e.key];
    if (next) { e.preventDefault(); choose(next.id, true); }
  }
  useLayoutEffect(() => {
    function move() {
      const t = refs.current[current];
      if (!t || !indicator.current) return;
      indicator.current.style.setProperty("--x", `${t.offsetLeft}px`);
      indicator.current.style.setProperty("--w", `${t.offsetWidth}px`);
    }
    move();
    if (typeof ResizeObserver === "undefined" || !listRef.current) return undefined;
    const ro = new ResizeObserver(move);
    ro.observe(listRef.current);
    return () => ro.disconnect();
  }, [current, tabs]);

  return (
    <div className={cx("ui-tabs", variant === "pill" && "ui-tabs--pill", className)}>
      <div className="ui-tablist" role="tablist" aria-label={label} ref={listRef}>
        {tabs.map((t) => (
          <button
            key={t.id}
            ref={(el) => { refs.current[t.id] = el; }}
            type="button"
            role="tab"
            id={`${base}-tab-${t.id}`}
            className="ui-tab"
            aria-selected={t.id === current}
            aria-controls={`${base}-panel-${t.id}`}
            tabIndex={t.id === current ? 0 : -1}
            disabled={t.disabled}
            onClick={() => choose(t.id, false)}
            onKeyDown={(e) => onKey(e, t.id)}
          >
            {t.label}
          </button>
        ))}
        <span className="ui-tab-indicator" aria-hidden="true" ref={indicator} />
      </div>
      {tabs.map((t) => (
        <div
          key={t.id}
          className="ui-tabpanel"
          role="tabpanel"
          id={`${base}-panel-${t.id}`}
          aria-labelledby={`${base}-tab-${t.id}`}
          tabIndex={0}
          hidden={t.id !== current}
        >
          {t.content}
        </div>
      ))}
    </div>
  );
}
