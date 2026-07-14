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
	var _n = ( wp.i18n && wp.i18n._n ) || function ( s, p, n ) { return n === 1 ? s : p; };
	var sprintf = ( wp.i18n && wp.i18n.sprintf ) || function ( f ) { return f; };
	var useSelect = wp.data && wp.data.useSelect;
	var useEffect = wp.element.useEffect;
	var components = wp.components || {};
	var registerFormatType = wp.richText && wp.richText.registerFormatType;
	var RichTextToolbarButton = wp.blockEditor && wp.blockEditor.RichTextToolbarButton;
	var useShortcut = wp.keyboardShortcuts && wp.keyboardShortcuts.useShortcut;

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

	/* F2 · Selection / per-block word count
	 * Core only surfaces a whole-post total. This reads the currently
	 * selected block(s) live and shows their word + character count. */
	function WordCountPanel() {
		if ( ! useSelect || ! wp.wordcount || ! wp.blocks ) {
			return null;
		}
		var data = useSelect( function ( select ) {
			var be = select( 'core/block-editor' );
			var ids = be.getSelectedBlockClientIds();
			var html = ids
				.map( function ( id ) {
					var block = be.getBlock( id );
					return block ? wp.blocks.getBlockContent( block ) : '';
				} )
				.join( ' ' );
			return { count: ids.length, html: html };
		}, [] );

		var text = ( data.html || '' ).replace( /<[^>]*>/g, ' ' );
		var words = wp.wordcount.count( text, 'words' );
		var chars = wp.wordcount.count( text, 'characters_including_spaces' );

		var body;
		if ( data.count === 0 ) {
			body = __( 'Select a block to see its word count.', 'block-editor-studio' );
		} else {
			body =
				sprintf( _n( '%d word', '%d words', words, 'block-editor-studio' ), words ) +
				'  ·  ' +
				sprintf( _n( '%d character', '%d characters', chars, 'block-editor-studio' ), chars );
		}

		return el(
			'div',
			{ className: 'bes-wordcount' },
			el( 'h3', { className: 'bes-section-title' }, __( 'Word count', 'block-editor-studio' ) ),
			el( 'p', { className: 'bes-wordcount__value' }, body )
		);
	}

	/* F5 · Find & Replace
	 * Search the post's visible text and replace across blocks. Matching and
	 * replacing happen only inside text nodes (via DOMParser), so markup,
	 * links and URLs are never touched. Rich-text attributes are read as HTML
	 * (plain string OR a RichTextData object) and written back as an HTML
	 * string, which the store normalises. Code/HTML/preformatted/shortcode
	 * blocks are skipped so their raw content is never altered. */
	var BES_TEXT_ATTRS = [ 'content', 'value', 'caption', 'citation', 'text' ];
	var BES_SKIP_BLOCKS = {
		'core/code': 1,
		'core/html': 1,
		'core/preformatted': 1,
		'core/shortcode': 1,
		'core/freeform': 1
	};

	function besEscapeRegExp( s ) {
		return s.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );
	}

	function besGetHtml( v ) {
		if ( typeof v === 'string' ) {
			return v;
		}
		if ( v && typeof v.toHTMLString === 'function' ) {
			return v.toHTMLString();
		}
		return null;
	}

	function besProcessHtml( html, re, replacement, doReplace ) {
		var docp = new window.DOMParser().parseFromString(
			'<div id="bes-fr-root">' + html + '</div>',
			'text/html'
		);
		var root = docp.getElementById( 'bes-fr-root' );
		if ( ! root ) {
			return { html: html, count: 0 };
		}
		var walker = docp.createTreeWalker( root, window.NodeFilter.SHOW_TEXT, null );
		var nodes = [];
		while ( walker.nextNode() ) {
			nodes.push( walker.currentNode );
		}
		var count = 0;
		for ( var i = 0; i < nodes.length; i++ ) {
			var matched = nodes[ i ].nodeValue.match( re );
			if ( matched ) {
				count += matched.length;
				if ( doReplace ) {
					// Function replacer so the replacement is treated literally
					// (no $-backreference interpretation).
					nodes[ i ].nodeValue = nodes[ i ].nodeValue.replace( re, function () {
						return replacement;
					} );
				}
			}
		}
		return { html: root.innerHTML, count: count };
	}

	function besWalkBlocks( blocks, cb ) {
		for ( var i = 0; i < blocks.length; i++ ) {
			cb( blocks[ i ] );
			if ( blocks[ i ].innerBlocks && blocks[ i ].innerBlocks.length ) {
				besWalkBlocks( blocks[ i ].innerBlocks, cb );
			}
		}
	}

	function besFindReplace( search, replacement, matchCase, doReplace ) {
		if ( ! search ) {
			return 0;
		}
		var re = new RegExp( besEscapeRegExp( search ), matchCase ? 'g' : 'gi' );
		var be = wp.data.select( 'core/block-editor' );
		var dBE = wp.data.dispatch( 'core/block-editor' );
		var total = 0;
		besWalkBlocks( be.getBlocks(), function ( block ) {
			if ( BES_SKIP_BLOCKS[ block.name ] ) {
				return;
			}
			var attrs = block.attributes || {};
			var updates = {};
			for ( var a = 0; a < BES_TEXT_ATTRS.length; a++ ) {
				var key = BES_TEXT_ATTRS[ a ];
				var html = besGetHtml( attrs[ key ] );
				if ( html === null || html === '' ) {
					continue;
				}
				var res = besProcessHtml( html, re, replacement, doReplace );
				total += res.count;
				if ( doReplace && res.count > 0 ) {
					updates[ key ] = res.html;
				}
			}
			if ( doReplace && Object.keys( updates ).length ) {
				dBE.updateBlockAttributes( block.clientId, updates );
			}
		} );
		return total;
	}

	function FindReplacePanel() {
		if ( ! components.TextControl || ! components.Button || ! useState || ! useEffect ) {
			return null;
		}
		var s = useState( '' );
		var search = s[ 0 ];
		var setSearch = s[ 1 ];
		var r = useState( '' );
		var replacement = r[ 0 ];
		var setReplacement = r[ 1 ];
		var c = useState( false );
		var matchCase = c[ 0 ];
		var setMatchCase = c[ 1 ];
		var mi = useState( null );
		var matchInfo = mi[ 0 ];
		var setMatchInfo = mi[ 1 ];
		var stt = useState( '' );
		var status = stt[ 0 ];
		var setStatus = stt[ 1 ];

		// Live, debounced match count as the user types.
		useEffect(
			function () {
				if ( ! search ) {
					setMatchInfo( null );
					return undefined;
				}
				var timer = window.setTimeout( function () {
					try {
						setMatchInfo( besFindReplace( search, '', matchCase, false ) );
					} catch ( e ) {
						setMatchInfo( null );
					}
				}, 300 );
				return function () {
					window.clearTimeout( timer );
				};
			},
			[ search, matchCase ]
		);

		function doReplaceAll() {
			if ( ! search ) {
				return;
			}
			var n = 0;
			try {
				n = besFindReplace( search, replacement, matchCase, true );
			} catch ( e ) {}
			setStatus(
				n > 0
					? sprintf( _n( 'Replaced %d match.', 'Replaced %d matches.', n, 'block-editor-studio' ), n )
					: __( 'No matches found.', 'block-editor-studio' )
			);
			setMatchInfo( 0 );
		}

		var countLabel =
			matchInfo === null
				? ''
				: matchInfo === 0
				? __( 'No matches', 'block-editor-studio' )
				: sprintf( _n( '%d match', '%d matches', matchInfo, 'block-editor-studio' ), matchInfo );

		return el(
			'div',
			{ className: 'bes-findreplace' },
			el( 'h3', { className: 'bes-section-title' }, __( 'Find & Replace', 'block-editor-studio' ) ),
			el( components.TextControl, {
				label: __( 'Find', 'block-editor-studio' ),
				value: search,
				onChange: setSearch,
				__nextHasNoMarginBottom: true
			} ),
			el( components.TextControl, {
				label: __( 'Replace with', 'block-editor-studio' ),
				value: replacement,
				onChange: setReplacement,
				__nextHasNoMarginBottom: true
			} ),
			components.CheckboxControl
				? el( components.CheckboxControl, {
						label: __( 'Match case', 'block-editor-studio' ),
						checked: matchCase,
						onChange: setMatchCase,
						__nextHasNoMarginBottom: true
				  } )
				: null,
			countLabel ? el( 'p', { className: 'bes-findreplace__count' }, countLabel ) : null,
			el(
				components.Button,
				{
					variant: 'primary',
					onClick: doReplaceAll,
					disabled: ! search || matchInfo === 0,
					__next40pxDefaultSize: true
				},
				__( 'Replace all', 'block-editor-studio' )
			),
			status
				? el( 'p', { className: 'bes-findreplace__status', 'aria-live': 'polite' }, status )
				: null
		);
	}

	/* F7 · Reduce autosave frequency (Heartbeat interval)
	 * The editor's Heartbeat ticks every ~10s by default, driving background
	 * autosave/lock checks that can cause typing hitches on slow hosts. This
	 * toggle slows it to 120s. Saved per-browser; the original interval is
	 * captured once and restored when turned off. */
	var HEARTBEAT_KEY = 'blockEditorStudioSlowHeartbeat';
	var BES_SLOW_INTERVAL = 120;
	var besOriginalInterval = null;

	function besReadSlow() {
		try {
			return window.localStorage.getItem( HEARTBEAT_KEY ) === '1';
		} catch ( e ) {
			return false;
		}
	}

	function besApplyHeartbeat( slow ) {
		if ( ! window.wp || ! wp.heartbeat || typeof wp.heartbeat.interval !== 'function' ) {
			return;
		}
		if ( besOriginalInterval === null ) {
			besOriginalInterval = wp.heartbeat.interval();
		}
		wp.heartbeat.interval( slow ? BES_SLOW_INTERVAL : ( besOriginalInterval || 'standard' ) );
	}

	// Apply the saved preference on load.
	besApplyHeartbeat( besReadSlow() );

	function AutosavePanel() {
		if ( ! components.ToggleControl || ! useState ) {
			return null;
		}
		var t = useState( besReadSlow() );
		var slow = t[ 0 ];
		var setSlow = t[ 1 ];
		function onChange( value ) {
			setSlow( value );
			try {
				window.localStorage.setItem( HEARTBEAT_KEY, value ? '1' : '0' );
			} catch ( e ) {}
			besApplyHeartbeat( value );
		}
		return el(
			'div',
			{ className: 'bes-autosave' },
			el( 'h3', { className: 'bes-section-title' }, __( 'Performance', 'block-editor-studio' ) ),
			el( components.ToggleControl, {
				label: __( 'Reduce autosave frequency', 'block-editor-studio' ),
				help: __(
					'Slows background saving and checks to reduce typing hitches on slower sites.',
					'block-editor-studio'
				),
				checked: slow,
				onChange: onChange,
				__nextHasNoMarginBottom: true
			} )
		);
	}

	/* F1 · Clear Formatting
	 * A rich-text toolbar button that strips inline formatting from the
	 * selection (classic-editor parity; core dropped it). Registered as a
	 * format type purely to host the toolbar button and receive the
	 * rich-text value/onChange — it never applies a format of its own. */
	if ( registerFormatType && RichTextToolbarButton ) {
		registerFormatType( 'block-editor-studio/clear-formatting', {
			title: __( 'Clear formatting', 'block-editor-studio' ),
			tagName: 'span',
			className: 'bes-clear-formatting-noop',
			edit: function ( props ) {
				var value = props.value;
				return el( RichTextToolbarButton, {
					icon: 'editor-removeformatting',
					title: __( 'Clear formatting', 'block-editor-studio' ),
					onClick: function () {
						var collapsed = value.start === value.end;
						var from = collapsed ? 0 : value.start;
						var to = collapsed ? value.text.length : value.end;
						var formats = value.formats.slice();
						for ( var i = from; i < to; i++ ) {
							formats[ i ] = undefined;
						}
						props.onChange(
							Object.assign( {}, value, { formats: formats, activeFormats: [] } )
						);
					}
				} );
			}
		} );
	}

	/* F5b · Keyboard shortcut — open Find & Replace
	 * Ctrl/Cmd+F and Ctrl/Cmd+Shift+F open the Block Editor Studio sidebar
	 * and focus the Find field. Registered through the editor's own
	 * keyboard-shortcuts store, so it works while typing in the canvas
	 * iframe and shows up in the Keyboard Shortcuts help modal. Ctrl+F's
	 * native browser find is intentionally overridden inside the editor. */
	var FR_SHORTCUT = 'block-editor-studio/find-replace';
	var FR_SIDEBAR = 'block-editor-studio/block-editor-studio';

	function openBesSidebar() {
		// The action lives on core/edit-post (6.5+) — fall back across the
		// stores that have hosted it, then to the interface store directly.
		var stores = [ 'core/edit-post', 'core/editor' ];
		for ( var i = 0; i < stores.length; i++ ) {
			try {
				var d = wp.data.dispatch( stores[ i ] );
				if ( d && typeof d.openGeneralSidebar === 'function' ) {
					d.openGeneralSidebar( FR_SIDEBAR );
					return;
				}
			} catch ( e ) {}
		}
		try {
			var iface = wp.data.dispatch( 'core/interface' );
			if ( iface && typeof iface.enableComplementaryArea === 'function' ) {
				iface.enableComplementaryArea( 'core/edit-post', FR_SIDEBAR );
			}
		} catch ( e ) {}
	}

	// The sidebar renders asynchronously after it opens; poll briefly for
	// the Find input, then focus and select it.
	function focusFindSoon( attempts ) {
		attempts = attempts || 0;
		var root = document.querySelector( '.bes-findreplace' );
		var input = root && root.querySelector( 'input' );
		if ( input ) {
			try {
				input.focus();
				if ( typeof input.select === 'function' ) {
					input.select();
				}
			} catch ( e ) {}
			return;
		}
		if ( attempts < 20 ) {
			window.setTimeout( function () {
				focusFindSoon( attempts + 1 );
			}, 50 );
		}
	}

	function openFindReplace( event ) {
		if ( event && typeof event.preventDefault === 'function' ) {
			event.preventDefault();
		}
		openBesSidebar();
		focusFindSoon( 0 );
	}

	function registerFindShortcut() {
		var d = wp.data && wp.data.dispatch( 'core/keyboard-shortcuts' );
		var s = wp.data && wp.data.select( 'core/keyboard-shortcuts' );
		if ( ! d || typeof d.registerShortcut !== 'function' ) {
			return;
		}
		// Don't double-register if the script re-runs across editor remounts.
		if (
			s &&
			typeof s.getShortcutKeyCombo === 'function' &&
			s.getShortcutKeyCombo( FR_SHORTCUT )
		) {
			return;
		}
		d.registerShortcut( {
			name: FR_SHORTCUT,
			category: 'global',
			description: __( 'Open Block Editor Studio Find & Replace', 'block-editor-studio' ),
			keyCombo: { modifier: 'primary', character: 'f' },
			aliases: [ { modifier: 'primaryShift', character: 'f' } ]
		} );
	}

	registerFindShortcut();

	// Renders nothing; exists only to bind the shortcut within the editor's
	// ShortcutProvider. Mounted (below) only when useShortcut is available.
	function ShortcutHandler() {
		useShortcut( FR_SHORTCUT, openFindReplace );
		return null;
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
				useShortcut ? el( ShortcutHandler ) : null,
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
					el(
						'div',
						{ className: 'bes-sidebar' },
						el( AccentPicker ),
						el( WordCountPanel ),
						el( FindReplacePanel ),
						el( AutosavePanel )
					)
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

	/* ============================================================
	 * F4 · Safe destructive actions — undo toast on block removal
	 *
	 * Accidental block deletion ("I lost my work") is a top complaint,
	 * and core declined a delete-confirm dialog (relying on Ctrl+Z). We
	 * add a gentler safety net: when a *fresh* edit removes blocks, show
	 * a dismissible snackbar with an Undo action (native editor undo).
	 *
	 * Detecting a removal without false positives: we watch the global
	 * block count for a decrease, but a decrease also happens when the
	 * user presses Ctrl+Z to undo an insertion. We tell them apart with
	 * hasEditorRedo() — after an undo a redo becomes available, so we
	 * suppress in that case and only toast for genuine fresh removals.
	 * (Deferred: a drag-threshold guard for accidental moves — blocks
	 * are draggable only transiently via native DnD, with no clean
	 * threshold hook; too fragile to ship responsibly. v2 candidate.)
	 * ============================================================ */
	( function initSafeDelete() {
		if ( ! wp.data || ! wp.data.subscribe ) {
			return;
		}
		var be = wp.data.select( 'core/block-editor' );
		if ( ! be || typeof be.getGlobalBlockCount !== 'function' ) {
			return;
		}

		var NOTICE_ID = 'block-editor-studio/block-removed';
		var prevCount = be.getGlobalBlockCount();
		var cooling = false;

		function showRemovedToast( removed ) {
			var notices = wp.data.dispatch( 'core/notices' );
			if ( ! notices || ! notices.createNotice ) {
				return;
			}
			notices.createNotice(
				'info',
				sprintf(
					_n( '%d block removed.', '%d blocks removed.', removed, 'block-editor-studio' ),
					removed
				),
				{
					id: NOTICE_ID,
					type: 'snackbar',
					isDismissible: true,
					actions: [
						{
							label: __( 'Undo', 'block-editor-studio' ),
							onClick: function () {
								try {
									wp.data.dispatch( 'core/editor' ).undo();
								} catch ( e ) {}
							}
						}
					]
				}
			);
		}

		wp.data.subscribe( function () {
			var store = wp.data.select( 'core/block-editor' );
			if ( ! store || typeof store.getGlobalBlockCount !== 'function' ) {
				return;
			}
			var count = store.getGlobalBlockCount();
			if ( count === prevCount ) {
				return;
			}
			var dropped = prevCount - count;
			prevCount = count;
			if ( dropped <= 0 || cooling ) {
				return;
			}
			// Suppress when the decrease came from an undo (a redo is now available),
			// and only offer Undo when undo is actually possible.
			var ed = wp.data.select( 'core/editor' );
			var fromUndo = ed && typeof ed.hasEditorRedo === 'function' && ed.hasEditorRedo();
			var canUndo = ed && typeof ed.hasEditorUndo === 'function' ? ed.hasEditorUndo() : true;
			if ( fromUndo || ! canUndo ) {
				return;
			}
			cooling = true;
			window.setTimeout( function () {
				cooling = false;
			}, 500 );
			showRemovedToast( dropped );
		} );
	} )();
} )( window.wp );
