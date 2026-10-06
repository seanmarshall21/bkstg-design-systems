import { useRef, useState } from "react";
import { cx } from "./cx.js";

/**
 * <Tree label="Files" items={[{ id: "a", label: "Artwork", icon, children: [{ id: "a1", label: "Poster.pdf" }] }]} selected={id} onSelect={setId} />
 * Up and Down move, Right opens or steps in, Left closes or steps out, Home and End, Enter selects. One tab stop.
 */
export function Tree({ label, items, selected, onSelect, defaultOpen = [], className }) {
  const [open, setOpen] = useState(() => new Set(defaultOpen));
  const [focus, setFocus] = useState(selected || items[0]?.id);
  const root = useRef(null);
  const visible = [];
  const walk = (list, parent) => list.forEach((it) => { visible.push({ it, parent }); if (it.children && open.has(it.id)) walk(it.children, it.id); });
  walk(items, null);
  const go = (id) => { setFocus(id); requestAnimationFrame(() => root.current?.querySelector(`[data-id="${id}"]`)?.focus()); };
  const toggle = (id, on) => setOpen((s) => { const n = new Set(s); (on ?? !n.has(id)) ? n.add(id) : n.delete(id); return n; });
  function onKey(e) {
    const i = visible.findIndex((v) => v.it.id === focus), cur = visible[i]; if (!cur) return;
    const has = !!cur.it.children, isOpen = open.has(cur.it.id);
    const k = e.key;
    if (k === "ArrowDown" && visible[i + 1]) go(visible[i + 1].it.id);
    else if (k === "ArrowUp" && visible[i - 1]) go(visible[i - 1].it.id);
    else if (k === "Home") go(visible[0].it.id);
    else if (k === "End") go(visible[visible.length - 1].it.id);
    else if (k === "ArrowRight" && has) { if (!isOpen) toggle(cur.it.id, true); else go(cur.it.children[0].id); }
    else if (k === "ArrowLeft") { if (has && isOpen) toggle(cur.it.id, false); else if (cur.parent) go(cur.parent); }
    else if (k === "Enter" || k === " ") { onSelect?.(cur.it.id); if (has) toggle(cur.it.id); }
    else return;
    e.preventDefault();
  }
  const render = (list, level) => list.map((it) => (
    <li key={it.id} data-id={it.id} role="treeitem" aria-level={level} aria-selected={it.id === selected} aria-expanded={it.children ? open.has(it.id) : undefined}
      tabIndex={it.id === focus ? 0 : -1}>
      <div className="ui-tree-row" onClick={() => { setFocus(it.id); onSelect?.(it.id); if (it.children) toggle(it.id); }}>
        {it.children ? <span className="ui-tree-caret" aria-hidden="true" /> : <span className="ui-tree-leaf" aria-hidden="true" />}{it.icon}{it.label}
      </div>
      {it.children ? <ul role="group">{render(it.children, level + 1)}</ul> : null}
    </li>
  ));
  return <ul ref={root} className={cx("ui-tree", className)} role="tree" aria-label={label} onKeyDown={onKey}>{render(items, 1)}</ul>;
}
