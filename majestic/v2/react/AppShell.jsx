import { useEffect, useId, useRef, useState } from "react";
import { cx } from "./cx.js";

const NARROW = 720; // keep in step with the @container query in components.css
const Icon = ({ d }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>;
const PANEL = <Icon d={<><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18" /></>} />;
const MENU = <Icon d={<path d="M4 6h16M4 12h16M4 18h16" />} />;
const CHEV = <Icon d={<path d="m6 9 6 6 6-6" />} />;

/**
 * The app sidebar with a flyout, after the BKSTG workbench's own. Wide, it collapses to an icon rail; under
 * 720px it slides over the page as a drawer (Escape or a tap outside closes it).
 * <AppShell brand="BKSTG" title="Overview" label="Main" items={[
 *   { href: "/", label: "Overview", icon: <HomeIcon />, current: true },
 *   { href: "/lineup", label: "Lineup", icon: <MusicIcon />, count: 24 },
 *   { label: "Production", icon: <TruckIcon />, open: true, items: [{ href: "/stages", label: "Stages" }] },
 *   { heading: "Departments" },
 *   { href: "/booking", label: "Booking", icon: <MicIcon /> },
 * ]} footer={[{ href: "/settings", label: "Settings", icon: <GearIcon /> }]}>…the page…</AppShell>
 */
export function AppShell({ brand, title, label = "Main", items = [], footer = [], defaultCollapsed = false, children, className }) {
  const id = useId().replace(/:/g, ""), sbId = `sb-${id}`;
  const root = useRef(null), side = useRef(null), opener = useRef(null);
  const [narrow, setNarrow] = useState(false);
  const [open, setOpen] = useState(!defaultCollapsed);
  const [groups, setGroups] = useState(() => new Set(items.filter((it) => it.items && it.open).map((it) => it.label)));
  useEffect(() => {
    if (!root.current || typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(([e]) => { const n = e.contentRect.width <= NARROW; setNarrow(n); if (n) setOpen(false); });
    ro.observe(root.current);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    if (!(narrow && open)) return undefined;
    side.current?.querySelector(".ui-sidebar-toggle, .ui-sidebar-item")?.focus();
    const key = (e) => { if (e.key === "Escape") { setOpen(false); opener.current?.focus(); } };
    const tap = (e) => { if (side.current && !side.current.contains(e.target) && !opener.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("keydown", key); document.addEventListener("mousedown", tap);
    return () => { document.removeEventListener("keydown", key); document.removeEventListener("mousedown", tap); };
  }, [narrow, open]);
  const toggleGroup = (name) => {
    if (!open && !narrow) { setOpen(true); setGroups((s) => new Set(s).add(name)); return; }
    setGroups((s) => { const n = new Set(s); n.has(name) ? n.delete(name) : n.add(name); return n; });
  };
  const link = (it, sub) => (
    <a key={it.href + it.label} className="ui-sidebar-item" href={it.href} title={sub ? undefined : it.label} aria-current={it.current ? "page" : undefined}>
      {it.icon ? <span aria-hidden="true" style={{ display: "contents" }}>{it.icon}</span> : null}
      <span className="ui-sidebar-label">{it.label}</span>
      {it.count != null ? <span className="ui-sidebar-count">{it.count}</span> : null}
    </a>
  );
  const entry = (it) => {
    if (it.heading) return <p key={"h-" + it.heading} className="ui-sidebar-head">{it.heading}</p>;
    if (!it.items) return link(it);
    const bodyId = `${sbId}-${it.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, isOpen = groups.has(it.label) && (open || narrow);
    return (
      <div key={"g-" + it.label} className="ui-sidebar-group">
        <button type="button" className="ui-sidebar-item" aria-expanded={isOpen} aria-controls={bodyId} title={it.label} onClick={() => toggleGroup(it.label)}>
          {it.icon ? <span aria-hidden="true" style={{ display: "contents" }}>{it.icon}</span> : null}
          <span className="ui-sidebar-label">{it.label}</span><span className="ui-sidebar-chev">{CHEV}</span>
        </button>
        <div className="ui-sidebar-group-body" id={bodyId} hidden={!isOpen}>{it.items.map((s) => link(s, true))}</div>
      </div>
    );
  };
  const toggleLabel = narrow ? "Close menu" : open ? "Collapse sidebar" : "Expand sidebar";
  return (
    <div ref={root} className={cx("ui-app", className)}>
      <nav ref={side} className="ui-sidebar" id={sbId} data-state={open ? "expanded" : "collapsed"} aria-label={label}>
        <div className="ui-sidebar-top">
          {brand ? <span className="ui-sidebar-brand">{brand}</span> : null}
          <button type="button" className="ui-sidebar-toggle" aria-controls={sbId} aria-expanded={open} aria-label={toggleLabel}
            onClick={() => { setOpen(!open); if (open && narrow) opener.current?.focus(); }}>{PANEL}</button>
        </div>
        {items.map(entry)}
        {footer.length ? <div className="ui-sidebar-foot">{footer.map((it) => link(it))}</div> : null}
      </nav>
      <div className="ui-app-main">
        <div className="ui-app-bar">
          <button ref={opener} type="button" className="ui-sidebar-open" aria-controls={sbId} aria-expanded={open} aria-label="Open menu" onClick={() => setOpen(true)}>{MENU}</button>
          {title ? <strong>{title}</strong> : null}
        </div>
        {children}
      </div>
    </div>
  );
}
