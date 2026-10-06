import { useEffect, useRef, useState } from "react";
import { cx } from "./cx.js";

const SEND = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4z" /><path d="M22 2 11 13" /></svg>;
const initials = (n) => n.split(" ").map((w) => w[0]).join("").slice(0, 2);

/**
 * <Chat label="Production chat" messages={[{ id: 1, from: "Grace Lee", text: "Doors at noon?", time: "9:41" }, { id: 2, mine: true, text: "Yes.", time: "9:42" }]} onSend={send} />
 * Messages read out as they arrive (role="log"). Enter sends, Shift+Enter adds a line.
 */
export function Chat({ label, messages, onSend, placeholder = "Write a message", className }) {
  const [text, setText] = useState("");
  const log = useRef(null);
  useEffect(() => { if (log.current) log.current.scrollTop = log.current.scrollHeight; }, [messages.length]);
  const send = () => { const t = text.trim(); if (!t) return; onSend?.(t); setText(""); };
  return (
    <section className={cx("ui-chat", className)} aria-label={label}>
      <ol className="ui-chat-log" role="log" aria-live="polite" ref={log}>
        {messages.map((m) => (
          <li key={m.id} className={cx("ui-msg", m.mine && "ui-msg--out")}>
            {!m.mine ? <span className="ui-avatar ui-avatar--sm" role="img" aria-label={m.from}><span aria-hidden="true">{initials(m.from)}</span></span> : null}
            <div className="ui-msg-bubble">{m.text}</div>
            <span className="ui-msg-meta">{m.mine ? "You" : m.from} · {m.time}</span>
          </li>
        ))}
      </ol>
      <div className="ui-chat-compose">
        <textarea className="ui-input" rows={1} aria-label="Message" placeholder={placeholder} value={text} onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); } }} />
        <button type="button" className="ui-btn ui-btn--primary ui-btn--icon" aria-label="Send" onClick={send}>{SEND}</button>
      </div>
    </section>
  );
}
