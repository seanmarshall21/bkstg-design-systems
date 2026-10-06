import { cx } from "./cx.js";

/** <SectionHeader title="Team" description="Who can see and change this event." actions={<Button size="sm">Invite</Button>} /> */
export function SectionHeader({ title, description, actions, as: H = "h2", className }) {
  return (
    <div className={cx("ui-sectionhead", className)}>
      <div className="ui-sectionhead-text">
        <H className="ui-sectionhead-title">{title}</H>
        {description ? <p className="ui-sectionhead-desc">{description}</p> : null}
      </div>
      {actions ? <div className="ui-sectionhead-actions">{actions}</div> : null}
    </div>
  );
}

/** <SectionFooter note="Last saved 2 minutes ago" actions={<><Button>Cancel</Button><Button variant="primary">Save</Button></>} /> */
export function SectionFooter({ note, actions, className }) {
  return (
    <div className={cx("ui-sectionfoot", className)}>
      {note ? <p className="ui-sectionfoot-note">{note}</p> : null}
      {actions ? <div className="ui-sectionfoot-actions">{actions}</div> : null}
    </div>
  );
}
