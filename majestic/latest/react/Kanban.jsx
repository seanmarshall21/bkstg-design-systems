import { useEffect, useId, useRef, useState } from "react";
import { cx } from "./cx.js";
import { Menu } from "./Menu.jsx";
import { Avatar, AvatarGroup } from "./Avatar.jsx";

const svg = (d) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>;
const DUE = svg(<><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>);
const CLIP = svg(<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />);
const TALK = svg(<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />);
const PLUS = svg(<path d="M12 5v14M5 12h14" />);
const PRIORITY = { high: "High", medium: "Medium", low: "Low" };
const C = 2 * Math.PI * 6.5; // the progress ring's length

function Ring({ value }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <span className={cx("ui-kanban-progress", v >= 100 && "ui-kanban-progress--done")}>
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <circle className="ui-kanban-ring-track" cx="8" cy="8" r="6.5" />
        {v > 0 ? <circle className="ui-kanban-ring-fill" cx="8" cy="8" r="6.5" strokeDasharray={`${(v / 100 * C).toFixed(2)} ${C.toFixed(2)}`} /> : null}
      </svg>
      {v}%<span className="ui-sr-only"> done</span>
    </span>
  );
}

/**
 * <Kanban label="Tasks" onMove={(cardId, toColumnId, index, fromColumnId) => save(…)} onAdd={(columnId) => …} columns={[
 *   { id: "backlog", title: "Backlog", cards: [
 *     { id: "t1", title: "Send key art finals", text: "Print-ready files to the printer.", people: [{ name: "Maya Okafor" }],
 *       progress: 33, priority: "high", due: "Sep 20", attachments: 2, comments: 2 } ] } ]} />
 * Columns of cards, the same markup as the HTML board (components.css, ui-kanban). A card moves by dragging it with a
 * mouse, or with its Move menu (keyboard, touch, screen readers): each move is announced, focus returns to the card's
 * Move button, and onMove tells the app so it can save it. The board keeps its own order after the first render;
 * give it a new key to start again from new columns.
 */
export function Kanban({ label = "Board", columns, onMove, onAdd, className }) {
  const [cols, setCols] = useState(columns);
  const [said, setSaid] = useState("");
  const [drag, setDrag] = useState(null); // while dragging: { id, col, index } of the drop line
  const board = useRef(null), colsNow = useRef(cols), focusAfter = useRef(null);
  const uid = useId();
  colsNow.current = cols;

  // after a move the card has a new place (often a new list): focus goes back to its Move button there
  useEffect(() => {
    const id = focusAfter.current; if (!id) return;
    focusAfter.current = null;
    [...(board.current?.querySelectorAll(".ui-kanban-card") || [])].find((c) => c.dataset.card === id)?.querySelector(".ui-kanban-move .ui-menu-trigger")?.focus();
  });

  function move(cardId, toId, index) {
    const prev = colsNow.current, from = prev.find((c) => c.cards.some((k) => k.id === cardId)), target = prev.find((c) => c.id === toId);
    if (!from || !target) return;
    const card = from.cards.find((k) => k.id === cardId);
    const next = prev.map((c) => ({ ...c, cards: c.cards.filter((k) => k.id !== cardId) }));
    const to = next.find((c) => c.id === toId), at = Math.max(0, Math.min(index, to.cards.length));
    to.cards = [...to.cards.slice(0, at), card, ...to.cards.slice(at)];
    setCols(next);
    setSaid(`${card.title}: moved to ${to.title}, ${at + 1} of ${to.cards.length}`);
    focusAfter.current = cardId;
    onMove?.(cardId, toId, at, from.id);
  }

  // where a dragged card would land: the column nearest the pointer, before the first card whose middle is below it
  function spotAt(x, y, cardId) {
    let col = null, best = Infinity;
    board.current.querySelectorAll(".ui-kanban-col").forEach((c) => {
      const r = c.getBoundingClientRect(), d = x < r.left ? r.left - x : x > r.right ? x - r.right : 0;
      if (d < best) { best = d; col = c; }
    });
    if (!col) return null;
    const cards = [...col.querySelectorAll(".ui-kanban-card")].filter((c) => c.dataset.card !== cardId);
    return { col: col.dataset.col, index: cards.filter((c) => { const r = c.getBoundingClientRect(); return r.top + r.height / 2 < y; }).length };
  }
  // mouse only: a finger on a card still scrolls the page; touch moves cards with the Move menu
  function onPointerDown(e) {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    const el = e.target.closest(".ui-kanban-card");
    if (!el || e.target.closest("button, a, input, select, textarea, [role=menu]")) return;
    const d = { id: el.dataset.card, x: e.clientX, y: e.clientY, on: false, spot: null };
    const onMoveEv = (ev) => {
      if (!d.on) { if (Math.abs(ev.clientX - d.x) + Math.abs(ev.clientY - d.y) < 6) return; d.on = true; window.getSelection?.().removeAllRanges(); }
      ev.preventDefault();
      const s = spotAt(ev.clientX, ev.clientY, d.id);
      if (s) { d.spot = s; setDrag({ id: d.id, ...s }); }
    };
    const stop = (drop) => {
      removeEventListener("pointermove", onMoveEv); removeEventListener("pointerup", up); removeEventListener("pointercancel", cancel); removeEventListener("keydown", key);
      setDrag(null);
      if (drop && d.on && d.spot) move(d.id, d.spot.col, d.spot.index);
    };
    const up = () => stop(true), cancel = () => stop(false), key = (ev) => { if (ev.key === "Escape" && d.on) { ev.preventDefault(); stop(false); } };
    addEventListener("pointermove", onMoveEv); addEventListener("pointerup", up); addEventListener("pointercancel", cancel); addEventListener("keydown", key);
  }

  const line = <li className="ui-kanban-drop" aria-hidden="true" />;
  return (
    <div ref={board} className={cx("ui-kanban", drag && "is-sorting", className)} data-ui-kanban="" data-react="" role="region" aria-label={label} onPointerDown={onPointerDown}>
      {cols.map((col) => {
        const titleId = `${uid}-${col.id}`;
        const others = drag ? col.cards.filter((k) => k.id !== drag.id) : col.cards;
        const lineBefore = drag && drag.col === col.id ? (others[drag.index]?.id ?? "") : null;
        return (
          <section key={col.id} className="ui-kanban-col" data-col={col.id} aria-labelledby={titleId}>
            <header className="ui-kanban-head">
              <h3 id={titleId} className="ui-kanban-title">{col.title}</h3>
              <span className="ui-kanban-count"><span data-kanban-n="">{col.cards.length}</span><span className="ui-sr-only"> cards</span></span>
              {onAdd ? <button type="button" className="ui-btn ui-btn--sm ui-btn--ghost ui-btn--icon ui-kanban-add" aria-label={`Add a card to ${col.title}`} onClick={() => onAdd(col.id)}>{PLUS}</button> : null}
            </header>
            <ol className="ui-kanban-list" aria-labelledby={titleId}>
              {col.cards.map((k, i) => (
                <Card key={k.id} k={k} i={i} col={col} cols={cols} dragging={drag?.id === k.id} before={lineBefore === k.id ? line : null} move={move} />
              ))}
              {lineBefore === "" ? line : null}
            </ol>
          </section>
        );
      })}
      <p className="ui-sr-only ui-kanban-live" aria-live="polite">{said}</p>
    </div>
  );
}

function Card({ k, i, col, cols, dragging, before, move }) {
  const items = [{ heading: "Move to" },
    ...cols.map((c) => ({ label: c.title, disabled: c.id === col.id, onSelect: () => move(k.id, c.id, c.cards.length) })),
    { separator: true },
    { label: "Move up", disabled: i === 0, onSelect: () => move(k.id, col.id, i - 1) },
    { label: "Move down", disabled: i === col.cards.length - 1, onSelect: () => move(k.id, col.id, i + 1) }];
  return (
    <>
      {before}
      <li className={cx("ui-kanban-card", dragging && "is-dragging")} data-card={k.id}>
        <h4 className="ui-kanban-card-title">{k.title}</h4>
        {k.text ? <p className="ui-kanban-card-text">{k.text}</p> : null}
        {k.people?.length || k.progress != null ? (
          <div className="ui-kanban-card-row">
            {k.people?.length ? <AvatarGroup label="People">{k.people.map((p) => <Avatar key={p.name} name={p.name} src={p.src} size="sm" />)}</AvatarGroup> : <span />}
            {k.progress != null ? <Ring value={k.progress} /> : null}
          </div>
        ) : null}
        <div className="ui-kanban-card-foot">
          {k.priority ? <span className={cx("ui-badge ui-badge--outline ui-kanban-pri", `ui-kanban-pri--${k.priority}`)}><span className="ui-badge-dot" aria-hidden="true" />{PRIORITY[k.priority] || k.priority}<span className="ui-sr-only"> priority</span></span> : null}
          {k.due ? <span className="ui-kanban-meta">{DUE}<span className="ui-sr-only">Due </span>{k.due}</span> : null}
          {k.attachments != null ? <span className="ui-kanban-meta">{CLIP}{k.attachments}<span className="ui-sr-only"> attachments</span></span> : null}
          {k.comments != null ? <span className="ui-kanban-meta">{TALK}{k.comments}<span className="ui-sr-only"> comments</span></span> : null}
          <Menu className="ui-kanban-move" buttonClassName="ui-btn--sm ui-btn--ghost" label="Move" ariaLabel={`Move ${k.title}`} align="end" items={items} />
        </div>
      </li>
    </>
  );
}
