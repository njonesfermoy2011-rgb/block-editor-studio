<?php
/**
 * Plugin Name:       Block Editor Studio
 * Plugin URI:        https://github.com/nathanaeljones/block-editor-studio
 * Description:       A calmer, cleaner experience for the WordPress block editor. Lightweight UI/UX enhancements that make Gutenberg beautiful and intuitive — without replacing it, forking it, or becoming a page builder.
 * Version:           0.1.0
 * Requires at least: 6.5
 * Requires PHP:      7.4
 * Author:            Nathanael Jones
 * Author URI:        https://strategy11.com
 * License:           GPL v2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       block-editor-studio
 * Domain Path:       /languages
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'BES_VERSION', '0.1.0' );
define( 'BES_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'BES_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

add_action( 'enqueue_block_editor_assets', 'bes_enqueue_editor_assets' );

function bes_enqueue_editor_assets() {
	wp_enqueue_style(
		'block-editor-studio',
		BES_PLUGIN_URL . 'assets/css/editor.css',
		array(),
		BES_VERSION
	);

	wp_enqueue_script(
		'block-editor-studio',
		BES_PLUGIN_URL . 'assets/js/editor.js',
		array( 'wp-plugins', 'wp-edit-post', 'wp-element', 'wp-components', 'wp-data' ),
		BES_VERSION,
		true
	);
}
