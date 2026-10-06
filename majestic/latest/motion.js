// motion.js: the kit's animation engine. Plain script, no library, no build: the browser's own Web Animations API
// and an IntersectionObserver. Load it after the markup (or with defer). Nothing here is required: without it, every
// element simply shows.
//
// No-code use: put attributes on any element.
//   data-reveal="fade-up"        an entrance (see PRESETS); plays when it scrolls into view
//   data-reveal-trigger="load"   …or on load, or "hover" (plays each time the pointer arrives)
//   data-reveal-duration="500"   ms; default the --dur-slow token
//   data-reveal-delay="100"      ms
//   data-reveal-ease="enter"     standard | enter | exit, or any CSS easing; default the --ease-enter token
//   data-reveal-distance="24"    px of travel; default the --motion-distance token
//   data-reveal-stagger="60"     ms between children (each child animates in turn); default none
//   data-reveal-split="words"    words | chars | lines: split the text and stagger the pieces (the words are still
//                                read as one sentence: the original text stays as the element's accessible name)
//   data-reveal-repeat           replay every time it comes into view (default: once)
//   data-count-to="18240"        a number that counts up from 0 (data-count-prefix, -suffix, -decimals)
//
// Colin's Motion setting decides how much plays: html[data-motion="full"] everything; "calm" short opacity-only fades,
// counters land on their number; "still", or the device's reduce-motion setting, nothing moves and everything shows.
//
// window.UIMotion = { init(scope), play(el), keyframes(preset, opts), level(), PRESETS } for the workbench playground.
(function () {
  "use strict";
  var root = document.documentElement;
  var reduce = window.matchMedia ? matchMedia("(prefers-reduced-motion: reduce)") : null;
  function level() {
    if (reduce && reduce.matches) return "still";
    var m = root.getAttribute("data-motion");
    return m === "still" || m === "calm" ? m : "full";
  }
  function token(name, fallback) { var v = getComputedStyle(root).getPropertyValue(name).trim(); return v || fallback; }
  function ms(v, fallback) { if (v == null || v === "") return fallback; var n = parseFloat(v); return /ms$/.test(v) || !/s$/.test(v) ? n : n * 1000; }
  var EASE = { standard: "--ease-standard", enter: "--ease-enter", exit: "--ease-exit" };
  function easing(v) { return EASE[v] ? token(EASE[v], "ease") : v || token("--ease-enter", "ease-out"); }

  // Each preset: the "from" state; every animation ends on the element's own resting state
  var PRESETS = {
    "fade":        function (d) { return { opacity: 0 }; },
    "fade-up":     function (d) { return { opacity: 0, transform: "translateY(" + d + "px)" }; },
    "fade-down":   function (d) { return { opacity: 0, transform: "translateY(" + -d + "px)" }; },
    "slide-left":  function (d) { return { opacity: 0, transform: "translateX(" + d * 2 + "px)" }; },
    "slide-right": function (d) { return { opacity: 0, transform: "translateX(" + -d * 2 + "px)" }; },
    "scale":       function (d) { return { opacity: 0, transform: "scale(.92)" }; },
    "blur":        function (d) { return { opacity: 0, filter: "blur(12px)" }; },
    "wipe-up":     function (d) { return { clipPath: "inset(100% 0 0 0)" }; },
    "wipe-right":  function (d) { return { clipPath: "inset(0 100% 0 0)" }; },
    "iris":        function (d) { return { clipPath: "circle(0% at 50% 50%)" }; },
    "zoom-out":    function (d) { return { opacity: 0, transform: "scale(1.12)" }; },
    "rise":        function (d) { return { opacity: 0, transform: "translateY(110%)" }; }
  };
  var REST = { opacity: 1, transform: "none", filter: "blur(0)", clipPath: { "wipe-up": "inset(0 0 0 0)", "wipe-right": "inset(0 0 0 0)", iris: "circle(75% at 50% 50%)" } };
  /** keyframes for a preset at a level: Calm keeps only the fade; Still has none */
  function keyframes(preset, opts) {
    opts = opts || {};
    var lvl = opts.level || level(), from = (PRESETS[preset] || PRESETS.fade)(opts.distance != null ? opts.distance : parseFloat(token("--motion-distance", "16")));
    if (lvl === "still") return null;
    if (lvl === "calm") from = { opacity: 0 };
    var to = {};
    Object.keys(from).forEach(function (k) { to[k] = k === "clipPath" ? REST.clipPath[preset] : REST[k]; });
    if (lvl === "calm" && from.opacity === undefined) return null;
    return [from, to];
  }
  function timing(el, opts, i) {
    var lvl = (opts && opts.level) || level();
    var dur = ms(el.getAttribute("data-reveal-duration"), ms(token("--dur-slow", "500ms")));
    return {
      duration: lvl === "calm" ? Math.min(dur, ms(token("--dur-base", "250ms"))) : dur,
      delay: ms(el.getAttribute("data-reveal-delay"), 0) + (i || 0) * ms(el.getAttribute("data-reveal-stagger"), ms(token("--motion-stagger", "60ms"))),
      easing: easing(el.getAttribute("data-reveal-ease")), fill: "both"
    };
  }

  // split text into words, characters or lines; the original sentence stays the accessible name
  function split(el, how) {
    if (el._uiSplit === how) return el._uiParts;
    var text = el._uiText || (el._uiText = el.textContent.trim());
    el.setAttribute("aria-label", text);
    var tokens = how === "chars" ? Array.from(text) : text.split(/(\s+)/);
    el.innerHTML = "";
    var parts = [];
    tokens.forEach(function (t) {
      if (/^\s+$/.test(t)) { el.appendChild(document.createTextNode(t)); return; }
      var wrap = document.createElement("span"); wrap.className = "ui-split"; wrap.setAttribute("aria-hidden", "true");
      var inner = document.createElement("span"); inner.className = "ui-split-in"; inner.textContent = t;
      wrap.appendChild(inner); el.appendChild(wrap); parts.push(inner);
    });
    if (how === "lines") {
      // group words that share a line, so each line rises as one
      var lines = [], top = null;
      parts.forEach(function (p) { var y = p.parentNode.offsetTop; if (y !== top) { lines.push([]); top = y; } lines[lines.length - 1].push(p); });
      parts = lines.map(function (ws) { return { line: ws }; });
    }
    el._uiSplit = how; el._uiParts = parts;
    return parts;
  }

  function animateOne(target, preset, t, opts) {
    var k = keyframes(preset, opts);
    if (!k || !target.animate) return null;
    return target.animate(k, t);
  }
  /** play an element's entrance now; returns its animations */
  function play(el, opts) {
    opts = opts || {};
    var preset = opts.preset || el.getAttribute("data-reveal") || "fade-up", lvl = opts.level || level(), anims = [];
    el.getAnimations && el.getAnimations().forEach(function (a) { a.cancel(); });
    var how = el.getAttribute("data-reveal-split"), kids;
    if (how) {
      var parts = split(el, how);
      parts.forEach(function (p, i) {
        (p.line || [p]).forEach(function (w) { var a = animateOne(w, preset === "fade-up" && how !== "chars" ? "rise" : preset, timing(el, opts, i), { level: lvl, distance: opts.distance }); if (a) anims.push(a); });
      });
    } else if (el.hasAttribute("data-reveal-stagger")) {
      kids = Array.prototype.slice.call(el.children);
      kids.forEach(function (c, i) { var a = animateOne(c, preset, timing(el, opts, i), { level: lvl, distance: opts.distance }); if (a) anims.push(a); });
    } else {
      var a = animateOne(el, preset, timing(el, opts, 0), { level: lvl, distance: opts.distance }); if (a) anims.push(a);
    }
    el.setAttribute("data-revealed", "");
    return anims;
  }

  // counters: count from 0 to the number, eased; Calm and Still show the number at once
  function count(el) {
    var to = parseFloat(el.getAttribute("data-count-to")), dec = +(el.getAttribute("data-count-decimals") || 0);
    var pre = el.getAttribute("data-count-prefix") || "", suf = el.getAttribute("data-count-suffix") || "";
    var show = function (n) { el.textContent = pre + n.toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf; };
    if (isNaN(to)) return;
    el.setAttribute("aria-label", pre + to.toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf);
    if (level() !== "full") { show(to); return; }
    var dur = ms(el.getAttribute("data-reveal-duration"), ms(token("--dur-slow", "500ms")) * 2.4), t0 = null;
    function step(t) { if (t0 === null) t0 = t; var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3); show(to * e); if (p < 1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
    el.setAttribute("data-revealed", "");
  }

  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      var el = en.target;
      if (en.isIntersecting) {
        if (el.hasAttribute("data-count-to")) count(el); else play(el);
        if (!el.hasAttribute("data-reveal-repeat")) io.unobserve(el);
      } else if (el.hasAttribute("data-reveal-repeat") && !el.hasAttribute("data-count-to")) {
        var k = keyframes(el.getAttribute("data-reveal") || "fade-up");
        if (k && el.animate) el.animate([k[0], k[0]], { duration: 1, fill: "both" });
      }
    });
  }, { rootMargin: "0px 0px -10% 0px", threshold: 0.15 }) : null;

  function init(scope) {
    scope = scope || document;
    Array.prototype.forEach.call(scope.querySelectorAll("[data-reveal], [data-count-to]"), function (el) {
      if (el._uiMotion) return;
      el._uiMotion = true;
      var trig = el.getAttribute("data-reveal-trigger") || "scroll";
      if (level() === "still" && !el.hasAttribute("data-count-to")) { el.setAttribute("data-revealed", ""); return; }
      if (trig === "load") { el.hasAttribute("data-count-to") ? count(el) : play(el); }
      else if (trig === "hover") { el.addEventListener("pointerenter", function () { play(el); }); el.setAttribute("data-revealed", ""); }
      else if (io) io.observe(el);
      else { el.hasAttribute("data-count-to") ? count(el) : play(el); }
    });
  }
  // until it is ready, an element waiting to reveal is hidden; if the script never runs, nothing is hidden
  root.classList.add("ui-motion-ready");
  window.UIMotion = { init: init, play: play, keyframes: keyframes, level: level, PRESETS: Object.keys(PRESETS) };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { init(); });
  else init();
})();
