import { useState } from "react";
import { cx } from "./cx.js";

/**
 * <Annotations notes={[{ x: "12%", y: "16%", title: "One primary action", text: "…" }]}>{the design}</Annotations>
 * Numbered pins over the design, each a button that lights up its note in the list beside it.
 */
export function Annotations({ notes, children, label = "Notes", className }) {
  const [on, setOn] = useState(null);
  return (
    <div className={cx("ui-annot", className)}>
      <div className="ui-annot-canvas">
        {children}
        {notes.map((n, i) => (
          <button key={i} type="button" className="ui-annot-pin" aria-pressed={on === i} aria-label={`Note ${i + 1}: ${n.title}`}
            style={{ left: n.x, top: n.y }} onClick={() => setOn(on === i ? null : i)}>{i + 1}</button>
        ))}
      </div>
      <ol className="ui-annot-notes" aria-label={label}>
        {notes.map((n, i) => <li key={i} data-active={on === i ? "" : undefined}><strong>{n.title}</strong><span>{n.text}</span></li>)}
      </ol>
    </div>
  );
}
