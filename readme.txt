=== Block Editor Studio ===
Contributors: njones35
Tags: gutenberg, block editor, find and replace, editor, writing
Requires at least: 6.5
Tested up to: 7.0
Stable tag: 0.8.2
Requires PHP: 7.4
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

A calmer, cleaner WordPress block editor — with Find & Replace, undo-on-delete, and clear formatting. Lightweight, no front-end impact.

== Description ==

Block Editor Studio makes the WordPress block editor (Gutenberg) calmer, cleaner, and genuinely easier to use — and adds the everyday tools writers and editors keep wishing it had.

Gutenberg is powerful, but its interface can feel busy and unforgiving. Block Editor Studio is a lightweight skin and toolkit that smooths the rough edges — without replacing the editor, forking it, or turning it into a page builder.

= Editing tools you'll use every day =

* **Find & Replace** across the whole post, with a live match count and optional case-sensitivity. Links, markup, and code blocks are never touched.
* **Undo on delete** — remove a block and a one-click "Undo" appears, so accidental deletions are easy to recover.
* **Clear Formatting** — strip messy inline formatting from any selection in one click.
* **Live word count** for the selected block, not just the whole post.

= A calmer canvas =

* A quieter, more focused editor — softer chrome, a restrained accent colour (choose teal, sage, or slate), and a tidier List View.
* An always-visible "Add block" button, so adding content never depends on hovering to find a hidden control.
* A friendly one-time tip that teaches keyboard navigation between blocks.
* An optional toggle to reduce autosave frequency on slower sites.

= Lightweight and safe by design =

* Loads **only inside the editor** — zero scripts, styles, or slowdown on your live site.
* Purely visual and additive: it never changes your block markup or saved content.
* Works alongside your theme and other block plugins.

No settings page to wrestle with, and no bloat. Just a better editing experience.

== Installation ==

1. In your WordPress admin, go to Plugins → Add New Plugin and search for "Block Editor Studio", or upload the plugin ZIP via Plugins → Add New Plugin → Upload Plugin.
2. Activate the plugin through the Plugins screen.
3. Open any post or page in the block editor — the improvements are applied automatically. Open the Block Editor Studio panel from the editor's top-right toolbar for Find & Replace, word count, the accent picker, and performance options.

No configuration required.

== Frequently Asked Questions ==

= Does the WordPress block editor have find and replace? =

Not on its own. Block Editor Studio adds a Find & Replace panel to the editor sidebar — search your whole post, see a live match count, and replace across every block at once. Links, markup, and code blocks are left untouched.

= Does this slow down my website? =

No. Block Editor Studio loads only inside the WordPress admin block editor. It adds nothing to your live site's pages and has zero impact on front-end performance.

= Will it change or break my existing content? =

No. It is purely visual and additive — it never modifies your block markup or saved content. Find & Replace only changes the text you ask it to.

= How do I clear formatting in the block editor? =

Select the text and click the Clear Formatting button in the block toolbar. It strips inline formatting — bold, italic, links and more — in one click.

= Does it work with Full Site Editing / the Site Editor? =

Yes. The core editor improvements apply in both the post editor and the Site Editor. Some tools are specific to the post editor.

= Is it compatible with other block plugins? =

Yes. Because it works at the CSS/UI layer rather than replacing or forking Gutenberg, it is compatible with third-party block libraries.

== Screenshots ==

1. A calmer, cleaner block editor with your chosen accent colour.
2. Find & Replace — search and replace across every block, with a live match count.
3. Undo on delete — accidental block deletions are one click away from recovery.
4. The Block Editor Studio panel: accent picker, word count, Find & Replace, and performance options.
5. An always-visible "Add block" button and a tidier List View.

== Changelog ==

= 0.8.2 =
* Housekeeping: renamed the plugin's internal PHP constants and functions to a longer, more distinct prefix, following WordPress.org naming guidelines. No functional changes.

= 0.8.1 =
* Fixed: a script dependency typo prevented the editor enhancements from loading. All features now load correctly.

= 0.8.0 =
* New: a "Reduce autosave frequency" toggle that slows background saving and checks, easing typing hitches on slower sites.

= 0.7.0 =
* New: Find & Replace. Search the post's text and replace across all blocks from the Block Editor Studio panel, with a live match count and an optional case-sensitive match. Links, markup and code blocks are left untouched.

= 0.6.0 =
* New: removing a block now shows a brief "block removed — Undo" message, so accidental deletions are easy to recover. It stays quiet when you simply press Ctrl/Cmd+Z.

= 0.5.0 =
* New: a one-click Clear Formatting button in the text toolbar to strip inline formatting from a selection.
* New: a live word and character count for the selected block in the Block Editor Studio panel.

= 0.4.0 =
* New: a one-time tip teaches arrow-key navigation between blocks (dismissable).
* Calmer block inserter — rounded, responsive hover on blocks.
* Header utility icons recede until hovered, keeping focus on your content.
* Improved focus visibility for the plugin's own controls, including high-contrast mode.

= 0.3.0 =
* List View: clearer hover feedback and more comfortable row spacing for easier scanning.

= 0.2.0 =
* Added a persistent "Add block" button at the end of the content, so adding a block no longer depends on discovering the hover-only inserter.
* The editor canvas now follows the chosen accent colour.

= 0.1.0 =
* Initial release.

== Upgrade Notice ==

= 0.8.2 =
Internal housekeeping only — no functional changes.

= 0.8.1 =
Fixes a loading issue so all editor enhancements work. Recommended for everyone.
