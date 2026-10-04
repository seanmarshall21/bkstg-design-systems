import { cx } from "./cx.js";

/** <DeviceFrame kind="browser" | "laptop" | "phone" caption="Ticketing, desktop"><img src="…" alt="…" /></DeviceFrame> */
export function DeviceFrame({ kind = "browser", caption, children, className }) {
  return (
    <figure className={cx("ui-device", `ui-device--${kind}`, className)}>
      {kind === "browser" ? <div className="ui-device-chrome" aria-hidden="true"><i /><i /><i /><span /></div> : null}
      <div className="ui-device-screen">{children}</div>
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}
