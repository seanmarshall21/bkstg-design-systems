import { cx } from "./cx.js";

/** <EmptyState icon={<SearchIcon />} title="No sets match" text="Try another stage or clear the search." actions={<Button>Clear search</Button>} /> */
export function EmptyState({ icon, title, text, actions, as: H = "h3", className }) {
  return (
    <div className={cx("ui-empty", className)}>
      {icon ? <span className="ui-empty-icon" aria-hidden="true">{icon}</span> : null}
      <H className="ui-empty-title">{title}</H>
      {text ? <p className="ui-empty-text">{text}</p> : null}
      {actions ? <div className="ui-empty-actions">{actions}</div> : null}
    </div>
  );
}
