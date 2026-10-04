import { cx } from "./cx.js";

/**
 * <Skeleton width="60%" height="1rem" />  <Skeleton circle width={40} height={40} />
 * A placeholder while content loads. Hidden from screen readers: announce loading elsewhere (a Spinner,
 * or aria-busy on the region). Carries .ambient so the Calm motion level stops the shimmer.
 */
export function Skeleton({ width, height, circle = false, className, style }) {
  return (
    <span
      className={cx("ui-skeleton", circle && "ui-skeleton--circle", "ambient", className)}
      aria-hidden="true"
      style={{ width, height, ...style }}
    />
  );
}
