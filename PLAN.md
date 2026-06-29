# Block Editor Studio — Implementation Plan

> A calmer, cleaner experience for the WordPress block editor.
> Thin CSS + minimal JS overlay. No fork. No page builder. Zero front-end impact.

**Research foundation:** [Deep-research report](https://claude.ai/code/artifact/eb334f18-3c4e-438a-8dff-2fb905be6848) — 18 adversarially-verified claims, 29 sources.

---

## Constraints (non-negotiable)

1. **Editor-only.** All assets load via `enqueue_block_editor_assets`. Nothing touches the front end. WordPress.org reviewers check this.
2. **No forking, no DOM surgery.** Prefer pure CSS. Use stable selectors only. SlotFills for any injected UI. No monkey-patching React internals.
3. **Stable selectors only.** `.block-editor-*`, `.editor-*`, `.interface-*`, `.components-*`, `.edit-post-*` (legacy). Never target auto-generated hash classes.
4. **Defensive prefixing.** WP 6.5 unified the editor; `.edit-post-*` is migrating to `.editor-*`. Target both during the transition.
5. **Accessibility is a feature, not a risk.** Every change must preserve or improve contrast and focus visibility. Never regress a11y.
6. **Minimum WordPress 6.5, PHP 7.4.**

---

## Architecture

### Token layer
All visual decisions reference `--bes-*` custom properties defined once at the top of `editor.css`. Change the palette in one place.

**Exception — the accent.** WordPress' `--wp-admin-theme-color` / `--wp-components-color-accent` are parsed by JS to compute shade variants, so they reject `var()` and require literal hex. We hardcode the accent hex into those WP variables and keep `--bes-accent` in sync (commented). This is the one place a value is duplicated, by necessity.

### Chrome vs. canvas
- **Chrome** (header, sidebar, toolbar, inserter, List View) lives *outside* the iframe → styled by `assets/css/editor.css` via `enqueue_block_editor_assets`.
- **Canvas** (the post content area) is an *iframe* (WP 6.3+) → styled separately via `add_editor_style()`. Only R7 touches this.

### Accent palette (proposed — single-token, easy to change)
- `--bes-accent: #2d6e7e` — a calm, desaturated teal-blue. Distinct enough from WP's default violet-blue to signal the skin is active; neutral enough not to imply success/error.
- Cool-biased neutral scale (not pure grey) for chrome grounds and text.
- Soft, low-opacity separators in place of hard 1px lines (research Principle 2: "structure felt, not seen").

---

## Build steps

Pure-CSS items first (safe, zero perf cost), then minimal-JS items. Each step = one commit, verified in a live editor before moving on.

| # | Step | Method | Risk | Pain pts | Status |
|---|------|--------|------|----------|--------|
| **R1** | Global chrome reset — token layer, calm accent, sidebar recedes, soft separators | Pure CSS | Low | P1·P4·P8·P10 | **▶ built — awaiting live verification** |
| R1b | Accent picker (teal/sage/slate) — in-editor `PluginSidebar`, localStorage | SlotFill + CSS | Low | — | **▶ built — awaiting live verification** |
| R2 | Block inserter "+" visible at rest | Pure CSS | Med | P7 | todo |
| R3 | List View refresh — spacing, hover, nesting, selected state | Pure CSS | Low | P4 | todo |
| R4 | Inspector progressive disclosure — Advanced/Dimensions/Border collapsed by default | CSS + small JS | Med | P8 | todo |
| R5 | Focus ring upgrade — WCAG 2.2 AA, branded, consistent | Pure CSS | Low | P9·P10 | todo |
| R6 | Soften the block inserter modal — radius, shadow, calmer tabs | Pure CSS | Low | P6 | todo |
| R7 | Canvas typography polish — line-height, max-width, rhythm (`add_editor_style`) | CSS (canvas) | Low | — | todo |
| R8 | Arrow-key onboarding hint — one-time dismissable notice | SlotFill + localStorage | Low | P1 | todo |
| R9 | Header bar declutter — reduce icon visual weight, soft group separators | Pure CSS | Low | — | todo |
| R10 | Block toolbar polish — float, radius, accent-underline active state | Pure CSS | Low | — | todo |
| R11 | Optional "Focus mode" toggle — hides chrome, centers content | SlotFill + CSS | Low | — | stretch |

### Out of scope for v1
- Tab-key → sidebar behavior (requires forking core keyboard handler)
- Full inserter layout/search overhaul (DOM-fragile)
- Patterns/Templates/Blocks terminology confusion (needs an education layer — defer to v2)
- Any front-end styles

---

## Closing stages (after the build)

### A. In-depth code review
- `/security-review` and `/code-review` on the full diff.
- Independent read for: escaping/sanitization of any PHP output, `enqueue_block_editor_assets`-only loading (no front-end bleed), no `eval`/remote calls, text-domain consistency, i18n of all user-facing JS strings (`wp.i18n`).
- WordPress.org Plugin Check (`plugin-check` plugin) run locally — the same automated checks the review team runs.

### B. QA testing
- Live editor verification on a real WordPress 6.5+ and latest (7.0) install.
- Matrix: post editor + Site Editor; light + dark admin schemes; a block-heavy page; keyboard-only pass; screen-reader smoke test (focus order, the R8 notice).
- Confirm zero front-end output (view-source a published page; confirm our handles are absent).
- Confirm no JS console errors/warnings in the editor.

### C. WordPress.org listing + SEO
- Finalize `readme.txt`: name, short description (150 chars, keyword-led), tags, full description.
- SEO: lead with high-volume terms ("block editor", "Gutenberg", "editor UI") naturally; benefit-led first paragraph for conversion; screenshots with descriptive captions; an FAQ that captures long-tail queries.
- Banner (1544×500) + icon (256×256) + screenshots — assets the directory displays.

### D. Submission walkthrough (step by step)
- Pre-flight: Plugin Check clean, GPL-compatible license, stable tag matches, no external/obfuscated code.
- Create a WordPress.org account; submit the ZIP at wordpress.org/plugins/developers/add/.
- Respond to the review email; iterate on any flags.
- On approval: SVN setup, `trunk` + `tags/` + `assets/` layout, first tagged release.
- Post-launch: monitor support forum, reviews, and compatibility with new WP releases.

---

## Verification approach

Every CSS step is verified in a live editor before the next begins — visual CSS cannot be verified by reading it. We will either drive a test site with Claude-in-Chrome, or the user spot-checks each commit. **Decision pending: which test environment.**

## Pipeline note

This is a standalone WordPress.org plugin, **not** a Formidable Labs add-on. The Formidable `frm-*` pipeline (FrmAppHelper, MVC house style, WP_Mock harness) does not apply. We follow the WordPress.org-appropriate pipeline defined above: plan → build (verify each step) → review → QA → listing → submit.

---

## Resolved decisions

1. **Accent hue** — *not* locked to one. Ship an in-editor **accent picker** (teal / sage / slate) for the pre-release so the winner is chosen on real pixels. Persistence is `localStorage` (per-browser) for now — deliberately minimal. **Deferred:** if we decide to expose this to end users as a feature, upgrade to per-user persistence (user meta + REST). Until then, no server-side plumbing.
2. **Test environment** — drive a dev site via Claude-in-Chrome. A local Windows browser is connected. Verify each step live before the next.

## Open decisions

1. **Dev-site deployment** — how does the plugin get onto the test site for iterative CSS work? (Local install on this machine → symlink/copy the folder for instant refresh / remote → zip upload or Git Updater.)
2. **Author/contributor slug** — `readme.txt` lists `nathanaeljones`. Confirm the WordPress.org username to use as Contributor.
3. **Does the accent picker ship to end users?** — decide after evaluation. Affects persistence work and the public readme copy.
