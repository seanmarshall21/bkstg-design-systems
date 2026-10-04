import { cx } from "./cx.js";

/**
 * <Table caption="Upcoming set times" columns={[{ key: "artist", label: "Artist", strong: true }, { key: "time", label: "Time", numeric: true }]} rows={rows} />
 * A real <table> with a caption and column headers, in a wrapper that scrolls sideways on narrow screens.
 * A cell can be a string or a React node (a Badge, for example). rows need an id.
 */
export function Table({ caption, columns = [], rows = [], className }) {
  return (
    <div className={cx("ui-table-wrap", className)}>
      <table className="ui-table">
        {caption ? <caption>{caption}</caption> : null}
        <thead><tr>{columns.map((c) => <th key={c.key} scope="col" className={c.numeric ? "ui-num" : undefined}>{c.label}</th>)}</tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              {columns.map((c) => <td key={c.key} className={cx(c.strong && "ui-table-strong", c.numeric && "ui-num") || undefined}>{r[c.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
