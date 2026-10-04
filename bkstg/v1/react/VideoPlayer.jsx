import { useEffect, useRef, useState } from "react";
import { cx } from "./cx.js";

const PLAY = <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5Z" /></svg>;
const PAUSE = <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>;
const o = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };
const SOUND = <svg viewBox="0 0 24 24" {...o} aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4V5Z" /><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" /></svg>;
const MUTED = <svg viewBox="0 0 24 24" {...o} aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4V5Z" /><path d="m22 9-6 6M16 9l6 6" /></svg>;
const FULL = <svg viewBox="0 0 24 24" {...o} aria-hidden="true"><path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" /></svg>;
const clock = (s) => { s = Math.max(0, Math.floor(s || 0)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };

/**
 * <VideoPlayer label="Day 1 recap" sources={[{ src: "/recap.mp4", type: "video/mp4" }]} poster="/recap.jpg"
 *   captions={{ src: "/recap.vtt", lang: "en" }} />
 * A native <video> with the kit's controls: play and pause, seek, mute, full screen; k or Space plays and pauses.
 * A video with speech needs captions (WCAG 1.2.2): pass a WebVTT file.
 */
export function VideoPlayer({ label, sources, poster, captions, muted = false, className }) {
  const root = useRef(null), v = useRef(null), idle = useRef(null);
  const [s, setS] = useState({ playing: false, muted, t: 0, d: 0, idle: false });
  const paint = () => { const el = v.current; if (el) setS((p) => ({ ...p, playing: !el.paused, muted: el.muted, t: el.currentTime, d: el.duration || 0 })); };
  useEffect(() => {
    const el = v.current;
    const evs = ["play", "pause", "timeupdate", "loadedmetadata", "volumechange", "ended"];
    evs.forEach((n) => el.addEventListener(n, paint));
    return () => { evs.forEach((n) => el.removeEventListener(n, paint)); clearTimeout(idle.current); };
  }, []);
  const toggle = () => { const el = v.current; if (el.paused) el.play(); else el.pause(); };
  const wake = () => { setS((p) => ({ ...p, idle: false })); clearTimeout(idle.current); idle.current = setTimeout(() => setS((p) => ({ ...p, idle: true })), 2000); };
  const pct = s.d ? (s.t / s.d) * 100 : 0;

  return (
    <div
      ref={root} className={cx("ui-video", className)} role="group" aria-label={label}
      data-playing={s.playing ? "" : undefined} data-idle={s.idle ? "" : undefined}
      onPointerMove={wake} onFocus={wake}
      onKeyDown={(e) => { if (e.target.closest("button, input")) return; if (e.key === " " || e.key === "k") { e.preventDefault(); toggle(); } }}
    >
      <video ref={v} poster={poster} muted={muted} playsInline preload="metadata" onClick={toggle} tabIndex={-1}>
        {sources.map((x) => <source key={x.src} src={x.src} type={x.type} />)}
        {captions ? <track kind="captions" src={captions.src} srcLang={captions.lang || "en"} label={captions.label || "English"} default /> : null}
      </video>
      <button type="button" className="ui-video-big" aria-label="Play" tabIndex={s.playing ? -1 : 0} onClick={toggle}>{PLAY}</button>
      <div className="ui-video-bar">
        <button type="button" className="ui-video-btn" aria-label={s.playing ? "Pause" : "Play"} onClick={toggle}>{s.playing ? PAUSE : PLAY}</button>
        <input
          type="range" className="ui-slider" aria-label="Seek" min={0} max={Math.round(s.d * 10) || 0} value={Math.round(s.t * 10)}
          aria-valuetext={`${clock(s.t)} of ${clock(s.d)}`} style={{ "--value": `${pct}%` }}
          onChange={(e) => { v.current.currentTime = e.target.value / 10; }}
        />
        <span className="ui-video-time">{clock(s.t)} / {clock(s.d)}</span>
        <button type="button" className="ui-video-btn" aria-label={s.muted ? "Unmute" : "Mute"} onClick={() => { v.current.muted = !v.current.muted; }}>{s.muted ? MUTED : SOUND}</button>
        <button type="button" className="ui-video-btn" aria-label="Full screen" onClick={() => (document.fullscreenElement ? document.exitFullscreen() : root.current.requestFullscreen?.())}>{FULL}</button>
      </div>
    </div>
  );
}
