import { useRef } from "react";
import { cx } from "./cx.js";

/**
 * <TagList label="Genres">{genres.map(g => <Tag key={g} onRemove={() => drop(g)}>{g}</Tag>)}</TagList>
 * With onRemove, a tag shows a remove button labelled "Remove <text>". After a removal, focus moves to the
 * next remove button, or the previous one, or the list, so a keyboard user is never dropped.
 */
export function TagList({ label, className, children }) {
  return <div className={cx("ui-tags", className)} role="group" aria-label={label} tabIndex={-1}>{children}</div>;
}

export function Tag({ children, onRemove, removeLabel, className, ...rest }) {
  const ref = useRef(null);
  function remove() {
    const list = ref.current?.parentElement;
    const all = list ? [...list.querySelectorAll(".ui-tag-remove")] : [];
    const i = all.indexOf(ref.current?.querySelector(".ui-tag-remove"));
    const next = all[i + 1] || all[i - 1] || list;
    onRemove();
    // after React removes this tag
    requestAnimationFrame(() => next?.isConnected ? next.focus() : list?.focus());
  }
  return (
    <span ref={ref} className={cx("ui-tag", className)} {...rest}>
      {children}
      {onRemove ? (
        <button type="button" className="ui-tag-remove" aria-label={removeLabel || `Remove ${typeof children === "string" ? children : "tag"}`} onClick={remove}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
      ) : null}
    </span>
  );
}
