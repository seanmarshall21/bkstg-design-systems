import { useEffect, useId, useRef } from "react";
import { cx } from "./cx.js";

const X = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>;

/**
 * <Sheet open={open} onClose={() => setOpen(false)} title="Set details" footer={<Button onClick={save}>Save</Button>}>…</Sheet>
 * A slide-out panel on the right: a modal dialog, so focus stays inside; Escape and the backdrop close it.
 */
export function Sheet({ open, onClose, title, children, footer, className }) {
  const ref = useRef(null), id = useId();
  useEffect(() => {
    const d = ref.current; if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} className={cx("ui-sheet", className)} aria-labelledby={`${id}-t`} onClose={onClose} onClick={(e) => { if (e.target === ref.current) onClose?.(); }}>
      <div className="ui-sheet-head"><h2 className="ui-sheet-title" id={`${id}-t`}>{title}</h2>
        <button type="button" className="ui-dialog-close" aria-label="Close" onClick={onClose}>{X}</button></div>
      <div className="ui-sheet-body">{children}</div>
      {footer ? <div className="ui-sheet-foot">{footer}</div> : null}
    </dialog>
  );
}
