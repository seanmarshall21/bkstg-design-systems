import { cx } from "./cx.js";

const X = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>;

/**
 * <Banner tone="fill" link={{ href: "/schedule", label: "Open the schedule" }} onClose={hide}>Set times are live.</Banner>
 * tone: default (inverted) | "fill" | "subtle"; card puts it in a rounded box. A named region, so it can be found.
 */
export function Banner({ children, tone, card = false, link, onClose, label = "Announcement", className }) {
  return (
    <div className={cx("ui-banner", tone && `ui-banner--${tone}`, card && "ui-banner--card", className)} role="region" aria-label={label}>
      <span>{children}</span>
      {link ? <a href={link.href}>{link.label}</a> : null}
      {onClose ? <button type="button" className="ui-banner-close" aria-label={`Dismiss ${label.toLowerCase()}`} onClick={onClose}>{X}</button> : null}
    </div>
  );
}
