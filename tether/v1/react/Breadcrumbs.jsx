import { cx } from "./cx.js";

/**
 * <Breadcrumbs items={[{ href: "/", label: "Home", icon: <HomeIcon /> }, { href: "/events", label: "Events" }, { label: "Spring 2026" }]} />
 * The last item is the current page: plain text with aria-current="page", never a link.
 */
export function Breadcrumbs({ items, label = "Breadcrumb", className }) {
  return (
    <nav className={cx("ui-breadcrumb", className)} aria-label={label}>
      <ol>
        {items.map((it, i) => {
          const last = i === items.length - 1;
          return (
            <li key={i}>
              {last ? <span aria-current="page">{it.icon}{it.label}</span>
                : <a href={it.href} aria-label={it.icon && !it.label ? it.ariaLabel : undefined}>{it.icon}{it.label}</a>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
