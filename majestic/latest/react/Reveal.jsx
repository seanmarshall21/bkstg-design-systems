import { useEffect, useRef } from "react";

/**
 * <Reveal effect="fade-up" stagger={60}>…</Reveal>  the kit's own engine (motion.js, no library) from React.
 * Load motion.js once in the app. Props mirror the no-code attributes: effect, trigger ("scroll" | "load" | "hover"),
 * duration, delay, ease, distance, stagger, split ("words" | "chars" | "lines"), repeat. It follows the visitor's
 * reduce-motion setting and the system's Motion level. For app-style animation (layout, gestures, exit), use Motion.
 */
export function Reveal({ as: As = "div", effect = "fade-up", trigger, duration, delay, ease, distance, stagger, split, repeat, children, ...rest }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current && window.UIMotion) window.UIMotion.init(ref.current.parentElement || document); }, []);
  return (
    <As ref={ref} data-reveal={effect} data-reveal-trigger={trigger} data-reveal-duration={duration} data-reveal-delay={delay}
      data-reveal-ease={ease} data-reveal-distance={distance} data-reveal-stagger={stagger} data-reveal-split={split}
      data-reveal-repeat={repeat ? "" : undefined} {...rest}>{children}</As>
  );
}
