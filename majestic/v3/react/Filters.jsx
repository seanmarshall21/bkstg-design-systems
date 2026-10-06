import { cx } from "./cx.js";

/** <Chip pressed={on} onClick={toggle}>Main</Chip>  a toggle that shows its state with aria-pressed */
export function Chip({ pressed = false, children, className, ...rest }) {
  return <button type="button" className={cx("ui-chip", className)} aria-pressed={pressed} {...rest}>{children}</button>;
}

/**
 * <FilterBar label="Filter sets" search={<Input type="search" ... />} chips={<>…Chips…</>} active={<TagList>…</TagList>} />
 * A labelled group: search and chips on one row, the active filters (removable tags) under it.
 */
export function FilterBar({ label, search, chips, active, className }) {
  return (
    <div className={cx("ui-filters", className)} role="group" aria-label={label}>
      <div className="ui-filters-row">{search}{chips}</div>
      {active}
    </div>
  );
}
