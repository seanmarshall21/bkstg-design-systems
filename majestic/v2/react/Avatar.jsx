import { cx } from "./cx.js";

/**
 * <Avatar name="Grace Lee" src={url} size="lg" online />
 * Without src, shows initials. name is the accessible name either way.
 */
export function Avatar({ name, src, size = "md", online = false, className }) {
  const initials = (name || "").split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("");
  return (
    <span className={cx("ui-avatar", size !== "md" && `ui-avatar--${size}`, className)} role="img" aria-label={name + (online ? ", online" : "")}>
      {src ? <img src={src} alt="" /> : <span aria-hidden="true">{initials}</span>}
      {online ? <span className="ui-avatar-status" aria-hidden="true" /> : null}
    </span>
  );
}

export function AvatarGroup({ label, className, children }) {
  return <span className={cx("ui-avatar-group", className)} role="group" aria-label={label}>{children}</span>;
}
