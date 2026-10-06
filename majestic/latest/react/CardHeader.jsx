import { cx } from "./cx.js";

/** <CardHeader title="Ticket sales" badge={<Badge>Live</Badge>} description="Updated every minute." actions={<Button size="sm">Export</Button>} /> */
export function CardHeader({ title, badge, description, actions, as: H = "h3", className }) {
  return (
    <div className={cx("ui-cardhead", className)}>
      <div className="ui-cardhead-text">
        <H className="ui-cardhead-title">{title}{badge}</H>
        {description ? <p className="ui-cardhead-desc">{description}</p> : null}
      </div>
      {actions ? <div className="ui-cardhead-actions">{actions}</div> : null}
    </div>
  );
}
