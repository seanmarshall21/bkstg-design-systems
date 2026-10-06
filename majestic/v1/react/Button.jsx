import { forwardRef } from "react";
import { cx } from "./cx.js";

/**
 * <Button variant="primary" size="sm">Save</Button>
 * variant: "secondary" (default) | "primary" | "ghost" | "destructive" | "link"
 * size:    "md" (default) | "sm" | "lg" | "icon"   (icon needs an aria-label)
 * loading: shows a spinner, sets aria-busy, blocks clicks
 * Same markup and classes as the HTML version; the look lives in components.css.
 */
export const Button = forwardRef(function Button(
  { variant = "secondary", size = "md", loading = false, className, type = "button", children, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-busy={loading || undefined}
      className={cx(
        "ui-btn",
        variant !== "secondary" && `ui-btn--${variant}`,
        size !== "md" && `ui-btn--${size}`,
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
});
