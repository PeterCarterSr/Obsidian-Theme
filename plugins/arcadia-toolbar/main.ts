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
	// Structure
	showHeadings: boolean;
	showLists: boolean;
	showChecklist: boolean;
	showBlockquote: boolean;
	showIndent: boolean;
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
	// Structure
	showHeadings: true,
	showLists: true,
	showChecklist: true,
	showBlockquote: true,
	showIndent: true,
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
	scriptureTranslation: 'ESV'
};

interface ToolbarButton {
	id: string;
	icon: string;
	tooltip: string;
	action: (editor: Editor) => void;
	settingKey?: keyof ArcadiaToolbarSettings;
}

export default class ArcadiaToolbarPlugin extends Plugin {
	settings: ArcadiaToolbarSettings;
	toolbarEl: HTMLElement | null = null;

	async onload() {
		await this.loadSettings();

		// Register editor extension for toolbar
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

		// Add all commands for keyboard shortcuts
		this.registerCommands();

		// Add settings tab
		this.addSettingTab(new ArcadiaToolbarSettingTab(this.app, this));

		// Initial toolbar setup
		this.app.workspace.onLayoutReady(() => {
			this.updateToolbar();
		});
	}

	registerCommands() {
		// Undo/Redo
		this.addCommand({
			id: 'undo',
			name: 'Undo',
			editorCallback: (editor: Editor) => this.undo(editor)
		});

		this.addCommand({
			id: 'redo',
			name: 'Redo',
			editorCallback: (editor: Editor) => this.redo(editor)
		});

		// Text formatting
		this.addCommand({
			id: 'toggle-bold',
			name: 'Toggle Bold',
			editorCallback: (editor: Editor) => this.toggleBold(editor)
		});

		this.addCommand({
			id: 'toggle-italic',
			name: 'Toggle Italic',
			editorCallback: (editor: Editor) => this.toggleItalic(editor)
		});

		this.addCommand({
			id: 'toggle-underline',
			name: 'Toggle Underline',
			editorCallback: (editor: Editor) => this.toggleUnderline(editor)
		});

		this.addCommand({
			id: 'toggle-strikethrough',
			name: 'Toggle Strikethrough',
			editorCallback: (editor: Editor) => this.toggleStrikethrough(editor)
		});

		this.addCommand({
			id: 'toggle-highlight',
			name: 'Toggle Highlight',
			editorCallback: (editor: Editor) => this.toggleHighlight(editor)
		});

		this.addCommand({
			id: 'toggle-subscript',
			name: 'Toggle Subscript',
			editorCallback: (editor: Editor) => this.toggleSubscript(editor)
		});

		this.addCommand({
			id: 'toggle-superscript',
			name: 'Toggle Superscript',
			editorCallback: (editor: Editor) => this.toggleSuperscript(editor)
		});

		this.addCommand({
			id: 'clear-formatting',
			name: 'Clear Formatting',
			editorCallback: (editor: Editor) => this.clearFormatting(editor)
		});

		// Headings
		this.addCommand({
			id: 'insert-heading-1',
			name: 'Insert Heading 1',
			editorCallback: (editor: Editor) => this.insertHeading(editor, 1)
		});

		this.addCommand({
			id: 'insert-heading-2',
			name: 'Insert Heading 2',
			editorCallback: (editor: Editor) => this.insertHeading(editor, 2)
		});

		this.addCommand({
			id: 'insert-heading-3',
			name: 'Insert Heading 3',
			editorCallback: (editor: Editor) => this.insertHeading(editor, 3)
		});

		this.addCommand({
			id: 'insert-heading-4',
			name: 'Insert Heading 4',
			editorCallback: (editor: Editor) => this.insertHeading(editor, 4)
		});

		this.addCommand({
			id: 'insert-heading-5',
			name: 'Insert Heading 5',
			editorCallback: (editor: Editor) => this.insertHeading(editor, 5)
		});

		this.addCommand({
			id: 'insert-heading-6',
			name: 'Insert Heading 6',
			editorCallback: (editor: Editor) => this.insertHeading(editor, 6)
		});

		// Lists
		this.addCommand({
			id: 'toggle-bullet-list',
			name: 'Toggle Bullet List',
			editorCallback: (editor: Editor) => this.toggleBulletList(editor)
		});

		this.addCommand({
			id: 'toggle-numbered-list',
			name: 'Toggle Numbered List',
			editorCallback: (editor: Editor) => this.toggleNumberedList(editor)
		});

		this.addCommand({
			id: 'toggle-checklist',
			name: 'Toggle Checklist',
			editorCallback: (editor: Editor) => this.toggleChecklist(editor)
		});

		this.addCommand({
			id: 'toggle-blockquote',
			name: 'Toggle Blockquote',
			editorCallback: (editor: Editor) => this.toggleBlockquote(editor)
		});

		// Indentation
		this.addCommand({
			id: 'indent',
			name: 'Indent',
			editorCallback: (editor: Editor) => this.indent(editor)
		});

		this.addCommand({
			id: 'outdent',
			name: 'Outdent',
			editorCallback: (editor: Editor) => this.outdent(editor)
		});

		// Insert elements
		this.addCommand({
			id: 'insert-horizontal-rule',
			name: 'Insert Horizontal Rule',
			editorCallback: (editor: Editor) => this.insertHorizontalRule(editor)
		});

		this.addCommand({
			id: 'insert-link',
			name: 'Insert Link',
			editorCallback: (editor: Editor) => this.insertLink(editor)
		});

		this.addCommand({
			id: 'insert-image',
			name: 'Insert Image',
			editorCallback: (editor: Editor) => this.insertImage(editor)
		});

		this.addCommand({
			id: 'insert-table',
			name: 'Insert Table',
			editorCallback: (editor: Editor) => this.insertTable(editor)
		});

		this.addCommand({
			id: 'toggle-inline-code',
			name: 'Toggle Inline Code',
			editorCallback: (editor: Editor) => this.toggleInlineCode(editor)
		});

		this.addCommand({
			id: 'insert-code-block',
			name: 'Insert Code Block',
			editorCallback: (editor: Editor) => this.insertCodeBlock(editor)
		});

		this.addCommand({
			id: 'insert-callout',
			name: 'Insert Callout',
			editorCallback: (editor: Editor) => this.insertCallout(editor)
		});

		this.addCommand({
			id: 'insert-scripture-block',
			name: 'Insert Scripture Block',
			editorCallback: (editor: Editor) => this.insertScriptureBlock(editor)
		});
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

	updateToolbar() {
		this.removeToolbar();

		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!activeView) return;

		const editorEl = activeView.containerEl.querySelector('.cm-editor');
		if (!editorEl) return;

		// Create toolbar using standard DOM methods
		this.toolbarEl = document.createElement('div');
		this.toolbarEl.className = 'arcadia-toolbar';

		// Define toolbar buttons
		const buttons: ToolbarButton[] = [
			// Undo/Redo
			{
				id: 'undo',
				icon: 'undo',
				tooltip: 'Undo (Ctrl/Cmd+Z)',
				action: (editor) => this.undo(editor),
				settingKey: 'showUndo'
			},
			{
				id: 'redo',
				icon: 'redo',
				tooltip: 'Redo (Ctrl/Cmd+Y)',
				action: (editor) => this.redo(editor),
				settingKey: 'showUndo'
			},
			{ id: 'separator-0', icon: '', tooltip: '', action: () => {} },

			// Text Formatting
			{
				id: 'bold',
				icon: 'bold',
				tooltip: 'Bold (Ctrl/Cmd+B)',
				action: (editor) => this.toggleBold(editor),
				settingKey: 'showBold'
			},
			{
				id: 'italic',
				icon: 'italic',
				tooltip: 'Italic (Ctrl/Cmd+I)',
				action: (editor) => this.toggleItalic(editor),
				settingKey: 'showItalic'
			},
			{
				id: 'underline',
				icon: 'underline',
				tooltip: 'Underline (Ctrl/Cmd+U)',
				action: (editor) => this.toggleUnderline(editor),
				settingKey: 'showUnderline'
			},
			{
				id: 'strikethrough',
				icon: 'strikethrough',
				tooltip: 'Strikethrough',
				action: (editor) => this.toggleStrikethrough(editor),
				settingKey: 'showStrikethrough'
			},
			{
				id: 'highlight',
				icon: 'highlighter',
				tooltip: 'Highlight',
				action: (editor) => this.toggleHighlight(editor),
				settingKey: 'showHighlight'
			},
			{
				id: 'subscript',
				icon: 'subscript',
				tooltip: 'Subscript',
				action: (editor) => this.toggleSubscript(editor),
				settingKey: 'showSubscript'
			},
			{
				id: 'superscript',
				icon: 'superscript',
				tooltip: 'Superscript',
				action: (editor) => this.toggleSuperscript(editor),
				settingKey: 'showSuperscript'
			},
			{
				id: 'clear-formatting',
				icon: 'eraser',
				tooltip: 'Clear Formatting',
				action: (editor) => this.clearFormatting(editor),
				settingKey: 'showClearFormatting'
			},
			{ id: 'separator-1', icon: '', tooltip: '', action: () => {} },

			// Headings
			{
				id: 'heading-1',
				icon: 'heading-1',
				tooltip: 'Heading 1',
				action: (editor) => this.insertHeading(editor, 1),
				settingKey: 'showHeadings'
			},
			{
				id: 'heading-2',
				icon: 'heading-2',
				tooltip: 'Heading 2',
				action: (editor) => this.insertHeading(editor, 2),
				settingKey: 'showHeadings'
			},
			{
				id: 'heading-3',
				icon: 'heading-3',
				tooltip: 'Heading 3',
				action: (editor) => this.insertHeading(editor, 3),
				settingKey: 'showHeadings'
			},
			{
				id: 'heading-4',
				icon: 'heading-4',
				tooltip: 'Heading 4',
				action: (editor) => this.insertHeading(editor, 4),
				settingKey: 'showHeadings'
			},
			{
				id: 'heading-5',
				icon: 'heading-5',
				tooltip: 'Heading 5',
				action: (editor) => this.insertHeading(editor, 5),
				settingKey: 'showHeadings'
			},
			{
				id: 'heading-6',
				icon: 'heading-6',
				tooltip: 'Heading 6',
				action: (editor) => this.insertHeading(editor, 6),
				settingKey: 'showHeadings'
			},
			{ id: 'separator-2', icon: '', tooltip: '', action: () => {} },

			// Lists & Structure
			{
				id: 'bullet-list',
				icon: 'list',
				tooltip: 'Bullet List',
				action: (editor) => this.toggleBulletList(editor),
				settingKey: 'showLists'
			},
			{
				id: 'numbered-list',
				icon: 'list-ordered',
				tooltip: 'Numbered List',
				action: (editor) => this.toggleNumberedList(editor),
				settingKey: 'showLists'
			},
			{
				id: 'checklist',
				icon: 'list-checks',
				tooltip: 'Checklist / Task List',
				action: (editor) => this.toggleChecklist(editor),
				settingKey: 'showChecklist'
			},
			{
				id: 'blockquote',
				icon: 'quote',
				tooltip: 'Blockquote',
				action: (editor) => this.toggleBlockquote(editor),
				settingKey: 'showBlockquote'
			},
			{ id: 'separator-3', icon: '', tooltip: '', action: () => {} },

			// Indentation
			{
				id: 'outdent',
				icon: 'outdent',
				tooltip: 'Decrease Indent',
				action: (editor) => this.outdent(editor),
				settingKey: 'showIndent'
			},
			{
				id: 'indent',
				icon: 'indent',
				tooltip: 'Increase Indent',
				action: (editor) => this.indent(editor),
				settingKey: 'showIndent'
			},
			{ id: 'separator-4', icon: '', tooltip: '', action: () => {} },

			// Insert Elements
			{
				id: 'horizontal-rule',
				icon: 'minus',
				tooltip: 'Horizontal Rule',
				action: (editor) => this.insertHorizontalRule(editor),
				settingKey: 'showHorizontalRule'
			},
			{
				id: 'link',
				icon: 'link',
				tooltip: 'Insert Link',
				action: (editor) => this.insertLink(editor),
				settingKey: 'showLink'
			},
			{
				id: 'image',
				icon: 'image',
				tooltip: 'Insert Image',
				action: (editor) => this.insertImage(editor),
				settingKey: 'showImage'
			},
			{
				id: 'table',
				icon: 'table',
				tooltip: 'Insert Table',
				action: (editor) => this.insertTable(editor),
				settingKey: 'showTable'
			},
			{
				id: 'inline-code',
				icon: 'code',
				tooltip: 'Inline Code',
				action: (editor) => this.toggleInlineCode(editor),
				settingKey: 'showCode'
			},
			{
				id: 'code-block',
				icon: 'file-code',
				tooltip: 'Code Block',
				action: (editor) => this.insertCodeBlock(editor),
				settingKey: 'showCode'
			},
			{ id: 'separator-5', icon: '', tooltip: '', action: () => {} },

			// Callouts
			{
				id: 'callout',
				icon: 'message-square',
				tooltip: 'Insert Callout',
				action: (editor) => this.insertCallout(editor),
				settingKey: 'showCallout'
			},
			{
				id: 'scripture',
				icon: 'book-open',
				tooltip: 'Insert Scripture Block',
				action: (editor) => this.insertScriptureBlock(editor),
				settingKey: 'showScripture'
			}
		];

		// Create buttons
		for (const btn of buttons) {
			if (btn.id.startsWith('separator')) {
				const separator = document.createElement('div');
				separator.className = 'arcadia-toolbar-separator';
				this.toolbarEl.appendChild(separator);
				continue;
			}

			// Check if button should be shown based on settings
			if (btn.settingKey && !this.settings[btn.settingKey]) {
				continue;
			}

			const buttonEl = document.createElement('button');
			buttonEl.className = 'arcadia-toolbar-button';
			buttonEl.setAttribute('aria-label', btn.tooltip);
			buttonEl.setAttribute('title', btn.tooltip);
			setIcon(buttonEl, btn.icon);

			buttonEl.addEventListener('click', (e) => {
				e.preventDefault();
				const editor = activeView.editor;
				if (editor) {
					btn.action(editor);
				}
			});

			this.toolbarEl.appendChild(buttonEl);
		}

		// Insert toolbar into DOM
		const cmScroller = editorEl.querySelector('.cm-scroller');
		if (cmScroller && this.settings.toolbarPosition === 'top') {
			editorEl.insertBefore(this.toolbarEl, cmScroller);
		} else if (cmScroller) {
			editorEl.appendChild(this.toolbarEl);
		}
	}

	// === Undo/Redo ===

	undo(editor: Editor) {
		// @ts-ignore - undo exists on Editor
		editor.undo();
	}

	redo(editor: Editor) {
		// @ts-ignore - redo exists on Editor
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
			// Remove common markdown formatting
			let cleaned = selection
				.replace(/\*\*(.+?)\*\*/g, '$1')  // bold
				.replace(/\*(.+?)\*/g, '$1')       // italic
				.replace(/~~(.+?)~~/g, '$1')       // strikethrough
				.replace(/==(.+?)==/g, '$1')       // highlight
				.replace(/`(.+?)`/g, '$1')         // inline code
				.replace(/<u>(.+?)<\/u>/g, '$1')   // underline
				.replace(/<sub>(.+?)<\/sub>/g, '$1') // subscript
				.replace(/<sup>(.+?)<\/sup>/g, '$1') // superscript
				.replace(/<mark>(.+?)<\/mark>/g, '$1'); // mark
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
			// Unchecked -> checked
			editor.setLine(cursor.line, line.replace(/^(\s*)- \[ \] /, '$1- [x] '));
		} else if (line.match(/^(\s*)- \[x\] /i)) {
			// Checked -> remove checkbox
			editor.setLine(cursor.line, line.replace(/^(\s*)- \[x\] /i, '$1'));
		} else if (line.match(/^(\s*)- /)) {
			// Bullet -> checkbox
			editor.setLine(cursor.line, line.replace(/^(\s*)- /, '$1- [ ] '));
		} else if (line.match(/^(\s*)\d+\. /)) {
			// Numbered -> checkbox
			editor.setLine(cursor.line, line.replace(/^(\s*)\d+\. /, '$1- [ ] '));
		} else {
			// Plain text -> checkbox
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

		new Setting(containerEl)
			.setName('Show Undo/Redo')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showUndo)
				.onChange(async (value) => {
					this.plugin.settings.showUndo = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Show Bold')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showBold)
				.onChange(async (value) => {
					this.plugin.settings.showBold = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Show Italic')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showItalic)
				.onChange(async (value) => {
					this.plugin.settings.showItalic = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Show Underline')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showUnderline)
				.onChange(async (value) => {
					this.plugin.settings.showUnderline = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Show Strikethrough')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showStrikethrough)
				.onChange(async (value) => {
					this.plugin.settings.showStrikethrough = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Show Highlight')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showHighlight)
				.onChange(async (value) => {
					this.plugin.settings.showHighlight = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Show Subscript/Superscript')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showSubscript)
				.onChange(async (value) => {
					this.plugin.settings.showSubscript = value;
					this.plugin.settings.showSuperscript = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Show Clear Formatting')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showClearFormatting)
				.onChange(async (value) => {
					this.plugin.settings.showClearFormatting = value;
					await this.plugin.saveSettings();
				}));

		// Structure
		containerEl.createEl('h3', { text: 'Structure' });

		new Setting(containerEl)
			.setName('Show Heading buttons')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showHeadings)
				.onChange(async (value) => {
					this.plugin.settings.showHeadings = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Show List buttons')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showLists)
				.onChange(async (value) => {
					this.plugin.settings.showLists = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Show Checklist button')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showChecklist)
				.onChange(async (value) => {
					this.plugin.settings.showChecklist = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Show Blockquote')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showBlockquote)
				.onChange(async (value) => {
					this.plugin.settings.showBlockquote = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Show Indent/Outdent')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showIndent)
				.onChange(async (value) => {
					this.plugin.settings.showIndent = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Show Horizontal Rule')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showHorizontalRule)
				.onChange(async (value) => {
					this.plugin.settings.showHorizontalRule = value;
					await this.plugin.saveSettings();
				}));

		// Insert Elements
		containerEl.createEl('h3', { text: 'Insert Elements' });

		new Setting(containerEl)
			.setName('Show Link')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showLink)
				.onChange(async (value) => {
					this.plugin.settings.showLink = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Show Image')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showImage)
				.onChange(async (value) => {
					this.plugin.settings.showImage = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Show Table')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showTable)
				.onChange(async (value) => {
					this.plugin.settings.showTable = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Show Code buttons')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showCode)
				.onChange(async (value) => {
					this.plugin.settings.showCode = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Show Callout')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showCallout)
				.onChange(async (value) => {
					this.plugin.settings.showCallout = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Show Scripture')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showScripture)
				.onChange(async (value) => {
					this.plugin.settings.showScripture = value;
					await this.plugin.saveSettings();
				}));

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
