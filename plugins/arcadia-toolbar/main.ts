import {
	App,
	Editor,
	MarkdownView,
	Plugin,
	PluginSettingTab,
	Setting,
	setIcon
} from 'obsidian';

interface ArcadiaToolbarSettings {
	// Formatting
	showUndo: boolean;
	showBold: boolean;
	showItalic: boolean;
	showUnderline: boolean;
	showStrikethrough: boolean;
	showHighlight: boolean;
	showSubscript: boolean;
	showSuperscript: boolean;
	showClearFormatting: boolean;
	showFontColor: boolean;
	showBackgroundColor: boolean;
	// Structure
	showHeadings: boolean;
	showLists: boolean;
	showChecklist: boolean;
	showBlockquote: boolean;
	showIndent: boolean;
	showAlignment: boolean;
	showHorizontalRule: boolean;
	// Insert
	showLink: boolean;
	showImage: boolean;
	showTable: boolean;
	showCode: boolean;
	showScripture: boolean;
	showCallout: boolean;
	// Settings
	toolbarPosition: 'top' | 'bottom';
	scriptureTranslation: string;
	lastFontColor: string;
	lastBackgroundColor: string;
}

const DEFAULT_SETTINGS: ArcadiaToolbarSettings = {
	// Formatting
	showUndo: true,
	showBold: true,
	showItalic: true,
	showUnderline: true,
	showStrikethrough: true,
	showHighlight: true,
	showSubscript: true,
	showSuperscript: true,
	showClearFormatting: true,
	showFontColor: true,
	showBackgroundColor: true,
	// Structure
	showHeadings: true,
	showLists: true,
	showChecklist: true,
	showBlockquote: true,
	showIndent: true,
	showAlignment: true,
	showHorizontalRule: true,
	// Insert
	showLink: true,
	showImage: true,
	showTable: true,
	showCode: true,
	showScripture: true,
	showCallout: true,
	// Settings
	toolbarPosition: 'top',
	scriptureTranslation: 'ESV',
	lastFontColor: '#ff0000',
	lastBackgroundColor: '#ffff00'
};

// Color palettes
const FONT_COLORS = [
	// Row 1 - Dark colors
	'#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
	// Row 2 - Theme colors
	'#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
	// Row 3 - Light variants
	'#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc',
	// Row 4 - Medium variants
	'#dd7e6b', '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#a4c2f4', '#9fc5e8', '#b4a7d6', '#d5a6bd',
	// Row 5 - Standard colors
	'#cc4125', '#e06666', '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6d9eeb', '#6fa8dc', '#8e7cc3', '#c27ba0',
	// Row 6 - Dark variants
	'#a61c00', '#cc0000', '#e69138', '#f1c232', '#6aa84f', '#45818e', '#3c78d8', '#3d85c6', '#674ea7', '#a64d79',
	// Row 7 - Darker variants
	'#85200c', '#990000', '#b45f06', '#bf9000', '#38761d', '#134f5c', '#1155cc', '#0b5394', '#351c75', '#741b47',
	// Row 8 - Darkest variants
	'#5b0f00', '#660000', '#783f04', '#7f6000', '#274e13', '#0c343d', '#1c4587', '#073763', '#20124d', '#4c1130'
];

const BACKGROUND_COLORS = [
	// Translucent/light
	'transparent', '#ffffff', '#f5f5f5', '#e0e0e0', '#bdbdbd', '#9e9e9e',
	// Highlighter colors - bright
	'#ffff00', '#00ff00', '#00ffff', '#ff00ff', '#ff0000', '#0000ff',
	// Highlighter colors - pastel
	'#fff59d', '#c5e1a5', '#80deea', '#ce93d8', '#ef9a9a', '#90caf9',
	// Custom colors
	'#ffccbc', '#ffe0b2', '#fff9c4', '#dcedc8', '#b2dfdb', '#b3e5fc',
	'#e1bee7', '#f8bbd0', '#ffcdd2', '#d7ccc8', '#cfd8dc', '#b0bec5'
];

interface ToolbarButton {
	id: string;
	icon: string;
	tooltip: string;
	action: (editor: Editor) => void;
	settingKey?: keyof ArcadiaToolbarSettings;
	hasDropdown?: boolean;
}

export default class ArcadiaToolbarPlugin extends Plugin {
	settings: ArcadiaToolbarSettings;
	toolbarEl: HTMLElement | null = null;
	activeDropdown: HTMLElement | null = null;

	async onload() {
		await this.loadSettings();

		// Close dropdowns when clicking outside
		this.registerDomEvent(document, 'click', (e: MouseEvent) => {
			if (this.activeDropdown && !this.activeDropdown.contains(e.target as Node)) {
				const parent = (e.target as HTMLElement).closest('.arcadia-toolbar-dropdown');
				if (!parent) {
					this.closeDropdowns();
				}
			}
		});

		this.registerEvent(
			this.app.workspace.on('active-leaf-change', () => {
				this.updateToolbar();
			})
		);

		this.registerEvent(
			this.app.workspace.on('layout-change', () => {
				this.updateToolbar();
			})
		);

		this.registerCommands();
		this.addSettingTab(new ArcadiaToolbarSettingTab(this.app, this));

		this.app.workspace.onLayoutReady(() => {
			this.updateToolbar();
		});
	}

	registerCommands() {
		// Undo/Redo
		this.addCommand({ id: 'undo', name: 'Undo', editorCallback: (editor: Editor) => this.undo(editor) });
		this.addCommand({ id: 'redo', name: 'Redo', editorCallback: (editor: Editor) => this.redo(editor) });

		// Text formatting
		this.addCommand({ id: 'toggle-bold', name: 'Toggle Bold', editorCallback: (editor: Editor) => this.toggleBold(editor) });
		this.addCommand({ id: 'toggle-italic', name: 'Toggle Italic', editorCallback: (editor: Editor) => this.toggleItalic(editor) });
		this.addCommand({ id: 'toggle-underline', name: 'Toggle Underline', editorCallback: (editor: Editor) => this.toggleUnderline(editor) });
		this.addCommand({ id: 'toggle-strikethrough', name: 'Toggle Strikethrough', editorCallback: (editor: Editor) => this.toggleStrikethrough(editor) });
		this.addCommand({ id: 'toggle-highlight', name: 'Toggle Highlight', editorCallback: (editor: Editor) => this.toggleHighlight(editor) });
		this.addCommand({ id: 'toggle-subscript', name: 'Toggle Subscript', editorCallback: (editor: Editor) => this.toggleSubscript(editor) });
		this.addCommand({ id: 'toggle-superscript', name: 'Toggle Superscript', editorCallback: (editor: Editor) => this.toggleSuperscript(editor) });
		this.addCommand({ id: 'clear-formatting', name: 'Clear Formatting', editorCallback: (editor: Editor) => this.clearFormatting(editor) });

		// Alignment
		this.addCommand({ id: 'align-left', name: 'Align Left', editorCallback: (editor: Editor) => this.setAlignment(editor, 'left') });
		this.addCommand({ id: 'align-center', name: 'Align Center', editorCallback: (editor: Editor) => this.setAlignment(editor, 'center') });
		this.addCommand({ id: 'align-right', name: 'Align Right', editorCallback: (editor: Editor) => this.setAlignment(editor, 'right') });
		this.addCommand({ id: 'align-justify', name: 'Align Justify', editorCallback: (editor: Editor) => this.setAlignment(editor, 'justify') });

		// Headings
		for (let i = 1; i <= 6; i++) {
			this.addCommand({ id: `insert-heading-${i}`, name: `Insert Heading ${i}`, editorCallback: (editor: Editor) => this.insertHeading(editor, i) });
		}

		// Lists
		this.addCommand({ id: 'toggle-bullet-list', name: 'Toggle Bullet List', editorCallback: (editor: Editor) => this.toggleBulletList(editor) });
		this.addCommand({ id: 'toggle-numbered-list', name: 'Toggle Numbered List', editorCallback: (editor: Editor) => this.toggleNumberedList(editor) });
		this.addCommand({ id: 'toggle-checklist', name: 'Toggle Checklist', editorCallback: (editor: Editor) => this.toggleChecklist(editor) });
		this.addCommand({ id: 'toggle-blockquote', name: 'Toggle Blockquote', editorCallback: (editor: Editor) => this.toggleBlockquote(editor) });

		// Indentation
		this.addCommand({ id: 'indent', name: 'Indent', editorCallback: (editor: Editor) => this.indent(editor) });
		this.addCommand({ id: 'outdent', name: 'Outdent', editorCallback: (editor: Editor) => this.outdent(editor) });

		// Insert elements
		this.addCommand({ id: 'insert-horizontal-rule', name: 'Insert Horizontal Rule', editorCallback: (editor: Editor) => this.insertHorizontalRule(editor) });
		this.addCommand({ id: 'insert-link', name: 'Insert Link', editorCallback: (editor: Editor) => this.insertLink(editor) });
		this.addCommand({ id: 'insert-image', name: 'Insert Image', editorCallback: (editor: Editor) => this.insertImage(editor) });
		this.addCommand({ id: 'insert-table', name: 'Insert Table', editorCallback: (editor: Editor) => this.insertTable(editor) });
		this.addCommand({ id: 'toggle-inline-code', name: 'Toggle Inline Code', editorCallback: (editor: Editor) => this.toggleInlineCode(editor) });
		this.addCommand({ id: 'insert-code-block', name: 'Insert Code Block', editorCallback: (editor: Editor) => this.insertCodeBlock(editor) });
		this.addCommand({ id: 'insert-callout', name: 'Insert Callout', editorCallback: (editor: Editor) => this.insertCallout(editor) });
		this.addCommand({ id: 'insert-scripture-block', name: 'Insert Scripture Block', editorCallback: (editor: Editor) => this.insertScriptureBlock(editor) });
	}

	onunload() {
		this.removeToolbar();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
		this.updateToolbar();
	}

	removeToolbar() {
		if (this.toolbarEl) {
			this.toolbarEl.remove();
			this.toolbarEl = null;
		}
	}

	closeDropdowns() {
		if (this.activeDropdown) {
			this.activeDropdown.remove();
			this.activeDropdown = null;
		}
	}

	updateToolbar() {
		this.removeToolbar();

		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!activeView) return;

		const editorEl = activeView.containerEl.querySelector('.cm-editor');
		if (!editorEl) return;

		this.toolbarEl = document.createElement('div');
		this.toolbarEl.className = 'arcadia-toolbar';

		const buttons: ToolbarButton[] = [
			// Undo/Redo
			{ id: 'undo', icon: 'undo', tooltip: 'Undo', action: (e) => this.undo(e), settingKey: 'showUndo' },
			{ id: 'redo', icon: 'redo', tooltip: 'Redo', action: (e) => this.redo(e), settingKey: 'showUndo' },
			{ id: 'separator-0', icon: '', tooltip: '', action: () => {} },

			// Text Formatting
			{ id: 'bold', icon: 'bold', tooltip: 'Bold', action: (e) => this.toggleBold(e), settingKey: 'showBold' },
			{ id: 'italic', icon: 'italic', tooltip: 'Italic', action: (e) => this.toggleItalic(e), settingKey: 'showItalic' },
			{ id: 'underline', icon: 'underline', tooltip: 'Underline', action: (e) => this.toggleUnderline(e), settingKey: 'showUnderline' },
			{ id: 'strikethrough', icon: 'strikethrough', tooltip: 'Strikethrough', action: (e) => this.toggleStrikethrough(e), settingKey: 'showStrikethrough' },
			{ id: 'highlight', icon: 'highlighter', tooltip: 'Highlight (Markdown)', action: (e) => this.toggleHighlight(e), settingKey: 'showHighlight' },
			{ id: 'subscript', icon: 'subscript', tooltip: 'Subscript', action: (e) => this.toggleSubscript(e), settingKey: 'showSubscript' },
			{ id: 'superscript', icon: 'superscript', tooltip: 'Superscript', action: (e) => this.toggleSuperscript(e), settingKey: 'showSuperscript' },
			{ id: 'clear-formatting', icon: 'eraser', tooltip: 'Clear Formatting', action: (e) => this.clearFormatting(e), settingKey: 'showClearFormatting' },
			{ id: 'separator-1', icon: '', tooltip: '', action: () => {} },

			// Font Color (with dropdown)
			{ id: 'font-color', icon: 'palette', tooltip: 'Font Color', action: () => {}, settingKey: 'showFontColor', hasDropdown: true },
			// Background Color (with dropdown)
			{ id: 'background-color', icon: 'paintbrush', tooltip: 'Background Color', action: () => {}, settingKey: 'showBackgroundColor', hasDropdown: true },
			{ id: 'separator-1b', icon: '', tooltip: '', action: () => {} },

			// Headings
			{ id: 'heading-1', icon: 'heading-1', tooltip: 'Heading 1', action: (e) => this.insertHeading(e, 1), settingKey: 'showHeadings' },
			{ id: 'heading-2', icon: 'heading-2', tooltip: 'Heading 2', action: (e) => this.insertHeading(e, 2), settingKey: 'showHeadings' },
			{ id: 'heading-3', icon: 'heading-3', tooltip: 'Heading 3', action: (e) => this.insertHeading(e, 3), settingKey: 'showHeadings' },
			{ id: 'heading-4', icon: 'heading-4', tooltip: 'Heading 4', action: (e) => this.insertHeading(e, 4), settingKey: 'showHeadings' },
			{ id: 'heading-5', icon: 'heading-5', tooltip: 'Heading 5', action: (e) => this.insertHeading(e, 5), settingKey: 'showHeadings' },
			{ id: 'heading-6', icon: 'heading-6', tooltip: 'Heading 6', action: (e) => this.insertHeading(e, 6), settingKey: 'showHeadings' },
			{ id: 'separator-2', icon: '', tooltip: '', action: () => {} },

			// Lists & Structure
			{ id: 'bullet-list', icon: 'list', tooltip: 'Bullet List', action: (e) => this.toggleBulletList(e), settingKey: 'showLists' },
			{ id: 'numbered-list', icon: 'list-ordered', tooltip: 'Numbered List', action: (e) => this.toggleNumberedList(e), settingKey: 'showLists' },
			{ id: 'checklist', icon: 'list-checks', tooltip: 'Checklist', action: (e) => this.toggleChecklist(e), settingKey: 'showChecklist' },
			{ id: 'blockquote', icon: 'quote', tooltip: 'Blockquote', action: (e) => this.toggleBlockquote(e), settingKey: 'showBlockquote' },
			{ id: 'separator-3', icon: '', tooltip: '', action: () => {} },

			// Indentation
			{ id: 'outdent', icon: 'outdent', tooltip: 'Decrease Indent', action: (e) => this.outdent(e), settingKey: 'showIndent' },
			{ id: 'indent', icon: 'indent', tooltip: 'Increase Indent', action: (e) => this.indent(e), settingKey: 'showIndent' },
			{ id: 'separator-3b', icon: '', tooltip: '', action: () => {} },

			// Alignment (with dropdown)
			{ id: 'alignment', icon: 'align-center', tooltip: 'Text Alignment', action: () => {}, settingKey: 'showAlignment', hasDropdown: true },
			{ id: 'separator-4', icon: '', tooltip: '', action: () => {} },

			// Insert Elements
			{ id: 'horizontal-rule', icon: 'minus', tooltip: 'Horizontal Rule', action: (e) => this.insertHorizontalRule(e), settingKey: 'showHorizontalRule' },
			{ id: 'link', icon: 'link', tooltip: 'Insert Link', action: (e) => this.insertLink(e), settingKey: 'showLink' },
			{ id: 'image', icon: 'image', tooltip: 'Insert Image', action: (e) => this.insertImage(e), settingKey: 'showImage' },
			{ id: 'table', icon: 'table', tooltip: 'Insert Table', action: (e) => this.insertTable(e), settingKey: 'showTable' },
			{ id: 'inline-code', icon: 'code', tooltip: 'Inline Code', action: (e) => this.toggleInlineCode(e), settingKey: 'showCode' },
			{ id: 'code-block', icon: 'file-code', tooltip: 'Code Block', action: (e) => this.insertCodeBlock(e), settingKey: 'showCode' },
			{ id: 'separator-5', icon: '', tooltip: '', action: () => {} },

			// Callouts
			{ id: 'callout', icon: 'message-square', tooltip: 'Insert Callout', action: (e) => this.insertCallout(e), settingKey: 'showCallout' },
			{ id: 'scripture', icon: 'book-open', tooltip: 'Insert Scripture', action: (e) => this.insertScriptureBlock(e), settingKey: 'showScripture' }
		];

		for (const btn of buttons) {
			if (btn.id.startsWith('separator')) {
				const separator = document.createElement('div');
				separator.className = 'arcadia-toolbar-separator';
				this.toolbarEl.appendChild(separator);
				continue;
			}

			if (btn.settingKey && !this.settings[btn.settingKey]) continue;

			if (btn.hasDropdown) {
				this.createDropdownButton(btn, activeView);
			} else {
				const buttonEl = document.createElement('button');
				buttonEl.className = 'arcadia-toolbar-button';
				buttonEl.setAttribute('aria-label', btn.tooltip);
				buttonEl.setAttribute('title', btn.tooltip);
				setIcon(buttonEl, btn.icon);

				buttonEl.addEventListener('click', (e) => {
					e.preventDefault();
					e.stopPropagation();
					if (activeView.editor) btn.action(activeView.editor);
				});

				this.toolbarEl.appendChild(buttonEl);
			}
		}

		const cmScroller = editorEl.querySelector('.cm-scroller');
		if (cmScroller && this.settings.toolbarPosition === 'top') {
			editorEl.insertBefore(this.toolbarEl, cmScroller);
		} else if (cmScroller) {
			editorEl.appendChild(this.toolbarEl);
		}
	}

	createDropdownButton(btn: ToolbarButton, activeView: MarkdownView) {
		const wrapper = document.createElement('div');
		wrapper.className = 'arcadia-toolbar-dropdown';

		const buttonEl = document.createElement('button');
		buttonEl.className = 'arcadia-toolbar-button arcadia-toolbar-dropdown-trigger';
		buttonEl.setAttribute('aria-label', btn.tooltip);
		buttonEl.setAttribute('title', btn.tooltip);

		if (btn.id === 'font-color') {
			// Font color button with color indicator
			const iconWrapper = document.createElement('span');
			iconWrapper.className = 'arcadia-color-icon';
			setIcon(iconWrapper, 'baseline');
			const colorBar = document.createElement('span');
			colorBar.className = 'arcadia-color-bar';
			colorBar.style.backgroundColor = this.settings.lastFontColor;
			buttonEl.appendChild(iconWrapper);
			buttonEl.appendChild(colorBar);
		} else if (btn.id === 'background-color') {
			// Background color button with color indicator
			const iconWrapper = document.createElement('span');
			iconWrapper.className = 'arcadia-color-icon';
			setIcon(iconWrapper, 'highlighter');
			const colorBar = document.createElement('span');
			colorBar.className = 'arcadia-color-bar';
			colorBar.style.backgroundColor = this.settings.lastBackgroundColor;
			buttonEl.appendChild(iconWrapper);
			buttonEl.appendChild(colorBar);
		} else if (btn.id === 'alignment') {
			setIcon(buttonEl, 'align-center');
		}

		// Add dropdown arrow
		const arrow = document.createElement('span');
		arrow.className = 'arcadia-dropdown-arrow';
		arrow.innerHTML = '▼';
		buttonEl.appendChild(arrow);

		buttonEl.addEventListener('click', (e) => {
			e.preventDefault();
			e.stopPropagation();
			this.toggleDropdown(btn.id, wrapper, activeView);
		});

		wrapper.appendChild(buttonEl);
		this.toolbarEl!.appendChild(wrapper);
	}

	toggleDropdown(type: string, wrapper: HTMLElement, activeView: MarkdownView) {
		this.closeDropdowns();

		const dropdown = document.createElement('div');
		dropdown.className = 'arcadia-dropdown-menu';

		if (type === 'font-color') {
			dropdown.innerHTML = '<div class="arcadia-dropdown-title">Font Colors</div>';
			const grid = document.createElement('div');
			grid.className = 'arcadia-color-grid';

			FONT_COLORS.forEach(color => {
				const colorBtn = document.createElement('button');
				colorBtn.className = 'arcadia-color-swatch';
				colorBtn.style.backgroundColor = color;
				colorBtn.setAttribute('title', color);
				colorBtn.addEventListener('click', (e) => {
					e.preventDefault();
					e.stopPropagation();
					this.applyFontColor(activeView.editor, color);
					this.closeDropdowns();
				});
				grid.appendChild(colorBtn);
			});

			dropdown.appendChild(grid);
		} else if (type === 'background-color') {
			dropdown.innerHTML = '<div class="arcadia-dropdown-title">Background Colors</div>';
			const grid = document.createElement('div');
			grid.className = 'arcadia-color-grid';

			BACKGROUND_COLORS.forEach(color => {
				const colorBtn = document.createElement('button');
				colorBtn.className = 'arcadia-color-swatch';
				if (color === 'transparent') {
					colorBtn.innerHTML = '✕';
					colorBtn.style.backgroundColor = '#fff';
					colorBtn.style.color = '#999';
				} else {
					colorBtn.style.backgroundColor = color;
				}
				colorBtn.setAttribute('title', color);
				colorBtn.addEventListener('click', (e) => {
					e.preventDefault();
					e.stopPropagation();
					this.applyBackgroundColor(activeView.editor, color);
					this.closeDropdowns();
				});
				grid.appendChild(colorBtn);
			});

			dropdown.appendChild(grid);
		} else if (type === 'alignment') {
			const alignments = [
				{ align: 'left', icon: 'align-left', label: 'Align Left' },
				{ align: 'center', icon: 'align-center', label: 'Align Center' },
				{ align: 'right', icon: 'align-right', label: 'Align Right' },
				{ align: 'justify', icon: 'align-justify', label: 'Justify' }
			];

			const grid = document.createElement('div');
			grid.className = 'arcadia-align-grid';

			alignments.forEach(({ align, icon, label }) => {
				const alignBtn = document.createElement('button');
				alignBtn.className = 'arcadia-align-button';
				alignBtn.setAttribute('title', label);
				setIcon(alignBtn, icon);
				alignBtn.addEventListener('click', (e) => {
					e.preventDefault();
					e.stopPropagation();
					this.setAlignment(activeView.editor, align);
					this.closeDropdowns();
				});
				grid.appendChild(alignBtn);
			});

			dropdown.appendChild(grid);
		}

		wrapper.appendChild(dropdown);
		this.activeDropdown = dropdown;
	}

	// === Color Functions ===

	applyFontColor(editor: Editor, color: string) {
		const selection = editor.getSelection();
		this.settings.lastFontColor = color;
		this.saveSettings();

		if (selection) {
			editor.replaceSelection(`<font color="${color}">${selection}</font>`);
		} else {
			const cursor = editor.getCursor();
			editor.replaceRange(`<font color="${color}"></font>`, cursor);
			editor.setCursor({ line: cursor.line, ch: cursor.ch + 22 });
		}
	}

	applyBackgroundColor(editor: Editor, color: string) {
		const selection = editor.getSelection();
		this.settings.lastBackgroundColor = color;
		this.saveSettings();

		if (color === 'transparent') {
			// Remove background color
			if (selection) {
				const cleaned = selection.replace(/<mark[^>]*>([^<]*)<\/mark>/g, '$1');
				editor.replaceSelection(cleaned);
			}
		} else if (selection) {
			editor.replaceSelection(`<mark style="background:${color}">${selection}</mark>`);
		} else {
			const cursor = editor.getCursor();
			editor.replaceRange(`<mark style="background:${color}"></mark>`, cursor);
			editor.setCursor({ line: cursor.line, ch: cursor.ch + 30 + color.length });
		}
	}

	// === Alignment Function ===

	setAlignment(editor: Editor, alignment: string) {
		const cursor = editor.getCursor();
		const line = editor.getLine(cursor.line);

		// Check if line already has alignment
		const alignMatch = line.match(/^<p align="[^"]*">(.*)<\/p>$/);
		if (alignMatch) {
			// Replace existing alignment
			editor.setLine(cursor.line, `<p align="${alignment}">${alignMatch[1]}</p>`);
		} else {
			// Wrap line in alignment tag
			editor.setLine(cursor.line, `<p align="${alignment}">${line}</p>`);
		}
	}

	// === Undo/Redo ===

	undo(editor: Editor) {
		// @ts-ignore
		editor.undo();
	}

	redo(editor: Editor) {
		// @ts-ignore
		editor.redo();
	}

	// === Text Formatting Functions ===

	toggleBold(editor: Editor) {
		const selection = editor.getSelection();
		if (selection) {
			if (selection.startsWith('**') && selection.endsWith('**')) {
				editor.replaceSelection(selection.slice(2, -2));
			} else {
				editor.replaceSelection(`**${selection}**`);
			}
		} else {
			const cursor = editor.getCursor();
			editor.replaceRange('****', cursor);
			editor.setCursor({ line: cursor.line, ch: cursor.ch + 2 });
		}
	}

	toggleItalic(editor: Editor) {
		const selection = editor.getSelection();
		if (selection) {
			if (selection.startsWith('*') && selection.endsWith('*') && !selection.startsWith('**')) {
				editor.replaceSelection(selection.slice(1, -1));
			} else {
				editor.replaceSelection(`*${selection}*`);
			}
		} else {
			const cursor = editor.getCursor();
			editor.replaceRange('**', cursor);
			editor.setCursor({ line: cursor.line, ch: cursor.ch + 1 });
		}
	}

	toggleUnderline(editor: Editor) {
		const selection = editor.getSelection();
		if (selection) {
			if (selection.startsWith('<u>') && selection.endsWith('</u>')) {
				editor.replaceSelection(selection.slice(3, -4));
			} else {
				editor.replaceSelection(`<u>${selection}</u>`);
			}
		} else {
			const cursor = editor.getCursor();
			editor.replaceRange('<u></u>', cursor);
			editor.setCursor({ line: cursor.line, ch: cursor.ch + 3 });
		}
	}

	toggleStrikethrough(editor: Editor) {
		const selection = editor.getSelection();
		if (selection) {
			if (selection.startsWith('~~') && selection.endsWith('~~')) {
				editor.replaceSelection(selection.slice(2, -2));
			} else {
				editor.replaceSelection(`~~${selection}~~`);
			}
		} else {
			const cursor = editor.getCursor();
			editor.replaceRange('~~~~', cursor);
			editor.setCursor({ line: cursor.line, ch: cursor.ch + 2 });
		}
	}

	toggleHighlight(editor: Editor) {
		const selection = editor.getSelection();
		if (selection) {
			if (selection.startsWith('==') && selection.endsWith('==')) {
				editor.replaceSelection(selection.slice(2, -2));
			} else {
				editor.replaceSelection(`==${selection}==`);
			}
		} else {
			const cursor = editor.getCursor();
			editor.replaceRange('====', cursor);
			editor.setCursor({ line: cursor.line, ch: cursor.ch + 2 });
		}
	}

	toggleSubscript(editor: Editor) {
		const selection = editor.getSelection();
		if (selection) {
			if (selection.startsWith('<sub>') && selection.endsWith('</sub>')) {
				editor.replaceSelection(selection.slice(5, -6));
			} else {
				editor.replaceSelection(`<sub>${selection}</sub>`);
			}
		} else {
			const cursor = editor.getCursor();
			editor.replaceRange('<sub></sub>', cursor);
			editor.setCursor({ line: cursor.line, ch: cursor.ch + 5 });
		}
	}

	toggleSuperscript(editor: Editor) {
		const selection = editor.getSelection();
		if (selection) {
			if (selection.startsWith('<sup>') && selection.endsWith('</sup>')) {
				editor.replaceSelection(selection.slice(5, -6));
			} else {
				editor.replaceSelection(`<sup>${selection}</sup>`);
			}
		} else {
			const cursor = editor.getCursor();
			editor.replaceRange('<sup></sup>', cursor);
			editor.setCursor({ line: cursor.line, ch: cursor.ch + 5 });
		}
	}

	clearFormatting(editor: Editor) {
		const selection = editor.getSelection();
		if (selection) {
			let cleaned = selection
				.replace(/\*\*(.+?)\*\*/g, '$1')
				.replace(/\*(.+?)\*/g, '$1')
				.replace(/~~(.+?)~~/g, '$1')
				.replace(/==(.+?)==/g, '$1')
				.replace(/`(.+?)`/g, '$1')
				.replace(/<u>(.+?)<\/u>/g, '$1')
				.replace(/<sub>(.+?)<\/sub>/g, '$1')
				.replace(/<sup>(.+?)<\/sup>/g, '$1')
				.replace(/<mark[^>]*>(.+?)<\/mark>/g, '$1')
				.replace(/<font[^>]*>(.+?)<\/font>/g, '$1')
				.replace(/<p align="[^"]*">(.+?)<\/p>/g, '$1');
			editor.replaceSelection(cleaned);
		}
	}

	// === Heading Functions ===

	insertHeading(editor: Editor, level: number) {
		const cursor = editor.getCursor();
		const line = editor.getLine(cursor.line);
		const headingPrefix = '#'.repeat(level) + ' ';

		const headingMatch = line.match(/^(#{1,6})\s/);
		if (headingMatch) {
			const newLine = headingPrefix + line.slice(headingMatch[0].length);
			editor.setLine(cursor.line, newLine);
		} else {
			editor.setLine(cursor.line, headingPrefix + line);
		}
	}

	// === List Functions ===

	toggleBulletList(editor: Editor) {
		const cursor = editor.getCursor();
		const line = editor.getLine(cursor.line);

		if (line.match(/^(\s*)- /)) {
			editor.setLine(cursor.line, line.replace(/^(\s*)- /, '$1'));
		} else if (line.match(/^(\s*)\d+\. /)) {
			editor.setLine(cursor.line, line.replace(/^(\s*)\d+\. /, '$1- '));
		} else if (line.match(/^(\s*)- \[[ x]\] /)) {
			editor.setLine(cursor.line, line.replace(/^(\s*)- \[[ x]\] /, '$1- '));
		} else {
			const indent = line.match(/^(\s*)/)?.[0] || '';
			editor.setLine(cursor.line, indent + '- ' + line.trimStart());
		}
	}

	toggleNumberedList(editor: Editor) {
		const cursor = editor.getCursor();
		const line = editor.getLine(cursor.line);

		if (line.match(/^(\s*)\d+\. /)) {
			editor.setLine(cursor.line, line.replace(/^(\s*)\d+\. /, '$1'));
		} else if (line.match(/^(\s*)- /)) {
			editor.setLine(cursor.line, line.replace(/^(\s*)- /, '$11. '));
		} else if (line.match(/^(\s*)- \[[ x]\] /)) {
			editor.setLine(cursor.line, line.replace(/^(\s*)- \[[ x]\] /, '$11. '));
		} else {
			const indent = line.match(/^(\s*)/)?.[0] || '';
			editor.setLine(cursor.line, indent + '1. ' + line.trimStart());
		}
	}

	toggleChecklist(editor: Editor) {
		const cursor = editor.getCursor();
		const line = editor.getLine(cursor.line);

		if (line.match(/^(\s*)- \[ \] /)) {
			editor.setLine(cursor.line, line.replace(/^(\s*)- \[ \] /, '$1- [x] '));
		} else if (line.match(/^(\s*)- \[x\] /i)) {
			editor.setLine(cursor.line, line.replace(/^(\s*)- \[x\] /i, '$1'));
		} else if (line.match(/^(\s*)- /)) {
			editor.setLine(cursor.line, line.replace(/^(\s*)- /, '$1- [ ] '));
		} else if (line.match(/^(\s*)\d+\. /)) {
			editor.setLine(cursor.line, line.replace(/^(\s*)\d+\. /, '$1- [ ] '));
		} else {
			const indent = line.match(/^(\s*)/)?.[0] || '';
			editor.setLine(cursor.line, indent + '- [ ] ' + line.trimStart());
		}
	}

	toggleBlockquote(editor: Editor) {
		const cursor = editor.getCursor();
		const line = editor.getLine(cursor.line);

		if (line.startsWith('> ')) {
			editor.setLine(cursor.line, line.slice(2));
		} else {
			editor.setLine(cursor.line, '> ' + line);
		}
	}

	// === Indentation Functions ===

	indent(editor: Editor) {
		const cursor = editor.getCursor();
		const line = editor.getLine(cursor.line);
		editor.setLine(cursor.line, '\t' + line);
		editor.setCursor({ line: cursor.line, ch: cursor.ch + 1 });
	}

	outdent(editor: Editor) {
		const cursor = editor.getCursor();
		const line = editor.getLine(cursor.line);

		if (line.startsWith('\t')) {
			editor.setLine(cursor.line, line.slice(1));
			editor.setCursor({ line: cursor.line, ch: Math.max(0, cursor.ch - 1) });
		} else if (line.startsWith('    ')) {
			editor.setLine(cursor.line, line.slice(4));
			editor.setCursor({ line: cursor.line, ch: Math.max(0, cursor.ch - 4) });
		} else if (line.startsWith('  ')) {
			editor.setLine(cursor.line, line.slice(2));
			editor.setCursor({ line: cursor.line, ch: Math.max(0, cursor.ch - 2) });
		}
	}

	// === Insert Functions ===

	insertHorizontalRule(editor: Editor) {
		const cursor = editor.getCursor();
		const line = editor.getLine(cursor.line);

		if (line.trim() === '') {
			editor.setLine(cursor.line, '---');
			editor.setCursor({ line: cursor.line + 1, ch: 0 });
		} else {
			editor.replaceRange('\n\n---\n\n', { line: cursor.line, ch: line.length });
			editor.setCursor({ line: cursor.line + 4, ch: 0 });
		}
	}

	insertLink(editor: Editor) {
		const selection = editor.getSelection();
		if (selection) {
			editor.replaceSelection(`[${selection}](url)`);
			const cursor = editor.getCursor();
			editor.setSelection(
				{ line: cursor.line, ch: cursor.ch - 4 },
				{ line: cursor.line, ch: cursor.ch - 1 }
			);
		} else {
			const cursor = editor.getCursor();
			editor.replaceRange('[](url)', cursor);
			editor.setCursor({ line: cursor.line, ch: cursor.ch + 1 });
		}
	}

	insertImage(editor: Editor) {
		const selection = editor.getSelection();
		if (selection) {
			editor.replaceSelection(`![${selection}](image-url)`);
		} else {
			const cursor = editor.getCursor();
			editor.replaceRange('![alt text](image-url)', cursor);
			editor.setSelection(
				{ line: cursor.line, ch: cursor.ch + 2 },
				{ line: cursor.line, ch: cursor.ch + 10 }
			);
		}
	}

	insertTable(editor: Editor) {
		const cursor = editor.getCursor();
		const table = `| Header 1 | Header 2 | Header 3 |
| -------- | -------- | -------- |
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |
`;
		editor.replaceRange(table, cursor);
		editor.setCursor({ line: cursor.line, ch: 2 });
	}

	toggleInlineCode(editor: Editor) {
		const selection = editor.getSelection();
		if (selection) {
			if (selection.startsWith('`') && selection.endsWith('`')) {
				editor.replaceSelection(selection.slice(1, -1));
			} else {
				editor.replaceSelection(`\`${selection}\``);
			}
		} else {
			const cursor = editor.getCursor();
			editor.replaceRange('``', cursor);
			editor.setCursor({ line: cursor.line, ch: cursor.ch + 1 });
		}
	}

	insertCodeBlock(editor: Editor) {
		const selection = editor.getSelection();
		const cursor = editor.getCursor();

		if (selection) {
			editor.replaceSelection(`\`\`\`\n${selection}\n\`\`\``);
		} else {
			editor.replaceRange('```\n\n```', cursor);
			editor.setCursor({ line: cursor.line + 1, ch: 0 });
		}
	}

	insertCallout(editor: Editor) {
		const cursor = editor.getCursor();
		const callout = `> [!note] Title
> Content goes here...
`;
		editor.replaceRange(callout, cursor);
		editor.setCursor({ line: cursor.line, ch: 10 });
	}

	insertScriptureBlock(editor: Editor) {
		const cursor = editor.getCursor();
		const translation = this.settings.scriptureTranslation;

		const scriptureBlock = `> [!scripture] Scripture Reference
> **Book Chapter:Verse (${translation})**
>
> Enter scripture text here...
`;

		editor.replaceRange(scriptureBlock, cursor);
		editor.setCursor({ line: cursor.line + 1, ch: 3 });
	}
}

class ArcadiaToolbarSettingTab extends PluginSettingTab {
	plugin: ArcadiaToolbarPlugin;

	constructor(app: App, plugin: ArcadiaToolbarPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: 'Arcadia Toolbar Settings' });

		new Setting(containerEl)
			.setName('Toolbar position')
			.setDesc('Where to display the formatting toolbar')
			.addDropdown(dropdown => dropdown
				.addOption('top', 'Top of editor')
				.addOption('bottom', 'Bottom of editor')
				.setValue(this.plugin.settings.toolbarPosition)
				.onChange(async (value) => {
					this.plugin.settings.toolbarPosition = value as 'top' | 'bottom';
					await this.plugin.saveSettings();
				}));

		// Text Formatting
		containerEl.createEl('h3', { text: 'Text Formatting' });

		new Setting(containerEl).setName('Show Undo/Redo').addToggle(toggle => toggle.setValue(this.plugin.settings.showUndo).onChange(async (value) => { this.plugin.settings.showUndo = value; await this.plugin.saveSettings(); }));
		new Setting(containerEl).setName('Show Bold').addToggle(toggle => toggle.setValue(this.plugin.settings.showBold).onChange(async (value) => { this.plugin.settings.showBold = value; await this.plugin.saveSettings(); }));
		new Setting(containerEl).setName('Show Italic').addToggle(toggle => toggle.setValue(this.plugin.settings.showItalic).onChange(async (value) => { this.plugin.settings.showItalic = value; await this.plugin.saveSettings(); }));
		new Setting(containerEl).setName('Show Underline').addToggle(toggle => toggle.setValue(this.plugin.settings.showUnderline).onChange(async (value) => { this.plugin.settings.showUnderline = value; await this.plugin.saveSettings(); }));
		new Setting(containerEl).setName('Show Strikethrough').addToggle(toggle => toggle.setValue(this.plugin.settings.showStrikethrough).onChange(async (value) => { this.plugin.settings.showStrikethrough = value; await this.plugin.saveSettings(); }));
		new Setting(containerEl).setName('Show Highlight').addToggle(toggle => toggle.setValue(this.plugin.settings.showHighlight).onChange(async (value) => { this.plugin.settings.showHighlight = value; await this.plugin.saveSettings(); }));
		new Setting(containerEl).setName('Show Subscript/Superscript').addToggle(toggle => toggle.setValue(this.plugin.settings.showSubscript).onChange(async (value) => { this.plugin.settings.showSubscript = value; this.plugin.settings.showSuperscript = value; await this.plugin.saveSettings(); }));
		new Setting(containerEl).setName('Show Clear Formatting').addToggle(toggle => toggle.setValue(this.plugin.settings.showClearFormatting).onChange(async (value) => { this.plugin.settings.showClearFormatting = value; await this.plugin.saveSettings(); }));
		new Setting(containerEl).setName('Show Font Color').setDesc('Color picker for text color using HTML').addToggle(toggle => toggle.setValue(this.plugin.settings.showFontColor).onChange(async (value) => { this.plugin.settings.showFontColor = value; await this.plugin.saveSettings(); }));
		new Setting(containerEl).setName('Show Background Color').setDesc('Color picker for background highlight using HTML').addToggle(toggle => toggle.setValue(this.plugin.settings.showBackgroundColor).onChange(async (value) => { this.plugin.settings.showBackgroundColor = value; await this.plugin.saveSettings(); }));

		// Structure
		containerEl.createEl('h3', { text: 'Structure' });

		new Setting(containerEl).setName('Show Heading buttons').addToggle(toggle => toggle.setValue(this.plugin.settings.showHeadings).onChange(async (value) => { this.plugin.settings.showHeadings = value; await this.plugin.saveSettings(); }));
		new Setting(containerEl).setName('Show List buttons').addToggle(toggle => toggle.setValue(this.plugin.settings.showLists).onChange(async (value) => { this.plugin.settings.showLists = value; await this.plugin.saveSettings(); }));
		new Setting(containerEl).setName('Show Checklist button').addToggle(toggle => toggle.setValue(this.plugin.settings.showChecklist).onChange(async (value) => { this.plugin.settings.showChecklist = value; await this.plugin.saveSettings(); }));
		new Setting(containerEl).setName('Show Blockquote').addToggle(toggle => toggle.setValue(this.plugin.settings.showBlockquote).onChange(async (value) => { this.plugin.settings.showBlockquote = value; await this.plugin.saveSettings(); }));
		new Setting(containerEl).setName('Show Indent/Outdent').addToggle(toggle => toggle.setValue(this.plugin.settings.showIndent).onChange(async (value) => { this.plugin.settings.showIndent = value; await this.plugin.saveSettings(); }));
		new Setting(containerEl).setName('Show Alignment').setDesc('Text alignment using HTML').addToggle(toggle => toggle.setValue(this.plugin.settings.showAlignment).onChange(async (value) => { this.plugin.settings.showAlignment = value; await this.plugin.saveSettings(); }));
		new Setting(containerEl).setName('Show Horizontal Rule').addToggle(toggle => toggle.setValue(this.plugin.settings.showHorizontalRule).onChange(async (value) => { this.plugin.settings.showHorizontalRule = value; await this.plugin.saveSettings(); }));

		// Insert Elements
		containerEl.createEl('h3', { text: 'Insert Elements' });

		new Setting(containerEl).setName('Show Link').addToggle(toggle => toggle.setValue(this.plugin.settings.showLink).onChange(async (value) => { this.plugin.settings.showLink = value; await this.plugin.saveSettings(); }));
		new Setting(containerEl).setName('Show Image').addToggle(toggle => toggle.setValue(this.plugin.settings.showImage).onChange(async (value) => { this.plugin.settings.showImage = value; await this.plugin.saveSettings(); }));
		new Setting(containerEl).setName('Show Table').addToggle(toggle => toggle.setValue(this.plugin.settings.showTable).onChange(async (value) => { this.plugin.settings.showTable = value; await this.plugin.saveSettings(); }));
		new Setting(containerEl).setName('Show Code buttons').addToggle(toggle => toggle.setValue(this.plugin.settings.showCode).onChange(async (value) => { this.plugin.settings.showCode = value; await this.plugin.saveSettings(); }));
		new Setting(containerEl).setName('Show Callout').addToggle(toggle => toggle.setValue(this.plugin.settings.showCallout).onChange(async (value) => { this.plugin.settings.showCallout = value; await this.plugin.saveSettings(); }));
		new Setting(containerEl).setName('Show Scripture').addToggle(toggle => toggle.setValue(this.plugin.settings.showScripture).onChange(async (value) => { this.plugin.settings.showScripture = value; await this.plugin.saveSettings(); }));

		// Scripture Settings
		containerEl.createEl('h3', { text: 'Scripture Settings' });

		new Setting(containerEl)
			.setName('Default translation')
			.setDesc('Default Bible translation for scripture blocks')
			.addDropdown(dropdown => dropdown
				.addOption('ESV', 'ESV - English Standard Version')
				.addOption('NIV', 'NIV - New International Version')
				.addOption('KJV', 'KJV - King James Version')
				.addOption('NASB', 'NASB - New American Standard Bible')
				.addOption('NLT', 'NLT - New Living Translation')
				.addOption('CSB', 'CSB - Christian Standard Bible')
				.addOption('NKJV', 'NKJV - New King James Version')
				.addOption('RSV', 'RSV - Revised Standard Version')
				.setValue(this.plugin.settings.scriptureTranslation)
				.onChange(async (value) => {
					this.plugin.settings.scriptureTranslation = value;
					await this.plugin.saveSettings();
				}));
	}
}
