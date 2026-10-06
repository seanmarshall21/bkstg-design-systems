import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { cx } from "./cx.js";

const icon = (d) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>;
const X = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>;
const DOCK = icon(<><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M15 3v18" /></>);
const WIDE = icon(<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />);
const NARROW = 720; // under this a docked panel opens as an overlay: no room beside the page

const store = {
  get(k) { try { return k ? JSON.parse(localStorage.getItem("ui-sheet:" + k) || "null") : null; } catch { return null; } },
  set(k, v) { try { if (k) localStorage.setItem("ui-sheet:" + k, JSON.stringify(v)); } catch { /* private mode: nothing kept */ } },
};
// the page makes room for a docked panel: --_ui-sheet-docked on <html> (components.css: .ui-sheet-push, .ui-app-main)
function push(width) {
  const root = document.documentElement;
  if (width) { root.setAttribute("data-ui-sheet-docked", ""); root.style.setProperty("--_ui-sheet-docked", width + "px"); }
  else { root.removeAttribute("data-ui-sheet-docked"); root.style.removeProperty("--_ui-sheet-docked"); }
}

/**
 * <Sheet open={open} onClose={() => setOpen(false)} title="Set details" footer={<Button onClick={save}>Save</Button>}>…</Sheet>
 * A side panel on the right. mode="overlay" (the default) is a modal: focus stays inside; Escape and the backdrop close it.
 * mode="dock" sits beside the page, which stays usable: give the page's main area className="ui-sheet-push" (an AppShell's
 * main area does it already) and it makes room. Under 720px wide a docked panel opens as an overlay.
 * resizable: drag the left edge, or focus it and use the arrow keys (Shift for bigger steps). expandable: a full-width
 * button. dockable: a button that switches between docked and overlay (onModeChange hears it). remember="<key>": keep
 * the width and mode in this browser.
 * Leave mode, resizable, expandable or dockable out and the system's panel settings decide (--sheet-mode,
 * --sheet-resize, --sheet-expand, --sheet-dock-switch: set in the builder, carried by the stylesheet).
 */
export function Sheet({ open, onClose, title, children, footer, mode: modeProp, onModeChange, resizable, expandable, dockable, remember, className }) {
  const ref = useRef(null), dockBtn = useRef(null), refocus = useRef(false), id = useId();
  const kept = useRef(store.get(remember));
  // the system's panel settings fill in what the props leave out; read again each time it opens
  const [sys, setSys] = useState({ mode: "overlay", resize: false, expand: false, dock: false });
  useLayoutEffect(() => {
    const d = ref.current; if (!d || !open) return;
    const cs = getComputedStyle(d), on = (n) => cs.getPropertyValue(n).trim() === "on";
    const next = { mode: cs.getPropertyValue("--sheet-mode").trim() === "dock" ? "dock" : "overlay", resize: on("--sheet-resize"), expand: on("--sheet-expand"), dock: on("--sheet-dock-switch") };
    setSys((was) => (JSON.stringify(was) === JSON.stringify(next) ? was : next));
  }, [open]);
  const [modeState, setMode] = useState(kept.current?.mode || modeProp || null);
  const mode = modeState || sys.mode;
  const canResize = resizable ?? sys.resize, canExpand = expandable ?? sys.expand, canDock = dockable ?? sys.dock;
  const [width, setWidthState] = useState(kept.current?.w || null);
  // the latest width, for key presses that come faster than React redraws
  const widthNow = useRef(width);
  const setWidth = (w) => { widthNow.current = w; setWidthState(w); };
  const [wide, setWide] = useState(false);
  const [bounds, setBounds] = useState({ min: 320, max: 960 });
  const [resizing, setResizing] = useState(false);
  useEffect(() => { if (!remember && modeProp) setMode(modeProp); }, [modeProp]);

  const docked = () => { const d = ref.current; return !!d && d.open && !d.matches(":modal"); };
  function show(d) { if (mode === "dock" && window.innerWidth >= NARROW) d.show(); else d.showModal(); }
  // open, close, and reopen in the other mode when it changes while open
  useLayoutEffect(() => {
    const d = ref.current; if (!d) return;
    // reopened at once below: the "close" the browser fires (or skips) for this finds the panel open, and is not a real close
    if (open && d.open && (mode === "dock") === d.matches(":modal")) d.close();
    if (open && !d.open) show(d);
    if (!open && d.open) d.close();
    if (refocus.current) { refocus.current = false; dockBtn.current?.focus(); }
    push(open && docked() ? d.offsetWidth : 0);
  }, [open, mode]);
  useEffect(() => () => push(0), []);
  // the resize edge's limits come from the tokens and the window
  useLayoutEffect(() => {
    const d = ref.current; if (!d || !open) return;
    const cs = getComputedStyle(d), max = Math.min(parseFloat(cs.getPropertyValue("--sheet-max-w")) || 960, window.innerWidth - 48);
    setBounds({ min: Math.min(parseFloat(cs.getPropertyValue("--sheet-min-w")) || 320, max), max });
    if (width === null && canResize) setWidth(Math.round(parseFloat(cs.getPropertyValue("--sheet-w")) || 400));
  }, [open]);
  useEffect(() => { if (open && docked()) push(wide ? width || ref.current.offsetWidth : ref.current.offsetWidth); }, [width, wide]);

  const clamp = (w) => Math.round(Math.max(bounds.min, Math.min(bounds.max, w)));
  const keep = (w, m) => { if (remember) store.set(remember, { w: w ?? width, mode: m ?? mode }); };
  function onEdgeDown(e) {
    if (e.button !== 0) return;
    e.preventDefault(); e.currentTarget.setPointerCapture?.(e.pointerId); setResizing(true);
    document.documentElement.setAttribute("data-ui-sheet-resizing", "");
    let last = width;
    const move = (ev) => { last = clamp(window.innerWidth - ev.clientX); setWidth(last); };
    const up = () => { removeEventListener("pointermove", move); removeEventListener("pointerup", up); removeEventListener("pointercancel", up); setResizing(false); document.documentElement.removeAttribute("data-ui-sheet-resizing"); keep(last); };
    addEventListener("pointermove", move); addEventListener("pointerup", up); addEventListener("pointercancel", up);
  }
  function onEdgeKey(e) {
    const now = widthNow.current || ref.current.offsetWidth, step = e.shiftKey ? 64 : 16;
    // the panel is on the right: Left makes it wider, Right narrower
    const to = e.key === "ArrowLeft" ? now + step : e.key === "ArrowRight" ? now - step : e.key === "Home" ? bounds.min : e.key === "End" ? bounds.max : null;
    if (to === null) return;
    e.preventDefault(); const w = clamp(to); setWidth(w); keep(w);
  }
  function toggleMode() {
    const next = mode === "dock" ? "overlay" : "dock";
    refocus.current = true; setMode(next); keep(undefined, next); onModeChange?.(next);
  }
  // a docked panel is not a modal, so the browser does not close it on Escape
  function onKeyDown(e) { if (e.key === "Escape" && !e.defaultPrevented && docked()) { e.preventDefault(); onClose?.(); } }

  return (
    <dialog ref={ref} className={cx("ui-sheet", resizing && "is-resizing", className)} data-mode={mode === "dock" ? "dock" : undefined} data-expanded={wide ? "" : undefined}
      style={width ? { "--sheet-w": width + "px" } : undefined} aria-labelledby={`${id}-t`} onKeyDown={onKeyDown}
      onClose={() => { if (ref.current?.open) return; push(0); onClose?.(); }}
      onClick={(e) => { if (e.target === ref.current && ref.current.matches(":modal")) onClose?.(); }}>
      <div className="ui-sheet-head"><h2 className="ui-sheet-title" id={`${id}-t`}>{title}</h2>
        {canDock || canExpand ? (
          <div className="ui-sheet-tools">
            {canDock ? <button ref={dockBtn} type="button" className="ui-dialog-close ui-sheet-tool" aria-pressed={mode === "dock"} aria-label="Keep beside the page" title="Keep beside the page" onClick={toggleMode}>{DOCK}</button> : null}
            {canExpand ? <button type="button" className="ui-dialog-close ui-sheet-tool" aria-pressed={wide} aria-label="Full width" title="Full width" onClick={() => setWide((w) => !w)}>{WIDE}</button> : null}
            <button type="button" className="ui-dialog-close" aria-label="Close" onClick={onClose}>{X}</button>
          </div>
        ) : <button type="button" className="ui-dialog-close" aria-label="Close" onClick={onClose}>{X}</button>}
      </div>
      <div className="ui-sheet-body">{children}</div>
      {footer ? <div className="ui-sheet-foot">{footer}</div> : null}
      {canResize ? <div className="ui-sheet-resize" role="separator" aria-orientation="vertical" aria-label="Resize the panel" tabIndex={0}
        aria-valuemin={bounds.min} aria-valuemax={bounds.max} aria-valuenow={width ?? undefined} aria-valuetext={width ? `${width} pixels wide` : undefined}
        onPointerDown={onEdgeDown} onKeyDown={onEdgeKey} /> : null}
    </dialog>
  );
}
