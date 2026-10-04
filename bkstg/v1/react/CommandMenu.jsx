import { useEffect, useId, useMemo, useRef, useState } from "react";
import { cx } from "./cx.js";

const SEARCH = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>;

/**
 * <CommandMenu open={open} onOpenChange={setOpen} groups={[{ label: "Go to", items: [{ id: "lineup", label: "Lineup", icon, hint: "G L", keywords: "artists", onRun }] }]} />
 * A dialog with a search box over a list: type to filter, arrows to move, Enter to run. ⌘K or Ctrl+K opens it.
 */
export function CommandMenu({ open, onOpenChange, groups, placeholder = "Type a command or search…", className }) {
  const id = useId(), dlg = useRef(null), input = useRef(null);
  const [q, setQ] = useState(""), [active, setActive] = useState(0);
  useEffect(() => {
    const key = (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); onOpenChange?.(!open); } };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [open, onOpenChange]);
  useEffect(() => {
    const d = dlg.current; if (!d) return;
    if (open && !d.open) { setQ(""); setActive(0); d.showModal(); input.current?.focus(); }
    if (!open && d.open) d.close();
  }, [open]);
  const shown = useMemo(() => groups.map((g) => ({ ...g, items: g.items.filter((it) => !q || `${it.label} ${it.keywords || ""}`.toLowerCase().includes(q.toLowerCase())) })).filter((g) => g.items.length), [groups, q]);
  const flat = shown.flatMap((g) => g.items);
  const run = (it) => { if (!it) return; onOpenChange?.(false); it.onRun?.(); };
  function onKey(e) {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (a + 1) % Math.max(flat.length, 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (a - 1 + flat.length) % Math.max(flat.length, 1)); }
    else if (e.key === "Enter") { e.preventDefault(); run(flat[active]); }
  }
  let n = -1;
  return (
    <dialog ref={dlg} className={cx("ui-dialog ui-command", className)} aria-label="Command menu" onClose={() => onOpenChange?.(false)} onClick={(e) => { if (e.target === dlg.current) onOpenChange?.(false); }}>
      <div className="ui-command-search">{SEARCH}
        <input ref={input} role="combobox" aria-expanded="true" aria-controls={`${id}-list`} aria-autocomplete="list" aria-label="Search commands"
          aria-activedescendant={flat[active] ? `${id}-${flat[active].id}` : undefined} placeholder={placeholder} value={q}
          onChange={(e) => { setQ(e.target.value); setActive(0); }} onKeyDown={onKey} />
      </div>
      <div className="ui-command-list" id={`${id}-list`} role="listbox" aria-label="Commands">
        {shown.map((g) => (
          <div key={g.label} role="group" aria-label={g.label}>
            <div className="ui-command-group" aria-hidden="true">{g.label}</div>
            {g.items.map((it) => { n += 1; const me = n; return (
              <div key={it.id} id={`${id}-${it.id}`} role="option" className="ui-command-item" aria-selected={me === active}
                onMouseMove={() => setActive(me)} onClick={() => run(it)}>{it.icon}{it.label}{it.hint ? <kbd>{it.hint}</kbd> : null}</div>
            ); })}
          </div>
        ))}
        {!flat.length ? <p className="ui-command-empty">Nothing matches "{q}".</p> : null}
      </div>
      <div className="ui-command-foot" aria-hidden="true"><span><kbd className="ui-kbd">↑</kbd> <kbd className="ui-kbd">↓</kbd> move</span><span><kbd className="ui-kbd">↵</kbd> run</span><span><kbd className="ui-kbd">esc</kbd> close</span></div>
    </dialog>
  );
}
