import { cx } from "./cx.js";

/**
 * <Steps current={1} steps={[{ label: "Details", desc: "Name and dates" }, { label: "Stages" }, { label: "Publish" }]} />
 * Steps before current are complete, current is marked aria-current="step". vertical stacks them.
 */
export function Steps({ steps, current = 0, vertical = false, label = "Progress", className }) {
  return (
    <ol className={cx("ui-steps", vertical && "ui-steps--vertical", className)} aria-label={label}>
      {steps.map((s, i) => {
        const state = i < current ? "complete" : i === current ? "current" : "upcoming";
        return (
          <li key={i} className="ui-step" data-state={state} aria-current={state === "current" ? "step" : undefined}>
            <span className="ui-step-marker" aria-hidden="true" />
            <span className="ui-step-label">{s.label}{state === "complete" ? <span className="ui-sr-only"> (done)</span> : null}</span>
            {s.desc ? <span className="ui-step-desc">{s.desc}</span> : null}
          </li>
        );
      })}
    </ol>
  );
}
