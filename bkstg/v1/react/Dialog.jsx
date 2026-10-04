import { useEffect, useId, useRef } from "react";

/**
 * <Dialog open={open} onClose={() => setOpen(false)} title="Delete file?" description="…" footer={…}>…</Dialog>
 * A native <dialog> opened as a modal: the page behind is inert, Escape closes it, focus returns
 * to what opened it, and a click on the backdrop closes it.
 */
export function Dialog({ open, onClose, title, description, footer, children, closeLabel = "Close" }) {
  const ref = useRef(null);
  const opener = useRef(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) { opener.current = document.activeElement; d.showModal(); }
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="ui-dialog"
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onClose={() => { onClose?.(); opener.current?.focus?.(); }}
      onClick={(e) => { if (e.target === ref.current) ref.current.close(); }}
    >
      <div className="ui-dialog-head">
        <div style={{ flex: 1 }}>
          <h2 className="ui-dialog-title" id={titleId}>{title}</h2>
          {description ? <p className="ui-dialog-desc" id={descId}>{description}</p> : null}
        </div>
        <button type="button" className="ui-dialog-close" aria-label={closeLabel} onClick={() => ref.current?.close()}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
      </div>
      {children ? <div className="ui-dialog-body">{children}</div> : null}
      {footer ? <div className="ui-dialog-foot">{footer}</div> : null}
    </dialog>
  );
}
