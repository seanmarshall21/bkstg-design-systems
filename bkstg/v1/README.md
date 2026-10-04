# BKSTG

A design system exported from design-system-kit. Base: Untitled UI. Themes: backstage + backstage-light (mode light).

## Use it in a website or WordPress theme

```html
<link rel="stylesheet" href="bkstg.css">
<script src="bkstg.js" defer></script>     <!-- the interactive pieces: tabs, dialogs, menus … -->
<script src="motion.js" defer></script>  <!-- animations: data-reveal and counters; optional -->
<script type="module" src="charts.js"></script>  <!-- charts from attributes: <figure data-ui-viz="bar" ...>; optional -->
```

Then use the `ui-` classes: see `system.json` and the workbench for examples.

## Use it in a React app

Copy this folder into the app, import the stylesheet once at the root, and import components from `react/`:

```js
import "./bkstg/bkstg.css";
import { Button, Badge, Alert, Field, Input } from "./bkstg/react"; // import what you use; react/index.js lists them all
```

## Light and dark

It starts light. Set `data-mode="light"` or `data-mode="dark"` on `<html>` to force one.

## What was changed from the base

- `--progress-dur`: 400ms
- `--progress-fill`: var(--fill)
- `--progress-track`: var(--on-fill)

## Accessibility (contrast)

Checked 2026-10-04 against WCAG 2.1, which the ADA rule for state and local governments adopts at Level AA:

- Dark (backstage): meets AA on all 96 contrast checks; AAA on 48 of 57 text checks.
- Light (backstage-light, custom colors): meets AA on all 96 contrast checks; AAA on 50 of 57 text checks.

Contrast is one part of WCAG. Keyboard use, focus order, text alternatives, captions, labels and the content itself are checked on the finished site.

## Changing it

Edit the system in the workbench (the Design Systems page in the BKSTG Hub, or `node workbench.mjs` in design-system-kit), save, and export again. This folder is generated; edits made here are lost on the next export.
