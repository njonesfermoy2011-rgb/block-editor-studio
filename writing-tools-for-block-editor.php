<?php
/**
 * Plugin Name:       Writing Tools for the Block Editor
 * Plugin URI:        https://github.com/njonesfermoy2011-rgb/block-editor-studio
 * Description:       A calmer, cleaner experience for the WordPress block editor. Lightweight UI/UX enhancements that make Gutenberg beautiful and intuitive — without replacing it, forking it, or becoming a page builder.
 * Version:           1.0.0
 * Requires at least: 6.5
 * Requires PHP:      7.4
 * Author:            Nathanael Jones
 * Author URI:        https://strategy11.com
 * License:           GPLv2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       writing-tools-for-block-editor
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'BESTUDIO_VERSION', '1.0.0' );
define( 'BESTUDIO_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'BESTUDIO_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

/**
 * Editor CHROME assets — header, sidebar, toolbar, inserter, list view.
 * Loads in the editor only; never on the front end.
 */
add_action( 'enqueue_block_editor_assets', 'bestudio_enqueue_editor_assets' );

function bestudio_enqueue_editor_assets() {
	wp_enqueue_style(
		'writing-tools-for-block-editor',
		BESTUDIO_PLUGIN_URL . 'assets/css/editor.css',
		array(),
		BESTUDIO_VERSION
	);

	wp_enqueue_script(
		'writing-tools-for-block-editor',
		BESTUDIO_PLUGIN_URL . 'assets/js/editor.js',
		array( 'wp-plugins', 'wp-editor', 'wp-edit-post', 'wp-element', 'wp-i18n', 'wp-data', 'wp-blocks', 'wp-notices', 'wp-rich-text', 'wp-block-editor', 'wp-wordcount', 'wp-components', 'wp-keyboard-shortcuts', 'heartbeat' ),
		BESTUDIO_VERSION,
		true
	);

	wp_set_script_translations( 'writing-tools-for-block-editor', 'writing-tools-for-block-editor' );
}

/**
 * Editor CANVAS assets — styles injected into the content iframe.
 * enqueue_block_assets reaches inside the iframe (WP 6.3+) and also fires
 * on the front end, so the is_admin() guard keeps this editor-only.
 */
add_action( 'enqueue_block_assets', 'bestudio_enqueue_canvas_assets' );

function bestudio_enqueue_canvas_assets() {
	if ( ! is_admin() ) {
		return;
	}

	wp_enqueue_style(
		'writing-tools-for-block-editor-canvas',
		BESTUDIO_PLUGIN_URL . 'assets/css/canvas.css',
		array(),
		BESTUDIO_VERSION
	);
}

/**
 * Add the default accent class to the block editor screen's body so the
 * skin's accent is applied before our script runs (no flash of the stock
 * WordPress accent). The in-editor picker swaps this class client-side.
 *
 * @param string $classes Space-separated admin body classes.
 * @return string
 */
add_filter( 'admin_body_class', 'bestudio_admin_body_class' );

function bestudio_admin_body_class( $classes ) {
	if ( ! function_exists( 'get_current_screen' ) ) {
		return $classes;
	}

	$screen = get_current_screen();
	if ( $screen && method_exists( $screen, 'is_block_editor' ) && $screen->is_block_editor() ) {
		$classes .= ' writing-tools-for-block-editor bes-accent-teal';
	}

	return $classes;
}
