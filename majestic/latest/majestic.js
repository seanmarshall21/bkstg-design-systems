// components.js: behavior for the kit's interactive components. Plain script, no framework, no build.
// Load after the markup (or with defer). It wires everything already on the page, and exposes
// window.UI so markup added later can be wired with UI.init(container).
//
//   Tabs    [data-ui-tabs]                arrows, Home/End, roving focus, sliding indicator
//   Dialog  [data-ui-open="<dialog id>"]  opens a <dialog class="ui-dialog"> as a modal;
//           [data-ui-close]               closes it; Escape and a click on the backdrop close it too;
//                                         focus returns to whatever opened it
//   Tooltip .ui-tooltip-wrap              Escape hides an open tooltip until the pointer or focus leaves (WCAG 1.4.13)
//   Chart   .ui-chart[data-ui-chart]      draws a line chart from data-values="3,5,4,…" (and data-labels="Jan,Feb,…");
//                                         the values also become the chart's text alternative
//   Tag     [data-ui-dismiss]             removes its .ui-tag; focus moves to the next remove button, or the
//                                         previous one, or the tag list, never lost to the top of the page
//   Checkbox [data-indeterminate]          starts mixed; [data-ui-checkall="<name>"] checks every box of that name
//   Slider  .ui-slider                     the filled track follows the value; an <output for="<id>"> shows it
//   Button group .ui-btngroup              toggles aria-pressed; with data-ui-single, one at a time
//   Menu    [aria-haspopup="menu"]         opens its aria-controls menu; arrows, Home/End, a letter jumps,
//                                          Escape closes and focus returns; choosing fires "ui-select"
//   Editor  [data-ui-editor]               toolbar tools run editing commands; arrow keys move between tools
//   Video   [data-ui-video]                play/pause, seek, mute, full screen; k or Space plays and pauses
//   Pages   [data-ui-pagination]           data-page and data-count draw the pages; choosing one fires "ui-page"
//   Calendar [data-ui-calendar]            a month grid: arrows, Page Up/Down, Home/End; choosing fires "ui-date"
//   Date picker [data-ui-datepicker]       a button that opens a calendar; Escape or a choice closes it
//   Copy    [data-ui-copy="#id"]            copies that element's text
//   Color   [data-ui-colorpick]             swatches, native picker and hex field kept in step; fires "ui-color"
//   Command dialog[data-ui-command]         ⌘K / Ctrl+K or [data-ui-command-open]; type, arrows, Enter fires "ui-command"
//   Files   [data-ui-dropzone]              click or drop; lists the files (never uploads); fires "ui-files"
//   Chips   .ui-chip[aria-pressed]          toggles; fires "ui-change"
//   Chat    [data-ui-chat]                  Enter sends, Shift+Enter a new line; fires "ui-send"
//   Tree    .ui-tree[role=tree]             arrows, Home/End, Enter selects; fires "ui-select"
//   Site header .ui-sitenav-toggle          opens and closes its aria-controls panel; Escape closes it
//   Banner  [data-ui-banner-close]          hides its banner; fires "ui-dismiss"
//   Annotations .ui-annot [data-annot]      a pin and its note light up together
(function () {
  "use strict";

  function tabs(root) {
    if (root._uiTabs) return root._uiTabs;
    var list = root.querySelector('[role="tablist"]');
    var all = Array.prototype.slice.call(list.querySelectorAll('[role="tab"]'));
    var indicator = list.querySelector(".ui-tab-indicator");

    function enabled() { return all.filter(function (t) { return !t.disabled; }); }
    function move() {
      var t = all.filter(function (x) { return x.getAttribute("aria-selected") === "true"; })[0];
      if (!indicator || !t) return;
      indicator.style.setProperty("--x", t.offsetLeft + "px");
      indicator.style.setProperty("--w", t.offsetWidth + "px");
    }
    function select(tab, focus) {
      all.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute("aria-controls"));
        if (panel) panel.hidden = !on;
      });
      if (focus) tab.focus();
      move();
      // bubbles, so a page can listen once for every tab group in it
      root.dispatchEvent(new CustomEvent("ui-tabchange", { bubbles: true, detail: { tab: tab } }));
    }
    all.forEach(function (t) {
      t.addEventListener("click", function () { if (!t.disabled) select(t, false); });
      t.addEventListener("keydown", function (e) {
        var on = enabled(), i = on.indexOf(t), next = null;
        if (e.key === "ArrowRight") next = on[(i + 1) % on.length];
        else if (e.key === "ArrowLeft") next = on[(i - 1 + on.length) % on.length];
        else if (e.key === "Home") next = on[0];
        else if (e.key === "End") next = on[on.length - 1];
        if (next) { e.preventDefault(); select(next, true); }
      });
    });
    var first = all.filter(function (x) { return x.getAttribute("aria-selected") === "true"; })[0] || enabled()[0];
    if (first) select(first, false);
    // the indicator follows layout changes: fonts loading, the shape axis, a resize
    if (window.ResizeObserver) new ResizeObserver(move).observe(list);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(move);
    root._uiTabs = { select: select, move: move };
    return root._uiTabs;
  }

  // ── side panel (ui-sheet): an overlay (a modal, the default), or docked beside the page with data-mode="dock" (the
  //    page stays usable; anything with .ui-sheet-push, and an app shell's main area, makes room). Optional parts: a
  //    resize edge (.ui-sheet-resize: drag it, or focus it and use the arrow keys), a full-width button
  //    [data-ui-sheet-expand], a button that switches between docked and overlay [data-ui-sheet-dock], and
  //    data-remember="<key>" to keep the width and mode in this browser. Under 720px wide a docked panel opens as an
  //    overlay: there is no room beside the page.
  var SHEET_NARROW = 720;
  function sheetStore(dlg, v) {
    var k = dlg.getAttribute("data-remember"); if (!k) return null;
    try { if (v === undefined) return JSON.parse(localStorage.getItem("ui-sheet:" + k) || "null"); localStorage.setItem("ui-sheet:" + k, JSON.stringify(v)); } catch (e) { /* private mode: nothing kept */ }
    return null;
  }
  function sheetKeep(dlg) { sheetStore(dlg, { w: parseFloat(dlg.style.getPropertyValue("--sheet-w")) || null, mode: dlg.getAttribute("data-mode") || "overlay" }); }
  function sheetBounds(dlg) {
    var cs = getComputedStyle(dlg);
    var min = parseFloat(cs.getPropertyValue("--sheet-min-w")) || 320, max = Math.min(parseFloat(cs.getPropertyValue("--sheet-max-w")) || 960, window.innerWidth - 48);
    return { min: Math.min(min, max), max: max };
  }
  function sheetWidth(dlg, w) {
    var b = sheetBounds(dlg); w = Math.round(Math.max(b.min, Math.min(b.max, w)));
    dlg.style.setProperty("--sheet-w", w + "px");
    var h = dlg.querySelector(".ui-sheet-resize");
    if (h) { h.setAttribute("aria-valuemin", String(Math.round(b.min))); h.setAttribute("aria-valuemax", String(Math.round(b.max))); h.setAttribute("aria-valuenow", String(w)); h.setAttribute("aria-valuetext", w + " pixels wide"); }
    sheetPush();
    return w;
  }
  // the page makes room for a docked panel: --_ui-sheet-docked on <html> is its width
  function sheetPush() {
    var root = document.documentElement, docked = Array.prototype.filter.call(document.querySelectorAll("dialog.ui-sheet[open]"), function (d) { return d.getAttribute("data-mode") === "dock" && !d.matches(":modal"); })[0];
    if (docked) { root.setAttribute("data-ui-sheet-docked", ""); root.style.setProperty("--_ui-sheet-docked", (docked.hasAttribute("data-expanded") ? (parseFloat(docked.style.getPropertyValue("--sheet-w")) || docked.offsetWidth) : docked.offsetWidth) + "px"); }
    else { root.removeAttribute("data-ui-sheet-docked"); root.style.removeProperty("--_ui-sheet-docked"); }
  }
  function sheetSync(dlg) {
    var docked = dlg.getAttribute("data-mode") === "dock";
    Array.prototype.forEach.call(dlg.querySelectorAll("[data-ui-sheet-dock]"), function (b) { b.setAttribute("aria-pressed", String(docked)); });
    Array.prototype.forEach.call(dlg.querySelectorAll("[data-ui-sheet-expand]"), function (b) { b.setAttribute("aria-pressed", String(dlg.hasAttribute("data-expanded"))); });
  }
  // the system's panel settings (--sheet-mode, --sheet-resize, --sheet-expand, --sheet-dock-switch) fill in what a panel's
  // own markup leaves out. What they add is marked data-auto, so turning a setting off takes it away again.
  var SHEET_ICONS = {
    dock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M15 3v18"/></svg>',
    expand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>'
  };
  function sheetSetting(dlg, name) { return getComputedStyle(dlg).getPropertyValue("--sheet-" + name).trim(); }
  function sheetAuto(dlg, sel, on, make) {
    var own = Array.prototype.filter.call(dlg.querySelectorAll(sel), function (el) { return !el.hasAttribute("data-auto"); });
    var auto = dlg.querySelector(sel + "[data-auto]");
    if (on && !own.length && !auto) make(); else if (!on && auto) auto.parentNode.removeChild(auto);
  }
  function sheetDefaults(dlg) {
    if (!dlg.hasAttribute("data-mode") || dlg.hasAttribute("data-mode-auto")) { dlg.setAttribute("data-mode", sheetSetting(dlg, "mode") === "dock" ? "dock" : "overlay"); dlg.setAttribute("data-mode-auto", ""); }
    var head = dlg.querySelector(".ui-sheet-head"), tools = head && head.querySelector(".ui-sheet-tools");
    var tool = function (attr, label, svg) {
      if (!head) return;
      if (!tools) { tools = document.createElement("div"); tools.className = "ui-sheet-tools"; var close = head.querySelector("[data-ui-close]"); head.appendChild(tools); if (close) tools.appendChild(close); }
      var b = document.createElement("button"); b.type = "button"; b.className = "ui-dialog-close ui-sheet-tool"; b.setAttribute(attr, ""); b.setAttribute("data-auto", "");
      b.setAttribute("aria-pressed", "false"); b.setAttribute("aria-label", label); b.title = label; b.innerHTML = svg;
      tools.insertBefore(b, tools.querySelector("[data-ui-close]"));
    };
    sheetAuto(dlg, "[data-ui-sheet-dock]", sheetSetting(dlg, "dock-switch") === "on", function () { tool("data-ui-sheet-dock", "Keep beside the page", SHEET_ICONS.dock); });
    sheetAuto(dlg, "[data-ui-sheet-expand]", sheetSetting(dlg, "expand") === "on", function () { tool("data-ui-sheet-expand", "Full width", SHEET_ICONS.expand); });
    // the dock switch first, then full width, then close
    var d = dlg.querySelector("[data-ui-sheet-dock][data-auto]"), x = dlg.querySelector("[data-ui-sheet-expand][data-auto]"); if (d && x && x.nextSibling !== d && d.parentNode === x.parentNode) x.parentNode.insertBefore(d, x);
    sheetAuto(dlg, ".ui-sheet-resize", sheetSetting(dlg, "resize") === "on", function () {
      var h = document.createElement("div"); h.className = "ui-sheet-resize"; h.setAttribute("role", "separator"); h.setAttribute("aria-orientation", "vertical");
      h.setAttribute("aria-label", "Resize the panel"); h.tabIndex = 0; h.setAttribute("data-auto", ""); dlg.appendChild(h);
    });
  }
  // before it opens: the system's defaults, the remembered width and mode, and the resize edge's values
  function sheetPrep(dlg) {
    sheetDefaults(dlg);
    var kept = sheetStore(dlg);
    if (kept && kept.mode) { dlg.setAttribute("data-mode", kept.mode); dlg.removeAttribute("data-mode-auto"); }
    if (dlg.querySelector(".ui-sheet-resize")) sheetWidth(dlg, kept && kept.w ? kept.w : parseFloat(getComputedStyle(dlg).getPropertyValue("--sheet-w")) || 400);
    sheetSync(dlg);
  }
  function sheetShow(dlg) {
    if (dlg.getAttribute("data-mode") === "dock" && window.innerWidth >= SHEET_NARROW) { dlg.show(); sheetPush(); } else dlg.showModal();
  }
  document.addEventListener("click", function (e) {
    var t = e.target.closest && e.target.closest("[data-ui-sheet-dock], [data-ui-sheet-expand]"); if (!t) return;
    var dlg = t.closest("dialog.ui-sheet"); if (!dlg) return;
    if (t.hasAttribute("data-ui-sheet-expand")) { dlg.toggleAttribute("data-expanded"); sheetSync(dlg); sheetPush(); return; }
    dlg.setAttribute("data-mode", dlg.getAttribute("data-mode") === "dock" ? "overlay" : "dock"); dlg.removeAttribute("data-mode-auto");
    sheetSync(dlg); sheetKeep(dlg);
    // reopen in the other mode without handing focus back to the page
    // reopen at once: the "close" the browser fires (or skips) for this finds the panel open, and is not a real close
    if (dlg.open) { dlg.close(); sheetShow(dlg); t.focus(); }
    sheetPush();
  });
  // a docked panel is not a modal, so the browser does not close it on Escape: it closes when focus is inside it
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape" || e.defaultPrevented) return;
    var dlg = e.target.closest && e.target.closest("dialog.ui-sheet[open]");
    if (dlg && !dlg.matches(":modal")) { e.preventDefault(); closeDialog(dlg); }
  });
  var sheetDrag = null;
  document.addEventListener("pointerdown", function (e) {
    var h = e.target.closest && e.target.closest(".ui-sheet-resize"); if (!h || e.button !== 0) return;
    var dlg = h.closest("dialog.ui-sheet"); if (!dlg) return;
    e.preventDefault(); h.setPointerCapture && h.setPointerCapture(e.pointerId);
    sheetDrag = { dlg: dlg, h: h }; h.classList.add("is-active"); dlg.classList.add("is-resizing"); document.documentElement.setAttribute("data-ui-sheet-resizing", "");
  });
  document.addEventListener("pointermove", function (e) { if (sheetDrag) sheetWidth(sheetDrag.dlg, window.innerWidth - e.clientX); });
  function sheetDragEnd() {
    if (!sheetDrag) return;
    sheetDrag.h.classList.remove("is-active"); sheetDrag.dlg.classList.remove("is-resizing"); document.documentElement.removeAttribute("data-ui-sheet-resizing");
    sheetKeep(sheetDrag.dlg); sheetDrag = null;
  }
  document.addEventListener("pointerup", sheetDragEnd);
  document.addEventListener("pointercancel", sheetDragEnd);
  document.addEventListener("keydown", function (e) {
    var h = e.target.closest && e.target.closest(".ui-sheet-resize"); if (!h) return;
    var dlg = h.closest("dialog.ui-sheet"), now = parseFloat(dlg.style.getPropertyValue("--sheet-w")) || dlg.offsetWidth, step = e.shiftKey ? 64 : 16, b = sheetBounds(dlg), to = null;
    // the panel is on the right: Left makes it wider, Right narrower
    if (e.key === "ArrowLeft") to = now + step; else if (e.key === "ArrowRight") to = now - step; else if (e.key === "Home") to = b.min; else if (e.key === "End") to = b.max;
    if (to === null) return;
    e.preventDefault(); sheetWidth(dlg, to); sheetKeep(dlg);
  });
  window.addEventListener("resize", function () { Array.prototype.forEach.call(document.querySelectorAll("dialog.ui-sheet[open] .ui-sheet-resize"), function (h) { var d = h.closest("dialog"); sheetWidth(d, d.offsetWidth); }); sheetPush(); });

  var lastOpener = new WeakMap();
  function openDialog(dlg, opener) {
    if (!dlg || dlg.open) return;
    lastOpener.set(dlg, opener || document.activeElement);
    if (dlg.classList.contains("ui-sheet")) { sheetPrep(dlg); sheetShow(dlg); return; }
    dlg.showModal();
  }
  // a side panel gives the page its room back at once, not only on "close" (which a browser may hold back for a while)
  function closeDialog(dlg) { if (dlg && dlg.open) { dlg.close(); if (dlg.classList.contains("ui-sheet")) sheetPush(); } }
  function wireDialog(dlg) {
    if (dlg._ui) return;
    dlg._ui = true;
    // a click whose target is the dialog element itself landed on the backdrop
    dlg.addEventListener("click", function (e) { if (e.target === dlg && dlg.matches(":modal")) dlg.close(); });
    dlg.addEventListener("close", function () {
      if (dlg.classList.contains("ui-sheet")) sheetPush();
      if (dlg.open) return; // a side panel switching between docked and overlay, already open again
      var back = lastOpener.get(dlg);
      if (back && back.focus && document.contains(back)) back.focus();
    });
  }

  // A line chart in an SVG that stretches to its box; strokes keep their width (non-scaling-stroke)
  function chartSvg(values, w, h) {
    var max = Math.max.apply(null, values), min = Math.min.apply(null, values), span = max - min || 1, pad = 6;
    var pts = values.map(function (v, i) { return [i * w / (values.length - 1), pad + (h - 2 * pad) * (1 - (v - min) / span)]; });
    var line = pts.map(function (p, i) { return (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1); }).join(" ");
    var grid = [0.25, 0.5, 0.75].map(function (f) { return '<line class="ui-chart-grid" x1="0" x2="' + w + '" y1="' + h * f + '" y2="' + h * f + '" vector-effect="non-scaling-stroke"/>'; }).join("");
    return '<svg viewBox="0 0 ' + w + " " + h + '" preserveAspectRatio="none" aria-hidden="true">' + grid +
      '<path class="ui-chart-area" d="' + line + " L" + w + " " + h + " L0 " + h + ' Z"/>' +
      '<path class="ui-chart-line" d="' + line + '" vector-effect="non-scaling-stroke"/></svg>';
  }
  function chart(el) {
    var values = (el.getAttribute("data-values") || "").split(",").map(Number).filter(function (n) { return !isNaN(n); });
    if (values.length < 2) return;
    var labels = (el.getAttribute("data-labels") || "").split(",").filter(Boolean);
    var name = el.getAttribute("data-label") || "Chart";
    el.setAttribute("role", "img");
    el.setAttribute("aria-label", name + ": " + values.map(function (v, i) { return (labels[i] ? labels[i] + " " : "") + v; }).join(", "));
    el._uiChart = { values: values, labels: labels };
    el.innerHTML = chartSvg(values, 600, 200) + '<span class="ui-chart-marker" aria-hidden="true" hidden></span><span class="ui-chart-tip" aria-hidden="true" hidden></span>' + (labels.length ? '<div class="ui-chart-axis" aria-hidden="true">' + labels.map(function (l) { return "<span>" + l + "</span>"; }).join("") + "</div>" : "");
  }

  // Hover: a marker and the nearest point's value. Pointer only; the values are already the chart's text alternative.
  document.addEventListener("pointermove", function (e) {
    var el = e.target.closest && e.target.closest(".ui-chart");
    document.querySelectorAll(".ui-chart-tip:not([hidden])").forEach(function (t) { if (!el || !el.contains(t)) { t.hidden = true; t.previousElementSibling.hidden = true; } });
    if (!el || !el._uiChart || e.pointerType === "touch" && e.type !== "pointermove") return;
    var svg = el.querySelector("svg"), d = el._uiChart, r = svg.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return;
    var i = Math.round((e.clientX - r.left) / r.width * (d.values.length - 1));
    var max = Math.max.apply(null, d.values), min = Math.min.apply(null, d.values), span = max - min || 1;
    var x = i / (d.values.length - 1) * r.width, y = (6 + (200 - 12) * (1 - (d.values[i] - min) / span)) / 200 * r.height;
    var tip = el.querySelector(".ui-chart-tip"), mark = el.querySelector(".ui-chart-marker");
    mark.hidden = false; tip.hidden = false;
    mark.style.left = x + "px"; mark.style.height = r.height + "px";
    tip.textContent = (d.labels[i] ? d.labels[i] + ": " : "") + d.values[i].toLocaleString();
    tip.style.left = Math.max(0, Math.min(r.width - tip.offsetWidth, x - tip.offsetWidth / 2)) + "px";
    tip.style.top = Math.max(0, y - 34) + "px";
  });

  // ── checkboxes: markup cannot set "indeterminate", so data-indeterminate does; data-ui-checkall="<name>" makes
  //    a box that checks every box of that name and shows mixed when some are checked
  function syncCheckAll(all) {
    var name = all.getAttribute("data-ui-checkall");
    // a disabled box cannot be changed from here, so it does not count toward "all"
    var boxes = Array.prototype.slice.call(document.querySelectorAll('input[type="checkbox"][name="' + name + '"]:not(:disabled)'));
    var on = boxes.filter(function (b) { return b.checked; }).length;
    all.checked = on === boxes.length && on > 0;
    all.indeterminate = on > 0 && on < boxes.length;
  }
  document.addEventListener("change", function (e) {
    var t = e.target;
    if (!t.matches) return;
    if (t.matches("[data-ui-checkall]")) {
      document.querySelectorAll('input[type="checkbox"][name="' + t.getAttribute("data-ui-checkall") + '"]').forEach(function (b) { if (!b.disabled) b.checked = t.checked; });
      syncCheckAll(t);
    } else if (t.type === "checkbox" && t.name) {
      document.querySelectorAll('[data-ui-checkall="' + t.name + '"]').forEach(syncCheckAll);
    }
  });

  // ── slider: the filled part of the track follows the value
  function slider(el) {
    var min = +el.min || 0, max = el.max === "" ? 100 : +el.max, pct = (el.value - min) / (max - min || 1) * 100;
    el.style.setProperty("--value", pct + "%");
    var out = el.id && document.querySelector('output[for~="' + el.id + '"]');
    if (out) out.textContent = (el.getAttribute("data-prefix") || "") + Number(el.value).toLocaleString() + (el.getAttribute("data-suffix") || "");
  }
  document.addEventListener("input", function (e) { if (e.target.classList && e.target.classList.contains("ui-slider")) slider(e.target); });

  // ── button group: with data-ui-single on the group, pressing one releases the others
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest(".ui-btngroup-item[aria-pressed]");
    if (!b || b.disabled) return;
    var group = b.closest(".ui-btngroup");
    if (group && group.hasAttribute("data-ui-single")) {
      group.querySelectorAll(".ui-btngroup-item[aria-pressed]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
    } else b.setAttribute("aria-pressed", String(b.getAttribute("aria-pressed") !== "true"));
    group && group.dispatchEvent(new CustomEvent("ui-change", { bubbles: true, detail: { item: b } }));
  });

  // ── dropdown menu (the menu button pattern): Enter, Space or ArrowDown opens on the first item, ArrowUp on the last
  var openMenuBtn = null;
  function menuOf(btn) { return document.getElementById(btn.getAttribute("aria-controls")); }
  function menuItems(menu) { return Array.prototype.slice.call(menu.querySelectorAll('[role="menuitem"]:not([aria-disabled="true"])')); }
  function openMenu(btn, at) {
    if (openMenuBtn && openMenuBtn !== btn) closeMenu(false);
    var menu = menuOf(btn), wrap = btn.closest(".ui-menu-wrap");
    if (!menu) return;
    menu.hidden = false; btn.setAttribute("aria-expanded", "true"); openMenuBtn = btn;
    // flip to the right edge when the menu would run off the screen
    if (wrap) { wrap.removeAttribute("data-align"); if (menu.getBoundingClientRect().right > window.innerWidth - 8) wrap.setAttribute("data-align", "end"); }
    var items = menuItems(menu);
    if (items.length) (at === "last" ? items[items.length - 1] : items[0]).focus();
  }
  function closeMenu(focusBack) {
    var btn = openMenuBtn;
    if (!btn) return;
    var menu = menuOf(btn);
    if (menu) menu.hidden = true;
    btn.setAttribute("aria-expanded", "false"); openMenuBtn = null;
    if (focusBack) btn.focus();
  }
  document.addEventListener("click", function (e) {
    var btn = e.target.closest && e.target.closest('[aria-haspopup="menu"]');
    if (btn) { if (btn.getAttribute("aria-expanded") === "true") closeMenu(true); else openMenu(btn); return; }
    var item = e.target.closest && e.target.closest('[role="menuitem"]');
    if (item && openMenuBtn && menuOf(openMenuBtn).contains(item)) {
      if (item.getAttribute("aria-disabled") === "true") return;
      item.dispatchEvent(new CustomEvent("ui-select", { bubbles: true, detail: { item: item } }));
      closeMenu(true); return;
    }
    if (openMenuBtn && !(menuOf(openMenuBtn) || document.body).contains(e.target)) closeMenu(false);
  });
  document.addEventListener("keydown", function (e) {
    var btn = e.target.closest && e.target.closest('[aria-haspopup="menu"]');
    if (btn && (e.key === "ArrowDown" || e.key === "ArrowUp")) { e.preventDefault(); openMenu(btn, e.key === "ArrowUp" ? "last" : "first"); return; }
    if (!openMenuBtn) return;
    var menu = menuOf(openMenuBtn);
    if (!menu || !menu.contains(e.target)) return;
    var items = menuItems(menu), i = items.indexOf(document.activeElement), next = null;
    if (e.key === "ArrowDown") next = items[(i + 1) % items.length];
    else if (e.key === "ArrowUp") next = items[(i - 1 + items.length) % items.length];
    else if (e.key === "Home") next = items[0];
    else if (e.key === "End") next = items[items.length - 1];
    else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); closeMenu(true); return; }
    else if (e.key === "Tab") { closeMenu(false); return; }
    else if (e.key.length === 1 && /\S/.test(e.key)) {
      // type to jump: the next item starting with that letter
      var k = e.key.toLowerCase(), order = items.slice(i + 1).concat(items.slice(0, i + 1));
      next = order.filter(function (x) { return x.textContent.trim().toLowerCase().indexOf(k) === 0; })[0] || null;
    }
    if (next) { e.preventDefault(); next.focus(); }
  });

  // ── text editor: a toolbar of the browser's editing commands over a contenteditable area. execCommand is old but
  //    still supported everywhere and keeps undo working; a product that needs more should use a real editor library
  function editor(root) {
    if (root._uiEditor) return;
    root._uiEditor = true;
    var area = root.querySelector(".ui-editor-area"), tools = Array.prototype.slice.call(root.querySelectorAll(".ui-editor-tool"));
    var count = root.querySelector("[data-ui-count]");
    tools.forEach(function (t, i) { t.tabIndex = i === 0 ? 0 : -1; });
    function sync() {
      tools.forEach(function (t) {
        var cmd = t.getAttribute("data-cmd"), on = false;
        try { on = cmd === "formatBlock" ? /blockquote/i.test(document.queryCommandValue("formatBlock")) : document.queryCommandState(cmd); } catch (x) { /* not a state command */ }
        if (t.hasAttribute("aria-pressed")) t.setAttribute("aria-pressed", String(!!on));
      });
      if (count) { var words = area.textContent.trim().split(/\s+/).filter(Boolean).length; count.textContent = words + (words === 1 ? " word" : " words"); }
    }
    root.querySelector(".ui-editor-toolbar").addEventListener("keydown", function (e) {
      var i = tools.indexOf(document.activeElement), next = null;
      if (e.key === "ArrowRight") next = tools[(i + 1) % tools.length];
      else if (e.key === "ArrowLeft") next = tools[(i - 1 + tools.length) % tools.length];
      else if (e.key === "Home") next = tools[0];
      else if (e.key === "End") next = tools[tools.length - 1];
      if (next) { e.preventDefault(); tools.forEach(function (t) { t.tabIndex = -1; }); next.tabIndex = 0; next.focus(); }
    });
    // mousedown keeps the selection in the text while a tool is clicked
    tools.forEach(function (t) {
      t.addEventListener("mousedown", function (e) { e.preventDefault(); });
      t.addEventListener("click", function () {
        var cmd = t.getAttribute("data-cmd");
        area.focus();
        if (cmd === "formatBlock") document.execCommand("formatBlock", false, /blockquote/i.test(document.queryCommandValue("formatBlock")) ? "p" : "blockquote");
        else document.execCommand(cmd, false, null);
        sync();
        area.dispatchEvent(new Event("input", { bubbles: true }));
      });
    });
    area.addEventListener("input", sync);
    document.addEventListener("selectionchange", function () { if (area.contains(document.getSelection().anchorNode)) sync(); });
    sync();
  }

  // ── video player
  var ICON = {
    play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5Z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>',
    sound: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/></svg>',
    muted: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="m22 9-6 6M16 9l6 6"/></svg>'
  };
  function clock(s) { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }
  function video(root) {
    if (root._uiVideo) return;
    root._uiVideo = true;
    var v = root.querySelector("video"), play = root.querySelector("[data-ui-play]"), big = root.querySelector(".ui-video-big");
    var mute = root.querySelector("[data-ui-mute]"), full = root.querySelector("[data-ui-full]"), seek = root.querySelector(".ui-slider"), time = root.querySelector(".ui-video-time");
    var idle = null;
    function wake() { root.removeAttribute("data-idle"); clearTimeout(idle); idle = setTimeout(function () { if (!root.contains(document.activeElement) || document.activeElement === v) root.setAttribute("data-idle", ""); }, 2000); }
    function paint() {
      var on = !v.paused;
      root.toggleAttribute("data-playing", on);
      if (play) { play.innerHTML = on ? ICON.pause : ICON.play; play.setAttribute("aria-label", on ? "Pause" : "Play"); }
      if (mute) { mute.innerHTML = v.muted ? ICON.muted : ICON.sound; mute.setAttribute("aria-label", v.muted ? "Unmute" : "Mute"); }
      if (seek && v.duration) {
        seek.max = String(Math.round(v.duration * 10)); seek.value = String(Math.round(v.currentTime * 10));
        seek.setAttribute("aria-valuetext", clock(v.currentTime) + " of " + clock(v.duration)); slider(seek);
      }
      if (time) time.textContent = clock(v.currentTime) + " / " + clock(v.duration);
    }
    function toggle() { if (v.paused) v.play(); else v.pause(); }
    [play, big].forEach(function (b) { if (b) b.addEventListener("click", toggle); });
    v.addEventListener("click", toggle);
    if (mute) mute.addEventListener("click", function () { v.muted = !v.muted; paint(); });
    if (full) full.addEventListener("click", function () { if (document.fullscreenElement) document.exitFullscreen(); else if (root.requestFullscreen) root.requestFullscreen(); });
    if (seek) seek.addEventListener("input", function () { v.currentTime = seek.value / 10; });
    ["play", "pause", "timeupdate", "loadedmetadata", "volumechange", "ended"].forEach(function (n) { v.addEventListener(n, paint); });
    root.addEventListener("pointermove", wake);
    root.addEventListener("focusin", wake);
    // k or Space plays and pauses, unless focus is on a control that uses the key itself
    root.addEventListener("keydown", function (e) {
      if (e.target.closest("button, input")) return;
      if (e.key === " " || e.key === "k") { e.preventDefault(); toggle(); }
    });
    paint();
  }

  // ── pagination: [data-ui-pagination data-page data-count] draws itself and moves; fires "ui-page" with the new page
  function pageList(page, count) {
    var want = [1, count, page - 1, page, page + 1].filter(function (n, i, a) { return n >= 1 && n <= count && a.indexOf(n) === i; }).sort(function (a, b) { return a - b; });
    var out = []; want.forEach(function (n, i) { if (i && n - want[i - 1] > 1) out.push(null); out.push(n); }); return out;
  }
  var ARROW_L = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>';
  var ARROW_R = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>';
  function pagination(nav, focusPage) {
    var page = +nav.getAttribute("data-page") || 1, count = +nav.getAttribute("data-count") || 1;
    nav.innerHTML = '<button type="button" class="ui-btn ui-btn--sm" data-ui-to="' + (page - 1) + '"' + (page <= 1 ? " disabled" : "") + ">" + ARROW_L + "Previous</button>" +
      '<ul class="ui-pagination-pages">' + pageList(page, count).map(function (n) {
        return "<li>" + (n === null ? '<span class="ui-page-gap" aria-hidden="true">…</span>' : '<button type="button" class="ui-page" data-ui-to="' + n + '" aria-label="Page ' + n + '"' + (n === page ? ' aria-current="page"' : "") + ">" + n + "</button>") + "</li>";
      }).join("") + "</ul>" +
      '<span class="ui-pagination-info" aria-live="polite">Page ' + page + " of " + count + "</span>" +
      '<button type="button" class="ui-btn ui-btn--sm" data-ui-to="' + (page + 1) + '"' + (page >= count ? " disabled" : "") + ">Next" + ARROW_R + "</button>";
    if (focusPage) { var cur = nav.querySelector('[aria-current="page"]'); if (cur) cur.focus(); }
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-ui-pagination] [data-ui-to]");
    if (!b || b.disabled) return;
    var nav = b.closest("[data-ui-pagination]");
    nav.setAttribute("data-page", b.getAttribute("data-ui-to"));
    pagination(nav, true);
    nav.dispatchEvent(new CustomEvent("ui-page", { bubbles: true, detail: { page: +nav.getAttribute("data-page") } }));
  });

  // ── calendar: [data-ui-calendar data-value="2026-04-18" data-events="2026-04-11,…"] draws a month and keeps
  //    the roving day; choosing a day fires "ui-date" with { value: "YYYY-MM-DD" }
  var MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var DOW = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"], DOW_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  function iso(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function fromIso(s) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ""); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; }
  function calendar(el, focusDay) {
    var value = fromIso(el.getAttribute("data-value")), today = new Date(), events = (el.getAttribute("data-events") || "").split(",");
    var cursor = fromIso(el.getAttribute("data-cursor")) || value || today;
    el.setAttribute("data-cursor", iso(cursor));
    var y = cursor.getFullYear(), mo = cursor.getMonth(), first = new Date(y, mo, 1), start = new Date(y, mo, 1 - first.getDay());
    var id = el.id || (el.id = "cal-" + Math.random().toString(36).slice(2, 8));
    var rows = "";
    for (var w = 0; w < 6; w++) {
      rows += "<tr>";
      for (var d = 0; d < 7; d++) {
        var day = new Date(start.getFullYear(), start.getMonth(), start.getDate() + w * 7 + d), s = iso(day);
        rows += '<td role="gridcell"><button type="button" class="ui-day" data-date="' + s + '" tabindex="' + (s === iso(cursor) ? 0 : -1) + '"' +
          ' aria-label="' + DOW_LONG[day.getDay()] + ", " + MONTH_NAMES[day.getMonth()] + " " + day.getDate() + (events.indexOf(s) >= 0 ? ", has events" : "") + '"' +
          (day.getMonth() !== mo ? " data-outside" : "") + (s === iso(today) ? ' aria-current="date"' : "") +
          ' aria-selected="' + (!!value && s === iso(value)) + '"' + (events.indexOf(s) >= 0 ? " data-event" : "") + ">" + day.getDate() + "</button></td>";
      }
      rows += "</tr>";
    }
    var NAV = function (dir, label, path) { return '<button type="button" class="ui-btn ui-btn--sm ui-btn--icon ui-btn--ghost" data-cal-step="' + dir + '" aria-label="' + label + '"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + path + '"/></svg></button>'; };
    el.innerHTML = '<div class="ui-calendar-head">' + NAV(-1, "Previous month", "m15 18-6-6 6-6") +
      '<h3 class="ui-calendar-title" id="' + id + '-t" aria-live="polite">' + MONTH_NAMES[mo] + " " + y + "</h3>" + NAV(1, "Next month", "m9 18 6-6-6-6") + "</div>" +
      '<table role="grid" aria-labelledby="' + id + '-t"><thead><tr>' + DOW.map(function (x, i) { return '<th scope="col" abbr="' + DOW_LONG[i] + '">' + x + "</th>"; }).join("") + "</tr></thead><tbody>" + rows + "</tbody></table>";
    if (focusDay) { var f = el.querySelector('[tabindex="0"]'); if (f) f.focus(); }
  }
  function calMove(el, days, months) {
    var c = fromIso(el.getAttribute("data-cursor")), n = months ? new Date(c.getFullYear(), c.getMonth() + months, Math.min(c.getDate(), 28)) : new Date(c.getFullYear(), c.getMonth(), c.getDate() + days);
    el.setAttribute("data-cursor", iso(n)); calendar(el, true);
  }
  document.addEventListener("click", function (e) {
    var step = e.target.closest && e.target.closest("[data-ui-calendar] [data-cal-step]");
    if (step) { var cal = step.closest("[data-ui-calendar]"), c = fromIso(cal.getAttribute("data-cursor")); cal.setAttribute("data-cursor", iso(new Date(c.getFullYear(), c.getMonth() + +step.getAttribute("data-cal-step"), 1))); calendar(cal, false); return; }
    var day = e.target.closest && e.target.closest("[data-ui-calendar] .ui-day");
    if (day && !day.disabled) {
      var el = day.closest("[data-ui-calendar]");
      el.setAttribute("data-value", day.getAttribute("data-date")); el.setAttribute("data-cursor", day.getAttribute("data-date")); calendar(el, true);
      el.dispatchEvent(new CustomEvent("ui-date", { bubbles: true, detail: { value: day.getAttribute("data-date") } }));
    }
  });
  document.addEventListener("keydown", function (e) {
    var day = e.target.closest && e.target.closest("[data-ui-calendar] .ui-day");
    if (!day) return;
    var el = day.closest("[data-ui-calendar]"), k = e.key, c = fromIso(el.getAttribute("data-cursor"));
    var moves = { ArrowLeft: [-1], ArrowRight: [1], ArrowUp: [-7], ArrowDown: [7], Home: [-c.getDay()], End: [6 - c.getDay()], PageUp: [0, -1], PageDown: [0, 1] };
    if (moves[k]) { e.preventDefault(); calMove(el, moves[k][0], moves[k][1]); }
  });

  // ── date picker: [data-ui-datepicker] around a .ui-datepicker-btn and a hidden .ui-datepicker-pop with a calendar
  function datepickerShow(dp, open) {
    var pop = dp.querySelector(".ui-datepicker-pop"), btn = dp.querySelector(".ui-datepicker-btn");
    pop.hidden = !open; btn.setAttribute("aria-expanded", String(open));
    if (open) {
      dp.removeAttribute("data-align");
      if (pop.getBoundingClientRect().right > window.innerWidth - 8) dp.setAttribute("data-align", "end");
      var cal = pop.querySelector("[data-ui-calendar]"); calendar(cal, true);
    }
  }
  function datepickerLabel(dp) {
    var v = fromIso(dp.querySelector("[data-ui-calendar]").getAttribute("data-value")), btn = dp.querySelector(".ui-datepicker-btn"), out = btn.querySelector("span");
    if (v) { out.textContent = v.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" }); btn.removeAttribute("data-empty"); }
  }
  document.addEventListener("click", function (e) {
    var btn = e.target.closest && e.target.closest("[data-ui-datepicker] .ui-datepicker-btn");
    if (btn) { var dp = btn.closest("[data-ui-datepicker]"); datepickerShow(dp, dp.querySelector(".ui-datepicker-pop").hidden); return; }
    document.querySelectorAll("[data-ui-datepicker]").forEach(function (dp) { if (!dp.contains(e.target) && !dp.querySelector(".ui-datepicker-pop").hidden) datepickerShow(dp, false); });
  });
  document.addEventListener("ui-date", function (e) {
    var dp = e.target.closest && e.target.closest("[data-ui-datepicker]");
    if (!dp) return;
    datepickerLabel(dp); datepickerShow(dp, false); dp.querySelector(".ui-datepicker-btn").focus();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    var dp = e.target.closest && e.target.closest("[data-ui-datepicker]");
    if (dp && !dp.querySelector(".ui-datepicker-pop").hidden) { e.preventDefault(); e.stopPropagation(); datepickerShow(dp, false); dp.querySelector(".ui-datepicker-btn").focus(); }
  });

  // ── copy: [data-ui-copy="#id"] copies that element's text, then says so on the button for two seconds
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-ui-copy]");
    if (!b) return;
    var src = document.querySelector(b.getAttribute("data-ui-copy")), label = b.querySelector("span") || b, was = label.textContent;
    if (!src || !navigator.clipboard) return;
    navigator.clipboard.writeText(src.textContent).then(function () { label.textContent = "Copied"; setTimeout(function () { label.textContent = was; }, 2000); },
      function () { label.textContent = "Copy failed"; setTimeout(function () { label.textContent = was; }, 2000); });
  });

  // ── color picker: [data-ui-colorpick] keeps its swatches (a radiogroup), the native picker and the hex field in step;
  //    fires "ui-color" with { value: "#rrggbb" }
  function colorpickSet(root, hex, from) {
    hex = hex.toLowerCase();
    root.querySelectorAll(".ui-swatch").forEach(function (s) { var on = s.getAttribute("data-color").toLowerCase() === hex; s.setAttribute("aria-checked", String(on)); s.tabIndex = on ? 0 : -1; });
    if (!root.querySelector('.ui-swatch[aria-checked="true"]')) { var f = root.querySelector(".ui-swatch"); if (f) f.tabIndex = 0; }
    var native = root.querySelector('input[type="color"]'), text = root.querySelector('input[type="text"]');
    if (native && from !== native) native.value = hex;
    if (text && from !== text) text.value = hex;
    root.dispatchEvent(new CustomEvent("ui-color", { bubbles: true, detail: { value: hex } }));
  }
  document.addEventListener("click", function (e) {
    var s = e.target.closest && e.target.closest("[data-ui-colorpick] .ui-swatch");
    if (s) colorpickSet(s.closest("[data-ui-colorpick]"), s.getAttribute("data-color"), s);
  });
  document.addEventListener("input", function (e) {
    var root = e.target.closest && e.target.closest("[data-ui-colorpick]");
    if (!root || e.target.tagName !== "INPUT") return;
    var v = e.target.value.trim();
    if (e.target.type === "text") { if (/^#?[0-9a-f]{6}$/i.test(v)) colorpickSet(root, v[0] === "#" ? v : "#" + v, e.target); e.target.setAttribute("aria-invalid", String(!/^#?[0-9a-f]{6}$/i.test(v))); }
    else colorpickSet(root, v, e.target);
  });
  document.addEventListener("keydown", function (e) {
    var s = e.target.closest && e.target.closest("[data-ui-colorpick] .ui-swatch");
    if (!s) return;
    var all = Array.prototype.slice.call(s.parentElement.querySelectorAll(".ui-swatch")), i = all.indexOf(s), n = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") n = all[(i + 1) % all.length];
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") n = all[(i - 1 + all.length) % all.length];
    if (n) { e.preventDefault(); colorpickSet(s.closest("[data-ui-colorpick]"), n.getAttribute("data-color"), n); n.focus(); }
  });

  // ── command menu: a <dialog data-ui-command> with an input (role="combobox") over a listbox of
  //    [role="option"][data-keywords]; ⌘K or Ctrl+K opens the first one on the page; Enter fires "ui-command"
  function commandFilter(dlg) {
    var q = dlg.querySelector('[role="combobox"]').value.trim().toLowerCase(), shown = 0;
    dlg.querySelectorAll('[role="option"]').forEach(function (o) { var hit = !q || (o.textContent + " " + (o.getAttribute("data-keywords") || "")).toLowerCase().indexOf(q) >= 0; o.hidden = !hit; if (hit) shown++; });
    dlg.querySelectorAll('[role="group"]').forEach(function (g) { g.hidden = !g.querySelector('[role="option"]:not([hidden])'); });
    var empty = dlg.querySelector(".ui-command-empty"); if (empty) empty.hidden = shown > 0;
    commandActive(dlg, dlg.querySelector('[role="option"]:not([hidden])'));
  }
  function commandActive(dlg, opt) {
    var input = dlg.querySelector('[role="combobox"]');
    dlg.querySelectorAll('[role="option"]').forEach(function (o) { o.setAttribute("aria-selected", String(o === opt)); });
    if (opt) { input.setAttribute("aria-activedescendant", opt.id); opt.scrollIntoView({ block: "nearest" }); } else input.removeAttribute("aria-activedescendant");
  }
  function commandRun(dlg, opt) { if (!opt) return; opt.dispatchEvent(new CustomEvent("ui-command", { bubbles: true, detail: { item: opt } })); dlg.close(); }
  function commandOpen(dlg, opener) { var input = dlg.querySelector('[role="combobox"]'); input.value = ""; commandFilter(dlg); openDialog(dlg, opener); input.focus(); }
  document.addEventListener("input", function (e) { var dlg = e.target.closest && e.target.closest("[data-ui-command]"); if (dlg && e.target.getAttribute("role") === "combobox") commandFilter(dlg); });
  document.addEventListener("keydown", function (e) {
    if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) { var d = document.querySelector("dialog[data-ui-command]"); if (d && !d.open) { e.preventDefault(); wireDialog(d); commandOpen(d, document.activeElement); } return; }
    var dlg = e.target.closest && e.target.closest("[data-ui-command]");
    if (!dlg || e.target.getAttribute("role") !== "combobox") return;
    var opts = Array.prototype.slice.call(dlg.querySelectorAll('[role="option"]:not([hidden])')), cur = dlg.querySelector('[role="option"][aria-selected="true"]'), i = opts.indexOf(cur);
    if (e.key === "ArrowDown") { e.preventDefault(); commandActive(dlg, opts[(i + 1) % opts.length]); }
    else if (e.key === "ArrowUp") { e.preventDefault(); commandActive(dlg, opts[(i - 1 + opts.length) % opts.length]); }
    else if (e.key === "Enter") { e.preventDefault(); commandRun(dlg, cur); }
  });
  document.addEventListener("click", function (e) {
    var open = e.target.closest && e.target.closest("[data-ui-command-open]");
    if (open) { var d = document.getElementById(open.getAttribute("data-ui-command-open")); if (d) { wireDialog(d); commandOpen(d, open); } return; }
    var opt = e.target.closest && e.target.closest("[data-ui-command] [role='option']");
    if (opt) commandRun(opt.closest("[data-ui-command]"), opt);
  });
  document.addEventListener("mousemove", function (e) { var opt = e.target.closest && e.target.closest("[data-ui-command] [role='option']"); if (opt && opt.getAttribute("aria-selected") !== "true") commandActive(opt.closest("[data-ui-command]"), opt); });

  // ── file drop zone: [data-ui-dropzone] around a label.ui-dropzone (with its file input) and a ul.ui-files;
  //    lists what was chosen or dropped (nothing is uploaded) and fires "ui-files" with the File list
  function fileSize(n) { return n < 1024 ? n + " B" : n < 1048576 ? (n / 1024).toFixed(1) + " KB" : (n / 1048576).toFixed(1) + " MB"; }
  var FILE_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>';
  var X_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>';
  function dropzoneAdd(root, files) {
    var list = root.querySelector(".ui-files");
    Array.prototype.forEach.call(files, function (f) {
      var li = document.createElement("li"); li.className = "ui-file";
      li.innerHTML = FILE_ICON + '<span class="ui-file-name"></span><span class="ui-file-size">' + fileSize(f.size) + '</span><button type="button" class="ui-tag-remove" data-ui-file-remove></button>';
      li.querySelector(".ui-file-name").textContent = f.name;
      li.querySelector("button").setAttribute("aria-label", "Remove " + f.name); li.querySelector("button").innerHTML = X_ICON;
      list.appendChild(li);
    });
    root.dispatchEvent(new CustomEvent("ui-files", { bubbles: true, detail: { files: files } }));
  }
  document.addEventListener("change", function (e) { var root = e.target.closest && e.target.closest("[data-ui-dropzone]"); if (root && e.target.type === "file") { dropzoneAdd(root, e.target.files); e.target.value = ""; } });
  ["dragenter", "dragover"].forEach(function (n) { document.addEventListener(n, function (e) { var z = e.target.closest && e.target.closest(".ui-dropzone"); if (z && z.closest("[data-ui-dropzone]")) { e.preventDefault(); z.classList.add("is-drag"); } }); });
  ["dragleave", "drop"].forEach(function (n) { document.addEventListener(n, function (e) { var z = e.target.closest && e.target.closest(".ui-dropzone"); if (z) { z.classList.remove("is-drag"); if (n === "drop" && z.closest("[data-ui-dropzone]")) { e.preventDefault(); dropzoneAdd(z.closest("[data-ui-dropzone]"), e.dataTransfer.files); } } }); });
  document.addEventListener("click", function (e) {
    var x = e.target.closest && e.target.closest("[data-ui-file-remove]"); if (!x) return;
    var li = x.closest(".ui-file"), next = li.nextElementSibling || li.previousElementSibling, root = li.closest("[data-ui-dropzone]");
    li.remove(); (next ? next.querySelector("button") : root.querySelector("input[type=file]")).focus();
  });

  // ── chips: .ui-chip[aria-pressed] toggles; fires "ui-change" from the chip
  document.addEventListener("click", function (e) {
    var c = e.target.closest && e.target.closest(".ui-chip[aria-pressed]");
    if (!c || c.disabled) return;
    c.setAttribute("aria-pressed", String(c.getAttribute("aria-pressed") !== "true"));
    c.dispatchEvent(new CustomEvent("ui-change", { bubbles: true, detail: { item: c } }));
  });

  // ── chat: [data-ui-chat] sends from its composer: Enter sends, Shift+Enter adds a line; fires "ui-send" with the text
  function chatSend(root) {
    var box = root.querySelector(".ui-chat-compose textarea"), text = box.value.trim();
    if (!text) return;
    var li = document.createElement("li"); li.className = "ui-msg ui-msg--out";
    li.innerHTML = '<div class="ui-msg-bubble"></div><span class="ui-msg-meta">You · just now</span>';
    li.querySelector(".ui-msg-bubble").textContent = text;
    var log = root.querySelector(".ui-chat-log"); log.appendChild(li); log.scrollTop = log.scrollHeight;
    box.value = ""; box.focus();
    root.dispatchEvent(new CustomEvent("ui-send", { bubbles: true, detail: { text: text } }));
  }
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Enter" || e.shiftKey || e.isComposing) return;
    var root = e.target.closest && e.target.closest("[data-ui-chat]");
    if (root && e.target.tagName === "TEXTAREA") { e.preventDefault(); chatSend(root); }
  });
  document.addEventListener("click", function (e) { var b = e.target.closest && e.target.closest("[data-ui-chat] [data-ui-send]"); if (b) chatSend(b.closest("[data-ui-chat]")); });

  // ── tree: [role="tree"].ui-tree, one roving tab stop; fires "ui-select" from the chosen item
  function treeVisible(tree) { return Array.prototype.slice.call(tree.querySelectorAll('[role="treeitem"]')).filter(function (t) { var p = t.parentElement.closest('[role="treeitem"]'); while (p) { if (p.getAttribute("aria-expanded") === "false") return false; p = p.parentElement.closest('[role="treeitem"]'); } return true; }); }
  function treeFocus(tree, item) { tree.querySelectorAll('[role="treeitem"]').forEach(function (t) { t.tabIndex = t === item ? 0 : -1; }); item.focus(); }
  function treeSelect(tree, item) { tree.querySelectorAll('[role="treeitem"]').forEach(function (t) { t.setAttribute("aria-selected", String(t === item)); }); item.dispatchEvent(new CustomEvent("ui-select", { bubbles: true, detail: { item: item } })); }
  document.addEventListener("click", function (e) {
    var row = e.target.closest && e.target.closest('.ui-tree .ui-tree-row');
    if (!row) return;
    var item = row.parentElement, tree = item.closest('[role="tree"]');
    if (item.hasAttribute("aria-expanded")) item.setAttribute("aria-expanded", String(item.getAttribute("aria-expanded") !== "true"));
    treeSelect(tree, item); treeFocus(tree, item);
  });
  document.addEventListener("keydown", function (e) {
    var item = e.target.closest && e.target.matches && e.target.matches('.ui-tree [role="treeitem"]') ? e.target : null;
    if (!item) return;
    var tree = item.closest('[role="tree"]'), vis = treeVisible(tree), i = vis.indexOf(item), exp = item.getAttribute("aria-expanded"), n = null;
    if (e.key === "ArrowDown") n = vis[i + 1];
    else if (e.key === "ArrowUp") n = vis[i - 1];
    else if (e.key === "Home") n = vis[0];
    else if (e.key === "End") n = vis[vis.length - 1];
    else if (e.key === "ArrowRight") { if (exp === "false") item.setAttribute("aria-expanded", "true"); else if (exp === "true") n = item.querySelector('[role="treeitem"]'); }
    else if (e.key === "ArrowLeft") { if (exp === "true") item.setAttribute("aria-expanded", "false"); else n = item.parentElement.closest('[role="treeitem"]'); }
    else if (e.key === "Enter" || e.key === " ") { treeSelect(tree, item); if (exp) item.setAttribute("aria-expanded", String(exp !== "true")); }
    else return;
    e.preventDefault();
    if (n) treeFocus(tree, n);
  });
  function tree(t) { var items = t.querySelectorAll('[role="treeitem"]'), sel = t.querySelector('[aria-selected="true"]') || items[0]; items.forEach(function (x) { x.tabIndex = x === sel ? 0 : -1; }); }

  // ── site header: on a narrow header the links fold into a menu; its button opens and closes the panel
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest(".ui-sitenav-toggle");
    if (!b) return;
    var panel = document.getElementById(b.getAttribute("aria-controls")), open = b.getAttribute("aria-expanded") !== "true";
    b.setAttribute("aria-expanded", String(open)); b.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    if (panel) { panel.hidden = !open; if (open) { var first = panel.querySelector("a, button"); if (first) first.focus(); } }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    var nav = e.target.closest && e.target.closest(".ui-sitenav"), b = nav && nav.querySelector('.ui-sitenav-toggle[aria-expanded="true"]');
    // claim the key, so a full-screen view or dialog around the header stays open
    if (b) { e.preventDefault(); b.click(); b.focus(); }
  });

  // ── banner: [data-ui-banner-close] hides its banner and fires "ui-dismiss"; focus moves to the next focusable
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-ui-banner-close]");
    if (!b) return;
    var banner = b.closest(".ui-banner"); if (!banner) return;
    banner.hidden = true; banner.dispatchEvent(new CustomEvent("ui-dismiss", { bubbles: true }));
    var next = banner.nextElementSibling && banner.nextElementSibling.querySelector("a, button, input, select, textarea, [tabindex]");
    if (next) next.focus();
  });

  // ── annotations: a pin ([data-annot="n"]) and its note ([data-annot-note="n"]) light up together
  function annotShow(root, n) {
    root.querySelectorAll("[data-annot]").forEach(function (p) { p.setAttribute("aria-pressed", String(p.getAttribute("data-annot") === n)); });
    root.querySelectorAll("[data-annot-note]").forEach(function (li) { li.toggleAttribute("data-active", li.getAttribute("data-annot-note") === n); });
  }
  document.addEventListener("click", function (e) {
    var pin = e.target.closest && e.target.closest(".ui-annot [data-annot]");
    if (pin) { var root = pin.closest(".ui-annot"), on = pin.getAttribute("aria-pressed") !== "true"; annotShow(root, on ? pin.getAttribute("data-annot") : ""); }
  });

  // ── sidebar (ui-sidebar): a rail when wide, a drawer when its app shell is under 720px (components.css) ──
  // data-ui-sidebar on the <aside>; buttons with aria-controls="<its id>" and data-ui-sidebar-toggle open and
  // close it; a group's button (data-ui-sidebar-group) opens its body in place.
  var SIDEBAR_NARROW = 720; // keep in step with the @container query in components.css
  function sidebarNarrow(sb) { var app = sb.closest(".ui-app"); return (app ? app.getBoundingClientRect().width : window.innerWidth) <= SIDEBAR_NARROW; }
  function sidebarSet(sb, open, focusBack) {
    sb.setAttribute("data-state", open ? "expanded" : "collapsed");
    Array.prototype.forEach.call(document.querySelectorAll('[data-ui-sidebar-toggle][aria-controls="' + sb.id + '"]'), function (b) {
      b.setAttribute("aria-expanded", String(open));
      if (b.classList.contains("ui-sidebar-toggle")) b.setAttribute("aria-label", sidebarNarrow(sb) ? "Close menu" : open ? "Collapse sidebar" : "Expand sidebar");
    });
    if (!open && focusBack) { var opener = document.querySelector('.ui-sidebar-open[aria-controls="' + sb.id + '"]'); if (opener && opener.offsetParent) opener.focus(); }
    // a drawer that opens takes focus, so Tab moves through it and Escape closes it
    if (open && focusBack && sidebarNarrow(sb)) { var first = sb.querySelector(".ui-sidebar-toggle, .ui-sidebar-item"); if (first) first.focus(); }
  }
  function sidebar(sb) { if (sidebarNarrow(sb)) sidebarSet(sb, false); else sidebarSet(sb, sb.getAttribute("data-state") !== "collapsed"); }
  document.addEventListener("click", function (e) {
    var t = e.target.closest && e.target.closest("[data-ui-sidebar-toggle]");
    if (t) { var sb = document.getElementById(t.getAttribute("aria-controls")); if (sb) sidebarSet(sb, sb.getAttribute("data-state") !== "expanded", true); return; }
    var g = e.target.closest && e.target.closest("[data-ui-sidebar-group]");
    if (g) {
      var bar = g.closest("[data-ui-sidebar]"), body = document.getElementById(g.getAttribute("aria-controls"));
      if (bar && bar.getAttribute("data-state") === "collapsed" && !sidebarNarrow(bar)) { sidebarSet(bar, true); g.setAttribute("aria-expanded", "true"); if (body) body.hidden = false; return; }
      var open = g.getAttribute("aria-expanded") !== "true"; g.setAttribute("aria-expanded", String(open)); if (body) body.hidden = !open; return;
    }
    // narrow: a tap outside the open drawer closes it
    Array.prototype.forEach.call(document.querySelectorAll('[data-ui-sidebar][data-state="expanded"]'), function (sb) {
      if (sidebarNarrow(sb) && !sb.contains(e.target)) sidebarSet(sb, false);
    });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape" || e.defaultPrevented) return;
    Array.prototype.forEach.call(document.querySelectorAll('[data-ui-sidebar][data-state="expanded"]'), function (sb) {
      if (sidebarNarrow(sb)) { sidebarSet(sb, false, true); e.preventDefault(); }
    });
  });

  // ── kanban board (ui-kanban): a card moves with its Move menu (keyboard, touch, screen readers) or by dragging it
  //    with a mouse. Each move updates the counts and the menus, says where the card went (a live region), puts focus
  //    back on the card's Move button, and fires "ui-kanban-move" { card, from, to, index } on the board so a page can
  //    save it. A board drawn by React (data-react) moves its own cards in react/Kanban.jsx; this leaves those alone.
  function kanbanCols(board) { return Array.prototype.slice.call(board.querySelectorAll(".ui-kanban-col")); }
  function kanbanCards(col, except) { return Array.prototype.filter.call(col.querySelectorAll(".ui-kanban-card"), function (c) { return c !== except; }); }
  function kanbanName(col) { var t = col.querySelector(".ui-kanban-title"); return t ? t.textContent.trim() : ""; }
  function kanbanCol(board, id) { return kanbanCols(board).filter(function (c) { return c.getAttribute("data-col") === id; })[0] || null; }
  function kanbanOff(el, off) { if (!el) return; if (off) el.setAttribute("aria-disabled", "true"); else el.removeAttribute("aria-disabled"); }
  // the counts, and which moves each card's menu offers (not to its own column, not up from the top or down from the bottom)
  function kanbanSync(board) {
    kanbanCols(board).forEach(function (col) {
      var cards = kanbanCards(col), n = col.querySelector("[data-kanban-n]") || col.querySelector(".ui-kanban-count");
      if (n) n.textContent = String(cards.length);
      cards.forEach(function (card, i) {
        Array.prototype.forEach.call(card.querySelectorAll("[data-kanban-to]"), function (it) { kanbanOff(it, it.getAttribute("data-kanban-to") === col.getAttribute("data-col")); });
        kanbanOff(card.querySelector('[data-kanban-step="-1"]'), i === 0);
        kanbanOff(card.querySelector('[data-kanban-step="1"]'), i === cards.length - 1);
      });
    });
  }
  function kanbanMove(card, col, index) {
    var board = card.closest("[data-ui-kanban]"), from = card.closest(".ui-kanban-col"), list = col.querySelector(".ui-kanban-list");
    var others = kanbanCards(col, card);
    index = Math.max(0, Math.min(index, others.length));
    if (index < others.length) list.insertBefore(card, others[index]); else list.appendChild(card);
    kanbanSync(board);
    var live = board.querySelector(".ui-kanban-live"), title = card.querySelector(".ui-kanban-card-title");
    if (live) live.textContent = (title ? title.textContent.trim() + ": " : "") + "moved to " + kanbanName(col) + ", " + (index + 1) + " of " + (others.length + 1);
    var btn = card.querySelector(".ui-kanban-move .ui-menu-trigger"); if (btn) btn.focus();
    board.dispatchEvent(new CustomEvent("ui-kanban-move", { bubbles: true, detail: { card: card.getAttribute("data-card"), from: from.getAttribute("data-col"), to: col.getAttribute("data-col"), index: index } }));
  }
  document.addEventListener("ui-select", function (e) {
    var it = e.detail && e.detail.item, card = it && it.closest(".ui-kanban-card"), board = card && card.closest("[data-ui-kanban]");
    if (!board || board.hasAttribute("data-react")) return;
    var col = card.closest(".ui-kanban-col");
    if (it.hasAttribute("data-kanban-to")) { var to = kanbanCol(board, it.getAttribute("data-kanban-to")); if (to && to !== col) kanbanMove(card, to, kanbanCards(to).length); }
    else if (it.hasAttribute("data-kanban-step")) kanbanMove(card, col, kanbanCards(col).indexOf(card) + Number(it.getAttribute("data-kanban-step")));
  });
  // where a dragged card would land: the column nearest the pointer, before the first card whose middle is below it
  function kanbanSpot(board, card, x, y) {
    var col = null, best = Infinity;
    kanbanCols(board).forEach(function (c) { var r = c.getBoundingClientRect(), d = x < r.left ? r.left - x : x > r.right ? x - r.right : 0; if (d < best) { best = d; col = c; } });
    if (!col) return null;
    var cards = kanbanCards(col, card), index = cards.filter(function (c) { var r = c.getBoundingClientRect(); return r.top + r.height / 2 < y; }).length;
    return { col: col, list: col.querySelector(".ui-kanban-list"), cards: cards, index: index };
  }
  var kanbanDrag = null;
  function kanbanDragEnd(drop) {
    var d = kanbanDrag; kanbanDrag = null;
    if (!d || !d.on) return;
    d.card.classList.remove("is-dragging"); d.board.classList.remove("is-sorting");
    if (d.line.parentNode) d.line.parentNode.removeChild(d.line);
    if (drop && d.spot) kanbanMove(d.card, d.spot.col, d.spot.index);
  }
  // mouse only: a finger on a card still scrolls the page; touch moves cards with the Move menu
  document.addEventListener("pointerdown", function (e) {
    if (e.pointerType !== "mouse" || e.button !== 0 || !e.target.closest) return;
    var card = e.target.closest(".ui-kanban-card");
    if (!card || e.target.closest("button, a, input, select, textarea, [role=menu]")) return;
    var board = card.closest("[data-ui-kanban]");
    if (!board || board.hasAttribute("data-react")) return;
    kanbanDrag = { card: card, board: board, x: e.clientX, y: e.clientY, on: false, line: null, spot: null };
  });
  document.addEventListener("pointermove", function (e) {
    var d = kanbanDrag; if (!d) return;
    if (!d.on) {
      if (Math.abs(e.clientX - d.x) + Math.abs(e.clientY - d.y) < 6) return;
      d.on = true; d.card.classList.add("is-dragging"); d.board.classList.add("is-sorting");
      d.line = document.createElement("li"); d.line.className = "ui-kanban-drop"; d.line.setAttribute("aria-hidden", "true");
      if (window.getSelection) window.getSelection().removeAllRanges();
    }
    e.preventDefault();
    var s = kanbanSpot(d.board, d.card, e.clientX, e.clientY); if (!s) return;
    if (s.index < s.cards.length) s.list.insertBefore(d.line, s.cards[s.index]); else s.list.appendChild(d.line);
    d.spot = s;
  });
  document.addEventListener("pointerup", function () { kanbanDragEnd(true); });
  document.addEventListener("pointercancel", function () { kanbanDragEnd(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && kanbanDrag && kanbanDrag.on) { e.preventDefault(); kanbanDragEnd(false); } });

  function init(scope) {
    scope = scope || document;
    Array.prototype.forEach.call(scope.querySelectorAll("[data-ui-kanban]:not([data-react])"), kanbanSync);
    Array.prototype.forEach.call(scope.querySelectorAll("[data-ui-tabs]"), tabs);
    Array.prototype.forEach.call(scope.querySelectorAll("[data-ui-sidebar]"), sidebar);
    Array.prototype.forEach.call(scope.querySelectorAll("dialog.ui-dialog"), wireDialog);
    Array.prototype.forEach.call(scope.querySelectorAll("[data-ui-chart]"), chart);
    Array.prototype.forEach.call(scope.querySelectorAll("[data-indeterminate]"), function (b) { b.indeterminate = true; });
    Array.prototype.forEach.call(scope.querySelectorAll("[data-ui-checkall]"), syncCheckAll);
    Array.prototype.forEach.call(scope.querySelectorAll(".ui-slider"), slider);
    Array.prototype.forEach.call(scope.querySelectorAll("[data-ui-editor]"), editor);
    Array.prototype.forEach.call(scope.querySelectorAll("[data-ui-video]"), video);
    Array.prototype.forEach.call(scope.querySelectorAll("[data-ui-pagination]"), function (n) { pagination(n, false); });
    Array.prototype.forEach.call(scope.querySelectorAll("[data-ui-calendar]"), function (n) { calendar(n, false); });
    Array.prototype.forEach.call(scope.querySelectorAll("[data-ui-datepicker]"), datepickerLabel);
    Array.prototype.forEach.call(scope.querySelectorAll(".ui-tree[role='tree']"), tree);
    Array.prototype.forEach.call(scope.querySelectorAll("[data-ui-colorpick]"), function (n) { var v = n.querySelector('input[type="color"]'); if (v) colorpickSet(n, v.value); });
  }

  // Escape dismisses any tooltip that is showing; leaving the wrap re-arms it
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    Array.prototype.forEach.call(document.querySelectorAll(".ui-tooltip-wrap:hover, .ui-tooltip-wrap:focus-within"), function (w) { w.classList.add("is-dismissed"); });
  });
  function rearm(e) { var w = e.target.closest && e.target.closest(".ui-tooltip-wrap"); if (w && !w.contains(e.relatedTarget)) w.classList.remove("is-dismissed"); }
  document.addEventListener("mouseout", rearm);
  document.addEventListener("focusout", rearm);

  function dismissTag(btn) {
    var tag = btn.closest(".ui-tag");
    if (!tag) return;
    var list = tag.parentElement, all = Array.prototype.slice.call(list.querySelectorAll("[data-ui-dismiss]")), i = all.indexOf(btn);
    var next = all[i + 1] || all[i - 1] || null;
    tag.dispatchEvent(new CustomEvent("ui-dismiss", { bubbles: true }));
    tag.remove();
    if (next) next.focus();
    else { if (!list.hasAttribute("tabindex")) list.setAttribute("tabindex", "-1"); list.focus(); }
  }

  document.addEventListener("click", function (e) {
    var dismiss = e.target.closest && e.target.closest("[data-ui-dismiss]");
    if (dismiss) { dismissTag(dismiss); return; }
    var open = e.target.closest && e.target.closest("[data-ui-open]");
    if (open) { var d = document.getElementById(open.getAttribute("data-ui-open")); if (d) { wireDialog(d); openDialog(d, open); } return; }
    var close = e.target.closest && e.target.closest("[data-ui-close]");
    if (close) closeDialog(close.closest("dialog"));
  });

  window.UI = { init: init, tabs: tabs, chart: chart, openDialog: openDialog, closeDialog: closeDialog };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { init(); });
  else init();
})();
