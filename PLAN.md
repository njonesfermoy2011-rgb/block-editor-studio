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
| **R1** | Global chrome reset — token layer, calm accent, sidebar recedes, soft separators | Pure CSS | Low | P1·P4·P8·P10 | **✅ verified live (WP 7.0)** |
| R1b | Accent picker (teal/sage/slate) — in-editor `PluginSidebar`, localStorage | SlotFill + CSS | Low | — | **✅ verified live (WP 7.0)** |
| R2 | Persistent "Add block" appender at end of content (see note) | CSS canvas + modest JS | Med | P7 | **✅ verified live (WP 7.0)** |
| R3 | List View refresh — hover feedback + row spacing (selected row already adopts accent via R1) | Pure CSS | Low | P4 | **✅ verified live (WP 7.0)** |
| R4 | ~~Inspector progressive disclosure~~ | — | — | P8 | **❌ dropped — core already does this (ToolsPanel; Advanced collapsed) on 6.5+** |
| R5 | Focus visibility — keep plugin controls robust incl. forced-colors (no re-skin of core focus) | Pure CSS | Low | P9·P10 | **code complete + previewed; live-deploy pending** |
| R6 | Calmer inserter — rounded, accent-soft hover on block-grid items (inserter is a docked panel now, not a modal) | Pure CSS | Low | P6 | **code complete + previewed; live-deploy pending** |
| R7 | ~~Canvas typography polish~~ | — | — | — | **❌ dropped — breaks WYSIWYG (canvas must match theme front-end)** |
| R8 | Arrow-key navigation hint — one-time info notice, "Got it" persists (localStorage) | core/notices + JS | Low | P1 | **code complete + previewed; live-deploy pending** |
| R9 | Header declutter — secondary utility icons recede until hover/focus | Pure CSS | Low | — | **code complete + previewed; live-deploy pending** |

> **v0.4.0 deploy blocked (2026-06-29):** committed + pushed + previewed (injected the exact CSS/notice into the live v0.3.0 editor — all four render/behave correctly). But the live deploy is stuck: Git Updater can't reach GitHub (`cURL error 35` persistent this round, multiple refreshes), and the browser file-upload tool rejects Claude-generated ZIPs (only user-shared files allowed). **To land v0.4.0:** either retry Git Updater when host↔GitHub connectivity recovers (it's been intermittent — worked for 0.2.0/0.3.0 on retry), OR manually upload `dist/block-editor-studio.zip` via Plugins → Add New → Upload → "Replace current with uploaded". Then do the live confirmation pass on the real plugin.
| R10 | Block toolbar polish — accent-underline active state | Pure CSS | Low | — | **thin** — core already floats/rounds the contextual toolbar |
| R11 | ~~Focus mode toggle~~ | — | — | — | **❌ dropped — core ships Distraction Free (since 6.2)** |

### WP 7.0 re-audit (decided after R3/R4 came up partly redundant)
The deep-research pain points were drawn from 2022–2024 community complaints; WordPress 6.5→7.0 has since addressed several: ToolsPanel inspector (P8), Distraction Free mode, 6.8 accessibility fixes (P9/P10 contrast+focus), List View keyboard shortcuts (P5). Verified live on WP 7.0. **Revised value proposition:** a cohesive calm *aesthetic* skin (accent + chrome calm) + two genuine newcomer aids (persistent Add block, arrow-key hint) + accent personality — not "fixes broken Gutenberg." The wp.org listing must reflect this honestly. **Recommended lean v1 finish:** R8 (strong), then R6 + R9 (light aesthetic polish); R5/R10 optional/thin; R4/R7/R11 dropped.

### R2 note — scope change (decided during build)
Live DOM inspection showed the between-blocks "+" inserter is **mounted on hover, not in the DOM at rest** — so pure CSS cannot make it persistent. Decision: ship a persistent "Add block" button mounted after the content root via modest, defensive JS (click → `insertBlock` through the data store; button is a sibling of React's root so re-renders don't wipe it; self-heals if the iframe is recreated). Accepted tradeoff: small ongoing maintenance risk against editor updates. This also introduced canvas-CSS injection (`enqueue_block_assets` + `is_admin()`) and accent-sync into the iframe — groundwork R7 reuses.

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

Every CSS step is verified in a live editor before the next begins — visual CSS cannot be verified by reading it.

**Environment:** remote dev site `https://my-test-site.website/` (WordPress 7.0), driven via Claude-in-Chrome in the user's logged-in session.

**Deploy / update loop:** the plugin is installed via Git Updater from `njonesfermoy2011-rgb/block-editor-studio` tracking the `main` branch (`GitHub Plugin URI` + `Primary Branch` headers). To push a step to the dev site: commit + push to `main`, **bump the version** in the header + `readme.txt` (so Git Updater detects the update), then **Settings → Git Updater → Refresh Cache**, then run the update from Dashboard → Updates. Verification per step: open the editor, screenshot, check the browser console for errors/warnings (zero tolerance — a wp.org review criterion).

> **Deploy friction (observed):** the dev host intermittently throws `cURL error 35: Recv failure: Connection reset by peer` reaching GitHub, so Git Updater sometimes doesn't see the new version on the first Refresh Cache. Refresh Cache a second time (and/or "Check again" on the Updates page) — it picked up on the retry both times. Fallback if it persists: direct ZIP upload via Plugins → Add New → Upload (no GitHub dependency).

**Pre-submission cleanup:** remove the `GitHub Plugin URI` and `Primary Branch` dev headers before the wp.org build (Git Updater must not shadow wp.org updates).

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
