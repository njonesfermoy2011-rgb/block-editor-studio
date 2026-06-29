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

	/* ============================================================
	 * R2 · Persistent "Add block" appender + canvas accent sync
	 *
	 * The content canvas is an iframe. This script runs in the top
	 * (chrome) document and reaches into the iframe to:
	 *   1. mirror the chosen accent class onto the iframe body so
	 *      canvas.css resolves --bes-accent in sync with the picker;
	 *   2. mount one persistent "Add block" button AFTER the content
	 *      root (a sibling, so React re-renders don't remove it).
	 *
	 * The button's click goes through the data store (insertBlock) —
	 * we never edit the content DOM ourselves. A debounced observer
	 * re-applies both if the iframe is recreated (e.g. device preview).
	 * ============================================================ */
	function getCanvasDoc() {
		var frame = document.querySelector( 'iframe[name="editor-canvas"]' );
		if ( ! frame ) {
			return null;
		}
		var doc = frame.contentDocument;
		if ( ! doc || ! doc.body || ! doc.body.classList.contains( 'editor-styles-wrapper' ) ) {
			return null;
		}
		return doc;
	}

	function syncCanvasAccent( doc, key ) {
		for ( var i = 0; i < ACCENTS.length; i++ ) {
			doc.body.classList.remove( 'bes-accent-' + ACCENTS[ i ].key );
		}
		doc.body.classList.add( 'bes-accent-' + key );
	}

	function insertParagraphAtEnd() {
		try {
			var store = wp.data && wp.data.dispatch( 'core/block-editor' );
			var createBlock = wp.blocks && wp.blocks.createBlock;
			if ( store && createBlock && store.insertBlock ) {
				// insertBlock( block, index, rootClientId, updateSelection )
				store.insertBlock( createBlock( 'core/paragraph' ), undefined, undefined, true );
			}
		} catch ( e ) {}
	}

	function mountAppender( doc ) {
		if ( doc.getElementById( 'bes-add-block' ) ) {
			return;
		}
		var root = doc.querySelector( '.is-root-container' );
		if ( ! root ) {
			return;
		}

		var wrap = doc.createElement( 'div' );
		wrap.className = 'bes-persistent-appender';
		wrap.setAttribute( 'contenteditable', 'false' );

		var btn = doc.createElement( 'button' );
		btn.type = 'button';
		btn.id = 'bes-add-block';
		btn.className = 'bes-add-block';
		btn.setAttribute( 'aria-label', __( 'Add block', 'block-editor-studio' ) );

		// Static, safe markup for the plus icon (no user input).
		btn.innerHTML =
			'<svg class="bes-add-block__icon" viewBox="0 0 18 18" aria-hidden="true" focusable="false">' +
			'<line x1="9" y1="3.5" x2="9" y2="14.5"></line>' +
			'<line x1="3.5" y1="9" x2="14.5" y2="9"></line></svg>';

		var label = doc.createElement( 'span' );
		label.className = 'bes-add-block__label';
		label.textContent = __( 'Add block', 'block-editor-studio' );
		btn.appendChild( label );

		btn.addEventListener( 'click', insertParagraphAtEnd );

		wrap.appendChild( btn );
		root.insertAdjacentElement( 'afterend', wrap );
	}

	function refreshCanvas() {
		var doc = getCanvasDoc();
		if ( ! doc ) {
			return;
		}
		syncCanvasAccent( doc, readAccent() );
		mountAppender( doc );
	}

	// Debounced to one run per frame — the editor mutates the DOM constantly.
	var scheduled = false;
	function scheduleRefresh() {
		if ( scheduled ) {
			return;
		}
		scheduled = true;
		window.requestAnimationFrame( function () {
			scheduled = false;
			refreshCanvas();
		} );
	}

	// Re-apply accent to the canvas whenever the picker changes it.
	var baseApplyAccent = applyAccent;
	applyAccent = function ( key ) {
		baseApplyAccent( key );
		var doc = getCanvasDoc();
		if ( doc ) {
			syncCanvasAccent( doc, key );
		}
	};

	// Initial attempts (the iframe loads asynchronously) + a self-healing
	// observer that re-mounts if the iframe is torn down and recreated.
	[ 0, 500, 1500, 3000 ].forEach( function ( delay ) {
		window.setTimeout( refreshCanvas, delay );
	} );
	if ( window.MutationObserver && document.body ) {
		new window.MutationObserver( scheduleRefresh ).observe( document.body, {
			childList: true,
			subtree: true
		} );
	}

	/* ============================================================
	 * R8 · Arrow-key navigation hint
	 *
	 * Block-to-block arrow-key navigation is undiscoverable — it's
	 * absent from the keyboard-shortcuts modal and has no visible
	 * affordance (pain point P1, still unaddressed by core). Show a
	 * one-time info notice teaching it; "Got it" dismisses it for
	 * good (localStorage). Notices are announced to screen readers,
	 * so this also helps non-sighted users.
	 * ============================================================ */
	var HINT_KEY = 'blockEditorStudioArrowHintDismissed';
	var HINT_NOTICE_ID = 'block-editor-studio/arrow-key-hint';

	function maybeShowArrowKeyHint() {
		try {
			if ( window.localStorage.getItem( HINT_KEY ) === '1' ) {
				return;
			}
		} catch ( e ) {}

		var notices = wp.data && wp.data.dispatch( 'core/notices' );
		if ( ! notices || ! notices.createInfoNotice ) {
			return;
		}

		notices.createInfoNotice(
			__(
				'Tip: use the ↑ and ↓ arrow keys to move between blocks. Press Esc to select a block, then Tab to step through them.',
				'block-editor-studio'
			),
			{
				id: HINT_NOTICE_ID,
				isDismissible: false,
				actions: [
					{
						label: __( 'Got it', 'block-editor-studio' ),
						onClick: function () {
							try {
								window.localStorage.setItem( HINT_KEY, '1' );
							} catch ( e ) {}
							try {
								wp.data.dispatch( 'core/notices' ).removeNotice( HINT_NOTICE_ID );
							} catch ( e ) {}
						}
					}
				]
			}
		);
	}

	maybeShowArrowKeyHint();
} )( window.wp );
