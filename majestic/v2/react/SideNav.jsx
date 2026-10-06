import { cx } from "./cx.js";

/**
 * <SideNav label="Main" brand={<Logo />} items={[{ href: "/", label: "Overview", icon: <HomeIcon />, current: true, count: 8 }]}
 *          footer={[...]} user={{ name: "Sean Marshall", email: "…" }} />
 * The current page gets aria-current="page". Icons are decoration (aria-hidden); the label names the link.
 */
export function SideNav({ label = "Main", brand, items = [], footer = [], user, children, className }) {
  const list = (links) => (
    <ul className="ui-sidenav-list">
      {links.map((it) => (
        <li key={it.href + it.label}>
          <a className="ui-sidenav-link" href={it.href} aria-current={it.current ? "page" : undefined}>
            {it.icon ? <span aria-hidden="true">{it.icon}</span> : null}
            {it.label}
            {it.count != null ? <span className="ui-badge">{it.count}</span> : null}
          </a>
        </li>
      ))}
    </ul>
  );
  return (
    <nav className={cx("ui-sidenav", className)} aria-label={label}>
      {brand ? <div className="ui-sidenav-brand">{brand}</div> : null}
      {list(items)}
      <div className="ui-sidenav-spacer" />
      {footer.length ? list(footer) : null}
      {children}
      {user ? (
        <div className="ui-sidenav-user">
          <span className="ui-avatar ui-avatar--sm" aria-hidden="true">{user.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}</span>
          <span><strong>{user.name}</strong>{user.email ? <small>{user.email}</small> : null}</span>
        </div>
      ) : null}
    </nav>
  );
}
