/**
 * Block Editor Studio — Editor Script
 *
 * Loaded exclusively via enqueue_block_editor_assets.
 * No build step: plain JS via wp.element.createElement so the source
 * stays transparent for review. Nothing here affects the front end.
 *
 * Registers the Block Editor Studio sidebar, currently holding the
 * accent picker — a pre-release evaluation control. The chosen accent
 * is saved to this browser (localStorage); per-user server-side
 * persistence is intentionally deferred until the feature is confirmed.
 */
( function ( wp ) {
	'use strict';

	if ( ! wp || ! wp.plugins || ! wp.element ) {
		return;
	}

	var registerPlugin = wp.plugins.registerPlugin;
	var el = wp.element.createElement;
	var Fragment = wp.element.Fragment;
	var useState = wp.element.useState;
	var __ = ( wp.i18n && wp.i18n.__ ) || function ( s ) { return s; };

	// PluginSidebar moved from wp.editPost to wp.editor in WP 6.6+.
	// Prefer the newer home, fall back for 6.5.
	var editor = wp.editor || {};
	var editPost = wp.editPost || {};
	var PluginSidebar = editor.PluginSidebar || editPost.PluginSidebar;
	var PluginSidebarMoreMenuItem =
		editor.PluginSidebarMoreMenuItem || editPost.PluginSidebarMoreMenuItem;

	if ( ! PluginSidebar ) {
		return;
	}

	var ACCENTS = [
		{ key: 'teal', label: __( 'Calm Teal', 'block-editor-studio' ), hex: '#2d6e7e' },
		{ key: 'sage', label: __( 'Sage', 'block-editor-studio' ), hex: '#3d7a6a' },
		{ key: 'slate', label: __( 'Slate Blue', 'block-editor-studio' ), hex: '#3a5a8c' }
	];
	var STORAGE_KEY = 'blockEditorStudioAccent';
	var DEFAULT = 'teal';

	function isValid( key ) {
		for ( var i = 0; i < ACCENTS.length; i++ ) {
			if ( ACCENTS[ i ].key === key ) {
				return true;
			}
		}
		return false;
	}

	function readAccent() {
		try {
			var stored = window.localStorage.getItem( STORAGE_KEY );
			return isValid( stored ) ? stored : DEFAULT;
		} catch ( e ) {
			return DEFAULT;
		}
	}

	function applyAccent( key ) {
		var body = document.body;
		for ( var i = 0; i < ACCENTS.length; i++ ) {
			body.classList.remove( 'bes-accent-' + ACCENTS[ i ].key );
		}
		body.classList.add( 'bes-accent-' + key );
	}

	// Apply the saved choice on load — corrects the server-rendered default.
	applyAccent( readAccent() );

	function AccentPicker() {
		var state = useState( readAccent() );
		var active = state[ 0 ];
		var setActive = state[ 1 ];

		function choose( key ) {
			setActive( key );
			applyAccent( key );
			try {
				window.localStorage.setItem( STORAGE_KEY, key );
			} catch ( e ) {}
		}

		return el(
			'div',
			{ className: 'bes-accent-picker' },
			el(
				'p',
				{ className: 'bes-accent-picker__hint' },
				__( 'Choose the editor accent colour. Saved to this browser.', 'block-editor-studio' )
			),
			el(
				'div',
				{ className: 'bes-accent-picker__swatches' },
				ACCENTS.map( function ( accent ) {
					return el(
						'button',
						{
							key: accent.key,
							type: 'button',
							className:
								'bes-accent-swatch' + ( active === accent.key ? ' is-active' : '' ),
							'aria-pressed': active === accent.key,
							onClick: function () {
								choose( accent.key );
							}
						},
						el( 'span', {
							className: 'bes-accent-swatch__chip',
							style: { backgroundColor: accent.hex },
							'aria-hidden': 'true'
						} ),
						el( 'span', { className: 'bes-accent-swatch__label' }, accent.label )
					);
				} )
			)
		);
	}

	var icon = el(
		'svg',
		{ width: 24, height: 24, viewBox: '0 0 24 24', 'aria-hidden': 'true', focusable: 'false' },
		el( 'circle', { cx: 9, cy: 12, r: 3.2, fill: 'currentColor' } ),
		el( 'circle', { cx: 16, cy: 8.5, r: 3.2, fill: 'currentColor', opacity: 0.6 } ),
		el( 'circle', { cx: 16, cy: 15.5, r: 3.2, fill: 'currentColor', opacity: 0.3 } )
	);

	registerPlugin( 'block-editor-studio', {
		icon: icon,
		render: function () {
			return el(
				Fragment,
				null,
				PluginSidebarMoreMenuItem
					? el(
							PluginSidebarMoreMenuItem,
							{ target: 'block-editor-studio', icon: icon },
							__( 'Block Editor Studio', 'block-editor-studio' )
					  )
					: null,
				el(
					PluginSidebar,
					{
						name: 'block-editor-studio',
						title: __( 'Block Editor Studio', 'block-editor-studio' ),
						icon: icon
					},
					el( 'div', { className: 'bes-sidebar' }, el( AccentPicker ) )
				)
			);
		}
	} );
} )( window.wp );
