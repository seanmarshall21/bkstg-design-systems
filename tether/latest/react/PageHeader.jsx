import { cx } from "./cx.js";

/**
 * <PageHeader breadcrumbs={<Breadcrumbs items={...} />} title="Spring 2026" description="Three stages, two days."
 *   actions={<><Button>Share</Button><Button variant="primary">Publish</Button></>} tabs={<Tabs ... />} />
 * The page's one h1.
 */
export function PageHeader({ breadcrumbs, title, description, actions, tabs, className }) {
  return (
    <header className={cx("ui-pagehead", className)}>
      {breadcrumbs}
      <div className="ui-pagehead-row">
        <div className="ui-pagehead-text">
          <h1 className="ui-pagehead-title">{title}</h1>
          {description ? <p className="ui-pagehead-desc">{description}</p> : null}
        </div>
        {actions ? <div className="ui-pagehead-actions">{actions}</div> : null}
      </div>
      {tabs}
    </header>
  );
}
