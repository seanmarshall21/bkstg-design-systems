import { cx } from "./cx.js";

const ICONS = {
  info: <><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></>,
  ok: <><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></>,
  warn: <><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" /><path d="M12 9v4M12 17h.01" /></>,
  critical: <><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6M9 9l6 6" /></>,
};

/**
 * <Alert tone="warn" title="Set times move Thursday">Check the schedule before you publish.</Alert>
 * tone: "info" (default) | "ok" | "warn" | "critical". Critical uses role="alert" (announced at once),
 * the others role="status". onClose adds a close button.
 */
export function Alert({ tone = "info", title, children, onClose, closeLabel = "Dismiss", className }) {
  return (
    <div className={cx("ui-alert", tone !== "info" && `ui-alert--${tone}`, className)} role={tone === "critical" ? "alert" : "status"}>
      <svg className="ui-alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICONS[tone] || ICONS.info}</svg>
      {title ? <p className="ui-alert-title">{title}</p> : null}
      {children ? <p className="ui-alert-body">{children}</p> : null}
      {onClose ? (
        <button type="button" className="ui-alert-close" aria-label={closeLabel} onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
      ) : null}
    </div>
  );
}
