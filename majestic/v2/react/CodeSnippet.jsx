import { useState } from "react";
import { cx } from "./cx.js";

/** <CodeSnippet language="html" code={'<link rel="stylesheet" href="bkstg.css">'} /> A copy button copies the code. */
export function CodeSnippet({ code, language, className }) {
  const [said, setSaid] = useState("Copy");
  const copy = () => navigator.clipboard?.writeText(code).then(() => setSaid("Copied"), () => setSaid("Copy failed")).finally(() => setTimeout(() => setSaid("Copy"), 2000));
  return (
    <figure className={cx("ui-code", className)}>
      <figcaption className="ui-code-head">
        <span className="ui-code-lang">{language}</span>
        <button type="button" className="ui-btn ui-btn--sm ui-btn--ghost" onClick={copy}><span>{said}</span></button>
      </figcaption>
      <pre><code>{code}</code></pre>
    </figure>
  );
}
