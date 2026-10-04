import { cx } from "./cx.js";

/** <InlineCTA title="Invite your crew" body="Everyone gets the run of show on their phone." actions={<Button variant="primary">Invite</Button>} tone="fill" /> */
export function InlineCTA({ title, body, actions, tone, as: H = "h3", className }) {
  return (
    <section className={cx("ui-cta", tone === "fill" && "ui-cta--fill", className)}>
      <div className="ui-cta-text">
        <H className="ui-cta-title">{title}</H>
        {body ? <p className="ui-cta-body">{body}</p> : null}
      </div>
      {actions ? <div className="ui-cta-actions">{actions}</div> : null}
    </section>
  );
}
