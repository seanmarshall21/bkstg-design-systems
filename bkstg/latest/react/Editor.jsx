import { useEffect, useId, useRef, useState } from "react";
import { cx } from "./cx.js";

const i = (d) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>;
export const EDITOR_TOOLS = [
  { cmd: "bold", label: "Bold", icon: i(<path d="M6 4h8a4 4 0 0 1 0 8H6zM6 12h9a4 4 0 0 1 0 8H6z" />) },
  { cmd: "italic", label: "Italic", icon: i(<path d="M19 4h-9M14 20H5M15 4 9 20" />) },
  { cmd: "underline", label: "Underline", icon: i(<path d="M6 4v6a6 6 0 0 0 12 0V4M4 20h16" />) },
  { sep: true },
  { cmd: "insertUnorderedList", label: "Bulleted list", icon: i(<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />) },
  { cmd: "insertOrderedList", label: "Numbered list", icon: i(<path d="M10 6h11M10 12h11M10 18h11M4 6h1v4M4 10h2M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />) },
  { cmd: "formatBlock", label: "Quote", icon: i(<path d="M3 21c3 0 7-1 7-8V5H3v7h4c0 3-1 5-4 5zM14 21c3 0 7-1 7-8V5h-7v7h4c0 3-1 5-4 5z" />) },
  { sep: true },
  { cmd: "removeFormat", label: "Clear formatting", press: false, icon: i(<path d="M4 7V4h16v3M5 20h6M13 4 8 20M15 15l5 5M20 15l-5 5" />) }
];

/**
 * <Editor label="Announcement" defaultValue="<p>Doors at noon.</p>" onChange={(html) => setDraft(html)} />
 * A toolbar over an editable area, using the browser's editing commands, so ⌘B, ⌘I, ⌘U and undo work.
 * The HTML it hands back is whatever the browser produced: clean it on the server before you store or show it.
 */
export function Editor({ label, defaultValue = "", placeholder = "Write something…", onChange, className }) {
  const id = useId();
  const area = useRef(null), bar = useRef(null);
  const [on, setOn] = useState({});
  const [words, setWords] = useState(0);
  const [focus, setFocus] = useState(0);

  function sync() {
    const next = {};
    for (const t of EDITOR_TOOLS) if (t.cmd && t.press !== false) {
      try { next[t.cmd] = t.cmd === "formatBlock" ? /blockquote/i.test(document.queryCommandValue("formatBlock")) : document.queryCommandState(t.cmd); } catch { next[t.cmd] = false; }
    }
    setOn(next);
    setWords((area.current?.textContent.trim().split(/\s+/).filter(Boolean) || []).length);
  }
  useEffect(() => {
    if (area.current) area.current.innerHTML = defaultValue;
    sync();
    const sel = () => { if (area.current?.contains(document.getSelection()?.anchorNode)) sync(); };
    document.addEventListener("selectionchange", sel);
    return () => document.removeEventListener("selectionchange", sel);
  }, []);

  function run(t) {
    area.current?.focus();
    if (t.cmd === "formatBlock") document.execCommand("formatBlock", false, on.formatBlock ? "p" : "blockquote");
    else document.execCommand(t.cmd, false, null);
    sync(); onChange?.(area.current.innerHTML);
  }
  const tools = EDITOR_TOOLS.filter((t) => !t.sep);
  function onBarKey(e) {
    const n = tools.length;
    const to = e.key === "ArrowRight" ? (focus + 1) % n : e.key === "ArrowLeft" ? (focus - 1 + n) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : null;
    if (to === null) return;
    e.preventDefault(); setFocus(to);
    bar.current?.querySelectorAll(".ui-editor-tool")[to]?.focus();
  }

  let k = -1;
  return (
    <div className={cx("ui-editor", className)}>
      <div ref={bar} className="ui-editor-toolbar" role="toolbar" aria-label={`${label} formatting`} aria-controls={id} onKeyDown={onBarKey}>
        {EDITOR_TOOLS.map((t, n) => {
          if (t.sep) return <span key={n} className="ui-editor-sep" aria-hidden="true" />;
          k += 1;
          const me = k;
          return (
            <button
              key={n} type="button" className="ui-editor-tool" aria-label={t.label} tabIndex={me === focus ? 0 : -1}
              aria-pressed={t.press === false ? undefined : !!on[t.cmd]}
              onMouseDown={(e) => e.preventDefault()} onClick={() => { setFocus(me); run(t); }}
            >{t.icon}</button>
          );
        })}
      </div>
      <div
        ref={area} id={id} className="ui-editor-area" contentEditable role="textbox" aria-multiline="true" aria-label={label}
        data-placeholder={placeholder} suppressContentEditableWarning
        onInput={() => { sync(); onChange?.(area.current.innerHTML); }}
      />
      <div className="ui-editor-foot"><span>{words} {words === 1 ? "word" : "words"}</span></div>
    </div>
  );
}
