=== Block Editor Studio ===
Contributors: nathanaeljones
Tags: block editor, gutenberg, editor, ui, ux, writing
Requires at least: 6.5
Tested up to: 7.0
Stable tag: 0.3.0
Requires PHP: 7.4
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

A calmer, cleaner experience for the WordPress block editor.

== Description ==

Block Editor Studio gives the Gutenberg block editor a beautiful, calm, and intuitive UI/UX — without replacing it, forking it, or becoming a page builder.

The block editor is powerful. But for many users — especially newcomers — it's overwhelming. Competing toolbars, an invisible block inserter, a sidebar full of unexplained controls, and a navigation model that requires knowledge most users never discover.

Block Editor Studio is a lightweight skin that addresses these problems directly:

* **Calmer chrome** — The editor toolbar, sidebar, and header recede, letting your content take centre stage
* **Visible block inserter** — The add-block affordance is always visible, not hidden behind a hover
* **Smarter inspector** — Advanced settings are collapsed by default so the controls you need are easy to find
* **Polished focus indicators** — Accessible, consistent, and branded focus rings across the entire editor
* **List View refresh** — Better spacing, hover states, and visual hierarchy
* **Navigation hint** — A one-time, dismissable tip that teaches new users how block navigation actually works

Everything loads only inside the editor. Zero impact on your site's front-end performance.

== Installation ==

1. Upload the plugin files to `/wp-content/plugins/block-editor-studio`, or install directly from the WordPress plugin directory.
2. Activate the plugin through the Plugins screen in WordPress.
3. Open any post or page in the block editor — improvements are applied automatically.

No settings page. No configuration required.

== Frequently Asked Questions ==

= Does this affect how my site looks to visitors? =

No. Block Editor Studio loads only inside the WordPress admin block editor. It has zero impact on your site's front-end output or page speed.

= Does it work with Full Site Editing / the Site Editor? =

The core editor improvements apply in both the post editor and the Site Editor. Some features are specific to the post editor.

= Will it break my existing blocks or content? =

No. Block Editor Studio is purely visual — it does not modify block markup, block output, or saved content.

= Is it compatible with other block plugins? =

Yes. Because it works at the CSS/UI layer rather than replacing or forking Gutenberg, it is compatible with third-party block libraries.

== Changelog ==

= 0.3.0 =
* List View: clearer hover feedback and more comfortable row spacing for easier scanning.

= 0.2.0 =
* Added a persistent "Add block" button at the end of the content, so adding a block no longer depends on discovering the hover-only inserter.
* The editor canvas now follows the chosen accent colour.

= 0.1.0 =
* Initial release.
