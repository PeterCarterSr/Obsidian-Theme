import {
	App,
	Editor,
	EditorPosition,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	TFile,
	WorkspaceLeaf,
	setIcon,
	debounce
} from 'obsidian';

import {
	StateField,
	StateEffect,
	RangeSetBuilder,
	EditorState
} from '@codemirror/state';

import {
	Decoration,
	DecorationSet,
	EditorView,
	WidgetType,
	ViewPlugin,
	ViewUpdate
} from '@codemirror/view';

// ============================================================================
// INTERFACES & TYPES
// ============================================================================

interface Comment {
	id: string;
	text: string;
	author: string;
	createdAt: string;
	updatedAt: string;
	resolved: boolean;
	startOffset: number;
	endOffset: number;
	replies: CommentReply[];
}

interface CommentReply {
	id: string;
	text: string;
	author: string;
	createdAt: string;
}

interface DocumentAnnotations {
	version: string;
	comments: Comment[];
	trackChanges?: TrackChange[];
}

interface TrackChange {
	id: string;
	type: 'insert' | 'delete' | 'replace';
	originalText: string;
	newText: string;
	author: string;
	createdAt: string;
	startOffset: number;
	endOffset: number;
	accepted: boolean | null;
}

interface WordCountStats {
	words: number;
	characters: number;
	charactersNoSpaces: number;
	sentences: number;
	paragraphs: number;
	readingTime: number;
}

interface ArcadiaAuthorSettings {
	// Feature Flags
	enableComments: boolean;
	enableTrackChanges: boolean;
	enableWordCount: boolean;
	enableAutoNumbering: boolean;
	enableTOC: boolean;

	// Comments Settings
	defaultAuthor: string;
	showResolvedComments: boolean;
	commentHighlightColor: string;

	// Word Count Settings
	showWordCount: boolean;
	showCharacterCount: boolean;
	showReadingTime: boolean;
	wordsPerMinute: number;
	wordCountPosition: 'statusbar' | 'toolbar';

	// Track Changes Settings
	trackChangesAuthor: string;
	showInsertions: boolean;
	showDeletions: boolean;
}

const DEFAULT_SETTINGS: ArcadiaAuthorSettings = {
	// Feature Flags
	enableComments: true,
	enableTrackChanges: false,
	enableWordCount: true,
	enableAutoNumbering: false,
	enableTOC: false,

	// Comments Settings
	defaultAuthor: 'Author',
	showResolvedComments: false,
	commentHighlightColor: '#fef08a',

	// Word Count Settings
	showWordCount: true,
	showCharacterCount: true,
	showReadingTime: true,
	wordsPerMinute: 200,
	wordCountPosition: 'statusbar',

	// Track Changes Settings
	trackChangesAuthor: 'Author',
	showInsertions: true,
	showDeletions: true
};

// ============================================================================
// MAIN PLUGIN CLASS
// ============================================================================

export default class ArcadiaAuthorPlugin extends Plugin {
	settings: ArcadiaAuthorSettings;
	private statusBarItem: HTMLElement | null = null;
	private authorToolbarEl: HTMLElement | null = null;
	private commentsPanelEl: HTMLElement | null = null;
	private currentAnnotations: Map<string, DocumentAnnotations> = new Map();

	async onload() {
		await this.loadSettings();

		// Initialize status bar for word count
		if (this.settings.enableWordCount && this.settings.wordCountPosition === 'statusbar') {
			this.statusBarItem = this.addStatusBarItem();
			this.statusBarItem.addClass('arcadia-word-count');
		}

		// Register events
		this.registerEvent(
			this.app.workspace.on('active-leaf-change', (leaf) => {
				this.onActiveLeafChange(leaf);
			})
		);

		this.registerEvent(
			this.app.workspace.on('editor-change', debounce((editor: Editor) => {
				this.updateWordCount(editor);
			}, 300, true))
		);

		this.registerEvent(
			this.app.workspace.on('layout-change', () => {
				this.updateAuthorToolbar();
			})
		);

		// Register commands
		this.registerCommands();

		// Add settings tab
		this.addSettingTab(new ArcadiaAuthorSettingTab(this.app, this));

		// Initialize on layout ready
		this.app.workspace.onLayoutReady(() => {
			this.updateAuthorToolbar();
			const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (activeView?.editor) {
				this.updateWordCount(activeView.editor);
			}
		});
	}

	onunload() {
		this.removeAuthorToolbar();
		if (this.commentsPanelEl) {
			this.commentsPanelEl.remove();
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	// ============================================================================
	// COMMANDS REGISTRATION
	// ============================================================================

	private registerCommands() {
		// Comment commands
		if (this.settings.enableComments) {
			this.addCommand({
				id: 'add-comment',
				name: 'Add Comment',
				icon: 'message-square-plus',
				editorCallback: (editor: Editor, view: MarkdownView) => {
					this.addComment(editor, view);
				}
			});

			this.addCommand({
				id: 'toggle-comments-panel',
				name: 'Toggle Comments Panel',
				icon: 'message-square',
				callback: () => {
					this.toggleCommentsPanel();
				}
			});

			this.addCommand({
				id: 'resolve-all-comments',
				name: 'Resolve All Comments',
				icon: 'check-check',
				callback: () => {
					this.resolveAllComments();
				}
			});
		}

		// Word count command
		this.addCommand({
			id: 'show-document-statistics',
			name: 'Show Document Statistics',
			icon: 'bar-chart-2',
			callback: () => {
				this.showDocumentStatistics();
			}
		});

		// Export commands (Phase 3 placeholder)
		this.addCommand({
			id: 'export-clean-markdown',
			name: 'Export Clean Markdown (without annotations)',
			icon: 'file-text',
			callback: () => {
				this.exportCleanMarkdown();
			}
		});
	}

	// ============================================================================
	// EVENT HANDLERS
	// ============================================================================

	private onActiveLeafChange(leaf: WorkspaceLeaf | null) {
		this.updateAuthorToolbar();

		if (leaf) {
			const view = leaf.view;
			if (view instanceof MarkdownView) {
				this.loadAnnotationsForFile(view.file);
				this.updateWordCount(view.editor);
			}
		}
	}

	// ============================================================================
	// AUTHOR TOOLBAR (docked below Arcadia Toolbar)
	// ============================================================================

	private removeAuthorToolbar() {
		if (this.authorToolbarEl) {
			this.authorToolbarEl.remove();
			this.authorToolbarEl = null;
		}
	}

	private updateAuthorToolbar() {
		this.removeAuthorToolbar();

		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!activeView) return;

		const editorEl = activeView.containerEl.querySelector('.cm-editor');
		if (!editorEl) return;

		// Create author toolbar
		this.authorToolbarEl = createEl('div', { cls: 'arcadia-author-toolbar' });

		// Comments section
		if (this.settings.enableComments) {
			const commentBtn = this.createToolbarButton('message-square-plus', 'Add Comment', () => {
				this.addComment(activeView.editor, activeView);
			});
			this.authorToolbarEl.appendChild(commentBtn);

			const togglePanelBtn = this.createToolbarButton('message-square', 'Toggle Comments Panel', () => {
				this.toggleCommentsPanel();
			});
			this.authorToolbarEl.appendChild(togglePanelBtn);
		}

		// Separator
		if (this.settings.enableComments && this.settings.enableTrackChanges) {
			this.authorToolbarEl.appendChild(createEl('div', { cls: 'arcadia-author-separator' }));
		}

		// Track Changes section (Phase 2)
		if (this.settings.enableTrackChanges) {
			const trackBtn = this.createToolbarButton('git-compare', 'Track Changes', () => {
				new Notice('Track Changes feature coming in Phase 2');
			});
			trackBtn.addClass('is-disabled');
			this.authorToolbarEl.appendChild(trackBtn);
		}

		// Separator
		this.authorToolbarEl.appendChild(createEl('div', { cls: 'arcadia-author-separator' }));

		// Statistics button
		const statsBtn = this.createToolbarButton('bar-chart-2', 'Document Statistics', () => {
			this.showDocumentStatistics();
		});
		this.authorToolbarEl.appendChild(statsBtn);

		// TOC button (Phase 2)
		if (this.settings.enableTOC) {
			const tocBtn = this.createToolbarButton('list-tree', 'Table of Contents', () => {
				new Notice('Table of Contents feature coming in Phase 2');
			});
			tocBtn.addClass('is-disabled');
			this.authorToolbarEl.appendChild(tocBtn);
		}

		// Insert toolbar after arcadia-toolbar or at top of editor
		const arcadiaToolbar = editorEl.querySelector('.arcadia-toolbar');
		const cmScroller = editorEl.querySelector('.cm-scroller');

		if (arcadiaToolbar) {
			arcadiaToolbar.insertAdjacentElement('afterend', this.authorToolbarEl);
		} else if (cmScroller) {
			editorEl.insertBefore(this.authorToolbarEl, cmScroller);
		}
	}

	private createToolbarButton(icon: string, tooltip: string, onClick: () => void): HTMLElement {
		const btn = createEl('button', {
			cls: 'arcadia-author-button',
			attr: { 'aria-label': tooltip, title: tooltip }
		});
		setIcon(btn, icon);
		btn.addEventListener('click', (e) => {
			e.preventDefault();
			onClick();
		});
		return btn;
	}

	// ============================================================================
	// SIDECAR JSON ANNOTATIONS SYSTEM
	// ============================================================================

	private getAnnotationsPath(file: TFile | null): string | null {
		if (!file) return null;
		const basePath = file.path.replace(/\.md$/, '');
		return `${basePath}.arcadia.json`;
	}

	private async loadAnnotationsForFile(file: TFile | null) {
		if (!file) return;

		const annotationsPath = this.getAnnotationsPath(file);
		if (!annotationsPath) return;

		try {
			const annotationsFile = this.app.vault.getAbstractFileByPath(annotationsPath);
			if (annotationsFile instanceof TFile) {
				const content = await this.app.vault.read(annotationsFile);
				const annotations: DocumentAnnotations = JSON.parse(content);
				this.currentAnnotations.set(file.path, annotations);
			} else {
				// No annotations file exists yet
				this.currentAnnotations.set(file.path, {
					version: '1.0.0',
					comments: [],
					trackChanges: []
				});
			}
		} catch (error) {
			console.error('Error loading annotations:', error);
			this.currentAnnotations.set(file.path, {
				version: '1.0.0',
				comments: [],
				trackChanges: []
			});
		}
	}

	private async saveAnnotationsForFile(file: TFile | null) {
		if (!file) return;

		const annotationsPath = this.getAnnotationsPath(file);
		if (!annotationsPath) return;

		const annotations = this.currentAnnotations.get(file.path);
		if (!annotations) return;

		try {
			const content = JSON.stringify(annotations, null, 2);
			const existingFile = this.app.vault.getAbstractFileByPath(annotationsPath);

			if (existingFile instanceof TFile) {
				await this.app.vault.modify(existingFile, content);
			} else {
				await this.app.vault.create(annotationsPath, content);
			}
		} catch (error) {
			console.error('Error saving annotations:', error);
			new Notice('Failed to save annotations');
		}
	}

	// ============================================================================
	// COMMENTS SYSTEM
	// ============================================================================

	private addComment(editor: Editor, view: MarkdownView) {
		const selection = editor.getSelection();
		if (!selection) {
			new Notice('Please select text to add a comment');
			return;
		}

		const file = view.file;
		if (!file) return;

		new AddCommentModal(this.app, selection, this.settings.defaultAuthor, async (commentText, author) => {
			const from = editor.getCursor('from');
			const to = editor.getCursor('to');

			// Calculate offsets
			const startOffset = editor.posToOffset(from);
			const endOffset = editor.posToOffset(to);

			const comment: Comment = {
				id: this.generateId(),
				text: commentText,
				author: author,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				resolved: false,
				startOffset: startOffset,
				endOffset: endOffset,
				replies: []
			};

			// Add to annotations
			const annotations = this.currentAnnotations.get(file.path);
			if (annotations) {
				annotations.comments.push(comment);
				await this.saveAnnotationsForFile(file);
				new Notice('Comment added');
				this.updateCommentsPanel();
			}
		}).open();
	}

	private toggleCommentsPanel() {
		if (this.commentsPanelEl && this.commentsPanelEl.isShown()) {
			this.commentsPanelEl.hide();
		} else {
			this.showCommentsPanel();
		}
	}

	private showCommentsPanel() {
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!activeView?.file) {
			new Notice('No active document');
			return;
		}

		if (!this.commentsPanelEl) {
			this.commentsPanelEl = createEl('div', { cls: 'arcadia-comments-panel' });
			document.body.appendChild(this.commentsPanelEl);
		}

		this.updateCommentsPanel();
		this.commentsPanelEl.show();
	}

	private updateCommentsPanel() {
		if (!this.commentsPanelEl) return;

		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!activeView?.file) return;

		const annotations = this.currentAnnotations.get(activeView.file.path);
		if (!annotations) return;

		this.commentsPanelEl.empty();

		// Header
		const header = this.commentsPanelEl.createEl('div', { cls: 'arcadia-comments-header' });
		header.createEl('h3', { text: 'Comments' });

		const closeBtn = header.createEl('button', { cls: 'arcadia-comments-close' });
		setIcon(closeBtn, 'x');
		closeBtn.addEventListener('click', () => this.commentsPanelEl?.hide());

		// Comments list
		const list = this.commentsPanelEl.createEl('div', { cls: 'arcadia-comments-list' });

		const visibleComments = annotations.comments.filter(c =>
			this.settings.showResolvedComments || !c.resolved
		);

		if (visibleComments.length === 0) {
			list.createEl('p', {
				text: 'No comments yet. Select text and click "Add Comment" to create one.',
				cls: 'arcadia-comments-empty'
			});
		} else {
			visibleComments.forEach(comment => {
				const commentEl = this.createCommentElement(comment, activeView.file!);
				list.appendChild(commentEl);
			});
		}
	}

	private createCommentElement(comment: Comment, file: TFile): HTMLElement {
		const el = createEl('div', { cls: 'arcadia-comment' });
		if (comment.resolved) {
			el.addClass('is-resolved');
		}

		// Comment header
		const headerEl = el.createEl('div', { cls: 'arcadia-comment-header' });
		headerEl.createEl('span', { text: comment.author, cls: 'arcadia-comment-author' });
		headerEl.createEl('span', {
			text: new Date(comment.createdAt).toLocaleDateString(),
			cls: 'arcadia-comment-date'
		});

		// Comment text
		el.createEl('p', { text: comment.text, cls: 'arcadia-comment-text' });

		// Actions
		const actionsEl = el.createEl('div', { cls: 'arcadia-comment-actions' });

		const resolveBtn = actionsEl.createEl('button', {
			text: comment.resolved ? 'Unresolve' : 'Resolve',
			cls: 'arcadia-comment-action'
		});
		resolveBtn.addEventListener('click', async () => {
			comment.resolved = !comment.resolved;
			comment.updatedAt = new Date().toISOString();
			await this.saveAnnotationsForFile(file);
			this.updateCommentsPanel();
		});

		const deleteBtn = actionsEl.createEl('button', {
			text: 'Delete',
			cls: 'arcadia-comment-action arcadia-comment-delete'
		});
		deleteBtn.addEventListener('click', async () => {
			const annotations = this.currentAnnotations.get(file.path);
			if (annotations) {
				annotations.comments = annotations.comments.filter(c => c.id !== comment.id);
				await this.saveAnnotationsForFile(file);
				this.updateCommentsPanel();
				new Notice('Comment deleted');
			}
		});

		// Replies
		if (comment.replies.length > 0) {
			const repliesEl = el.createEl('div', { cls: 'arcadia-comment-replies' });
			comment.replies.forEach(reply => {
				const replyEl = repliesEl.createEl('div', { cls: 'arcadia-comment-reply' });
				replyEl.createEl('span', { text: reply.author, cls: 'arcadia-comment-author' });
				replyEl.createEl('p', { text: reply.text });
			});
		}

		// Reply button
		const replyBtn = actionsEl.createEl('button', {
			text: 'Reply',
			cls: 'arcadia-comment-action'
		});
		replyBtn.addEventListener('click', () => {
			new AddReplyModal(this.app, this.settings.defaultAuthor, async (replyText, author) => {
				const reply: CommentReply = {
					id: this.generateId(),
					text: replyText,
					author: author,
					createdAt: new Date().toISOString()
				};
				comment.replies.push(reply);
				comment.updatedAt = new Date().toISOString();
				await this.saveAnnotationsForFile(file);
				this.updateCommentsPanel();
			}).open();
		});

		return el;
	}

	private async resolveAllComments() {
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!activeView?.file) {
			new Notice('No active document');
			return;
		}

		const annotations = this.currentAnnotations.get(activeView.file.path);
		if (!annotations || annotations.comments.length === 0) {
			new Notice('No comments to resolve');
			return;
		}

		annotations.comments.forEach(comment => {
			comment.resolved = true;
			comment.updatedAt = new Date().toISOString();
		});

		await this.saveAnnotationsForFile(activeView.file);
		this.updateCommentsPanel();
		new Notice('All comments resolved');
	}

	// ============================================================================
	// WORD COUNT SYSTEM
	// ============================================================================

	private calculateWordCount(text: string): WordCountStats {
		// Remove frontmatter
		const contentWithoutFrontmatter = text.replace(/^---[\s\S]*?---\n?/, '');

		// Remove markdown syntax for accurate counting
		const cleanText = contentWithoutFrontmatter
			.replace(/```[\s\S]*?```/g, '') // Remove code blocks
			.replace(/`[^`]+`/g, '') // Remove inline code
			.replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
			.replace(/\[([^\]]+)\]\(.*?\)/g, '$1') // Keep link text
			.replace(/[#*_~`>]/g, '') // Remove markdown symbols
			.replace(/\n/g, ' ') // Replace newlines with spaces
			.trim();

		const words = cleanText.split(/\s+/).filter(word => word.length > 0);
		const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 0);
		const paragraphs = contentWithoutFrontmatter.split(/\n\s*\n/).filter(p => p.trim().length > 0);

		return {
			words: words.length,
			characters: text.length,
			charactersNoSpaces: text.replace(/\s/g, '').length,
			sentences: sentences.length,
			paragraphs: paragraphs.length,
			readingTime: Math.ceil(words.length / this.settings.wordsPerMinute)
		};
	}

	private updateWordCount(editor: Editor) {
		if (!this.settings.enableWordCount) return;

		const text = editor.getValue();
		const stats = this.calculateWordCount(text);

		if (this.statusBarItem) {
			const parts: string[] = [];

			if (this.settings.showWordCount) {
				parts.push(`${stats.words} words`);
			}
			if (this.settings.showCharacterCount) {
				parts.push(`${stats.characters} chars`);
			}
			if (this.settings.showReadingTime) {
				parts.push(`${stats.readingTime} min read`);
			}

			this.statusBarItem.setText(parts.join(' | '));
		}
	}

	private showDocumentStatistics() {
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!activeView?.editor) {
			new Notice('No active document');
			return;
		}

		const text = activeView.editor.getValue();
		const stats = this.calculateWordCount(text);

		new DocumentStatisticsModal(this.app, stats).open();
	}

	// ============================================================================
	// EXPORT FUNCTIONS
	// ============================================================================

	private async exportCleanMarkdown() {
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!activeView?.file) {
			new Notice('No active document');
			return;
		}

		const content = activeView.editor.getValue();

		// For now, just copy to clipboard (Phase 3 will add file export)
		await navigator.clipboard.writeText(content);
		new Notice('Clean markdown copied to clipboard');
	}

	// ============================================================================
	// UTILITIES
	// ============================================================================

	private generateId(): string {
		return Date.now().toString(36) + Math.random().toString(36).substr(2);
	}
}

// ============================================================================
// MODALS
// ============================================================================

class AddCommentModal extends Modal {
	private selection: string;
	private defaultAuthor: string;
	private onSubmit: (text: string, author: string) => void;

	constructor(app: App, selection: string, defaultAuthor: string, onSubmit: (text: string, author: string) => void) {
		super(app);
		this.selection = selection;
		this.defaultAuthor = defaultAuthor;
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.addClass('arcadia-modal');

		contentEl.createEl('h2', { text: 'Add Comment' });

		// Show selected text
		const selectionEl = contentEl.createEl('div', { cls: 'arcadia-modal-selection' });
		selectionEl.createEl('label', { text: 'Selected text:' });
		selectionEl.createEl('blockquote', { text: this.selection });

		// Author input
		const authorSetting = new Setting(contentEl)
			.setName('Author')
			.addText(text => text
				.setValue(this.defaultAuthor)
				.setPlaceholder('Your name'));

		// Comment input
		let commentText = '';
		const commentSetting = new Setting(contentEl)
			.setName('Comment')
			.addTextArea(textarea => {
				textarea.setPlaceholder('Enter your comment...');
				textarea.inputEl.rows = 4;
				textarea.onChange(value => commentText = value);
			});

		// Buttons
		new Setting(contentEl)
			.addButton(btn => btn
				.setButtonText('Cancel')
				.onClick(() => this.close()))
			.addButton(btn => btn
				.setButtonText('Add Comment')
				.setCta()
				.onClick(() => {
					if (commentText.trim()) {
						const authorInput = authorSetting.controlEl.querySelector('input');
						const author = authorInput?.value || this.defaultAuthor;
						this.onSubmit(commentText.trim(), author);
						this.close();
					} else {
						new Notice('Please enter a comment');
					}
				}));
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class AddReplyModal extends Modal {
	private defaultAuthor: string;
	private onSubmit: (text: string, author: string) => void;

	constructor(app: App, defaultAuthor: string, onSubmit: (text: string, author: string) => void) {
		super(app);
		this.defaultAuthor = defaultAuthor;
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.addClass('arcadia-modal');

		contentEl.createEl('h2', { text: 'Add Reply' });

		// Author input
		const authorSetting = new Setting(contentEl)
			.setName('Author')
			.addText(text => text
				.setValue(this.defaultAuthor)
				.setPlaceholder('Your name'));

		// Reply input
		let replyText = '';
		new Setting(contentEl)
			.setName('Reply')
			.addTextArea(textarea => {
				textarea.setPlaceholder('Enter your reply...');
				textarea.inputEl.rows = 3;
				textarea.onChange(value => replyText = value);
			});

		// Buttons
		new Setting(contentEl)
			.addButton(btn => btn
				.setButtonText('Cancel')
				.onClick(() => this.close()))
			.addButton(btn => btn
				.setButtonText('Add Reply')
				.setCta()
				.onClick(() => {
					if (replyText.trim()) {
						const authorInput = authorSetting.controlEl.querySelector('input');
						const author = authorInput?.value || this.defaultAuthor;
						this.onSubmit(replyText.trim(), author);
						this.close();
					} else {
						new Notice('Please enter a reply');
					}
				}));
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class DocumentStatisticsModal extends Modal {
	private stats: WordCountStats;

	constructor(app: App, stats: WordCountStats) {
		super(app);
		this.stats = stats;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.addClass('arcadia-modal');

		contentEl.createEl('h2', { text: 'Document Statistics' });

		const statsGrid = contentEl.createEl('div', { cls: 'arcadia-stats-grid' });

		this.createStatItem(statsGrid, 'Words', this.stats.words.toLocaleString());
		this.createStatItem(statsGrid, 'Characters', this.stats.characters.toLocaleString());
		this.createStatItem(statsGrid, 'Characters (no spaces)', this.stats.charactersNoSpaces.toLocaleString());
		this.createStatItem(statsGrid, 'Sentences', this.stats.sentences.toLocaleString());
		this.createStatItem(statsGrid, 'Paragraphs', this.stats.paragraphs.toLocaleString());
		this.createStatItem(statsGrid, 'Reading Time', `${this.stats.readingTime} min`);

		new Setting(contentEl)
			.addButton(btn => btn
				.setButtonText('Close')
				.setCta()
				.onClick(() => this.close()));
	}

	private createStatItem(container: HTMLElement, label: string, value: string) {
		const item = container.createEl('div', { cls: 'arcadia-stat-item' });
		item.createEl('div', { text: value, cls: 'arcadia-stat-value' });
		item.createEl('div', { text: label, cls: 'arcadia-stat-label' });
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

// ============================================================================
// SETTINGS TAB
// ============================================================================

class ArcadiaAuthorSettingTab extends PluginSettingTab {
	plugin: ArcadiaAuthorPlugin;

	constructor(app: App, plugin: ArcadiaAuthorPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: 'Arcadia Author Settings' });

		// Feature Flags Section
		containerEl.createEl('h3', { text: 'Features' });

		new Setting(containerEl)
			.setName('Enable Comments')
			.setDesc('Allow adding inline comments and annotations to documents')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableComments)
				.onChange(async (value) => {
					this.plugin.settings.enableComments = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Enable Track Changes')
			.setDesc('Track insertions and deletions (Phase 2 feature)')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableTrackChanges)
				.setDisabled(true)
				.onChange(async (value) => {
					this.plugin.settings.enableTrackChanges = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Enable Word Count')
			.setDesc('Show word count and reading statistics')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableWordCount)
				.onChange(async (value) => {
					this.plugin.settings.enableWordCount = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Enable Auto-Numbering')
			.setDesc('Automatically number headings (Phase 2 feature)')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableAutoNumbering)
				.setDisabled(true)
				.onChange(async (value) => {
					this.plugin.settings.enableAutoNumbering = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Enable Table of Contents')
			.setDesc('Generate table of contents (Phase 2 feature)')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableTOC)
				.setDisabled(true)
				.onChange(async (value) => {
					this.plugin.settings.enableTOC = value;
					await this.plugin.saveSettings();
				}));

		// Comments Section
		containerEl.createEl('h3', { text: 'Comments' });

		new Setting(containerEl)
			.setName('Default Author')
			.setDesc('Your name for comments')
			.addText(text => text
				.setValue(this.plugin.settings.defaultAuthor)
				.setPlaceholder('Author')
				.onChange(async (value) => {
					this.plugin.settings.defaultAuthor = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Show Resolved Comments')
			.setDesc('Display comments that have been marked as resolved')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showResolvedComments)
				.onChange(async (value) => {
					this.plugin.settings.showResolvedComments = value;
					await this.plugin.saveSettings();
				}));

		// Word Count Section
		containerEl.createEl('h3', { text: 'Word Count' });

		new Setting(containerEl)
			.setName('Show Word Count')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showWordCount)
				.onChange(async (value) => {
					this.plugin.settings.showWordCount = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Show Character Count')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showCharacterCount)
				.onChange(async (value) => {
					this.plugin.settings.showCharacterCount = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Show Reading Time')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showReadingTime)
				.onChange(async (value) => {
					this.plugin.settings.showReadingTime = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Words Per Minute')
			.setDesc('Average reading speed for time estimates')
			.addSlider(slider => slider
				.setLimits(100, 400, 25)
				.setValue(this.plugin.settings.wordsPerMinute)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.wordsPerMinute = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Word Count Position')
			.setDesc('Where to display the word count')
			.addDropdown(dropdown => dropdown
				.addOption('statusbar', 'Status Bar')
				.addOption('toolbar', 'Author Toolbar')
				.setValue(this.plugin.settings.wordCountPosition)
				.onChange(async (value) => {
					this.plugin.settings.wordCountPosition = value as 'statusbar' | 'toolbar';
					await this.plugin.saveSettings();
				}));
	}
}
