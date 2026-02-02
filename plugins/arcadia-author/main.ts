import {
	App,
	Editor,
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
	enableComments: boolean;
	enableWordCount: boolean;
	defaultAuthor: string;
	showResolvedComments: boolean;
	showWordCount: boolean;
	showCharacterCount: boolean;
	showReadingTime: boolean;
	wordsPerMinute: number;
}

const DEFAULT_SETTINGS: ArcadiaAuthorSettings = {
	enableComments: true,
	enableWordCount: true,
	defaultAuthor: 'Author',
	showResolvedComments: false,
	showWordCount: true,
	showCharacterCount: true,
	showReadingTime: true,
	wordsPerMinute: 200
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
		if (this.settings.enableWordCount) {
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
		if (this.settings.enableComments) {
			this.addCommand({
				id: 'add-comment',
				name: 'Add Comment',
				editorCallback: (editor: Editor, view: MarkdownView) => {
					this.addComment(editor, view);
				}
			});

			this.addCommand({
				id: 'toggle-comments-panel',
				name: 'Toggle Comments Panel',
				callback: () => {
					this.toggleCommentsPanel();
				}
			});

			this.addCommand({
				id: 'resolve-all-comments',
				name: 'Resolve All Comments',
				callback: () => {
					this.resolveAllComments();
				}
			});
		}

		this.addCommand({
			id: 'show-document-statistics',
			name: 'Show Document Statistics',
			callback: () => {
				this.showDocumentStatistics();
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
	// AUTHOR TOOLBAR
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

		// Create author toolbar using standard DOM
		this.authorToolbarEl = document.createElement('div');
		this.authorToolbarEl.className = 'arcadia-author-toolbar';

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

			// Separator
			const sep = document.createElement('div');
			sep.className = 'arcadia-author-separator';
			this.authorToolbarEl.appendChild(sep);
		}

		// Statistics button
		const statsBtn = this.createToolbarButton('bar-chart-2', 'Document Statistics', () => {
			this.showDocumentStatistics();
		});
		this.authorToolbarEl.appendChild(statsBtn);

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
		const btn = document.createElement('button');
		btn.className = 'arcadia-author-button';
		btn.setAttribute('aria-label', tooltip);
		btn.setAttribute('title', tooltip);
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
				this.currentAnnotations.set(file.path, {
					version: '1.0.0',
					comments: []
				});
			}
		} catch (error) {
			console.error('Error loading annotations:', error);
			this.currentAnnotations.set(file.path, {
				version: '1.0.0',
				comments: []
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
		if (this.commentsPanelEl && this.commentsPanelEl.style.display !== 'none') {
			this.commentsPanelEl.style.display = 'none';
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
			this.commentsPanelEl = document.createElement('div');
			this.commentsPanelEl.className = 'arcadia-comments-panel';
			document.body.appendChild(this.commentsPanelEl);
		}

		this.updateCommentsPanel();
		this.commentsPanelEl.style.display = 'flex';
	}

	private updateCommentsPanel() {
		if (!this.commentsPanelEl) return;

		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!activeView?.file) return;

		const annotations = this.currentAnnotations.get(activeView.file.path);
		if (!annotations) return;

		this.commentsPanelEl.innerHTML = '';

		// Header
		const header = document.createElement('div');
		header.className = 'arcadia-comments-header';

		const title = document.createElement('h3');
		title.textContent = 'Comments';
		header.appendChild(title);

		const closeBtn = document.createElement('button');
		closeBtn.className = 'arcadia-comments-close';
		setIcon(closeBtn, 'x');
		closeBtn.addEventListener('click', () => {
			if (this.commentsPanelEl) {
				this.commentsPanelEl.style.display = 'none';
			}
		});
		header.appendChild(closeBtn);
		this.commentsPanelEl.appendChild(header);

		// Comments list
		const list = document.createElement('div');
		list.className = 'arcadia-comments-list';

		const visibleComments = annotations.comments.filter(c =>
			this.settings.showResolvedComments || !c.resolved
		);

		if (visibleComments.length === 0) {
			const empty = document.createElement('p');
			empty.className = 'arcadia-comments-empty';
			empty.textContent = 'No comments yet. Select text and click "Add Comment" to create one.';
			list.appendChild(empty);
		} else {
			visibleComments.forEach(comment => {
				const commentEl = this.createCommentElement(comment, activeView.file!);
				list.appendChild(commentEl);
			});
		}

		this.commentsPanelEl.appendChild(list);
	}

	private createCommentElement(comment: Comment, file: TFile): HTMLElement {
		const el = document.createElement('div');
		el.className = 'arcadia-comment';
		if (comment.resolved) {
			el.classList.add('is-resolved');
		}

		// Comment header
		const headerEl = document.createElement('div');
		headerEl.className = 'arcadia-comment-header';

		const authorEl = document.createElement('span');
		authorEl.className = 'arcadia-comment-author';
		authorEl.textContent = comment.author;
		headerEl.appendChild(authorEl);

		const dateEl = document.createElement('span');
		dateEl.className = 'arcadia-comment-date';
		dateEl.textContent = new Date(comment.createdAt).toLocaleDateString();
		headerEl.appendChild(dateEl);

		el.appendChild(headerEl);

		// Comment text
		const textEl = document.createElement('p');
		textEl.className = 'arcadia-comment-text';
		textEl.textContent = comment.text;
		el.appendChild(textEl);

		// Actions
		const actionsEl = document.createElement('div');
		actionsEl.className = 'arcadia-comment-actions';

		const resolveBtn = document.createElement('button');
		resolveBtn.className = 'arcadia-comment-action';
		resolveBtn.textContent = comment.resolved ? 'Unresolve' : 'Resolve';
		resolveBtn.addEventListener('click', async () => {
			comment.resolved = !comment.resolved;
			comment.updatedAt = new Date().toISOString();
			await this.saveAnnotationsForFile(file);
			this.updateCommentsPanel();
		});
		actionsEl.appendChild(resolveBtn);

		const deleteBtn = document.createElement('button');
		deleteBtn.className = 'arcadia-comment-action arcadia-comment-delete';
		deleteBtn.textContent = 'Delete';
		deleteBtn.addEventListener('click', async () => {
			const annotations = this.currentAnnotations.get(file.path);
			if (annotations) {
				annotations.comments = annotations.comments.filter(c => c.id !== comment.id);
				await this.saveAnnotationsForFile(file);
				this.updateCommentsPanel();
				new Notice('Comment deleted');
			}
		});
		actionsEl.appendChild(deleteBtn);

		el.appendChild(actionsEl);

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
		const contentWithoutFrontmatter = text.replace(/^---[\s\S]*?---\n?/, '');

		const cleanText = contentWithoutFrontmatter
			.replace(/```[\s\S]*?```/g, '')
			.replace(/`[^`]+`/g, '')
			.replace(/!\[.*?\]\(.*?\)/g, '')
			.replace(/\[([^\]]+)\]\(.*?\)/g, '$1')
			.replace(/[#*_~`>]/g, '')
			.replace(/\n/g, ' ')
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
	private authorInput: HTMLInputElement;
	private commentInput: HTMLTextAreaElement;

	constructor(app: App, selection: string, defaultAuthor: string, onSubmit: (text: string, author: string) => void) {
		super(app);
		this.selection = selection;
		this.defaultAuthor = defaultAuthor;
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.addClass('arcadia-modal');

		const title = contentEl.createEl('h2', { text: 'Add Comment' });

		// Show selected text
		const selectionDiv = contentEl.createEl('div', { cls: 'arcadia-modal-selection' });
		selectionDiv.createEl('label', { text: 'Selected text:' });
		selectionDiv.createEl('blockquote', { text: this.selection });

		// Author input
		const authorDiv = contentEl.createEl('div', { cls: 'setting-item' });
		authorDiv.createEl('label', { text: 'Author' });
		this.authorInput = authorDiv.createEl('input', { type: 'text', value: this.defaultAuthor });

		// Comment input
		const commentDiv = contentEl.createEl('div', { cls: 'setting-item' });
		commentDiv.createEl('label', { text: 'Comment' });
		this.commentInput = commentDiv.createEl('textarea', { placeholder: 'Enter your comment...' });
		this.commentInput.rows = 4;

		// Buttons
		const buttonDiv = contentEl.createEl('div', { cls: 'arcadia-modal-buttons' });

		const cancelBtn = buttonDiv.createEl('button', { text: 'Cancel' });
		cancelBtn.addEventListener('click', () => this.close());

		const submitBtn = buttonDiv.createEl('button', { text: 'Add Comment', cls: 'mod-cta' });
		submitBtn.addEventListener('click', () => {
			const text = this.commentInput.value.trim();
			if (text) {
				this.onSubmit(text, this.authorInput.value || this.defaultAuthor);
				this.close();
			} else {
				new Notice('Please enter a comment');
			}
		});
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

		const buttonDiv = contentEl.createEl('div', { cls: 'arcadia-modal-buttons' });
		const closeBtn = buttonDiv.createEl('button', { text: 'Close', cls: 'mod-cta' });
		closeBtn.addEventListener('click', () => this.close());
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
			.setName('Enable Word Count')
			.setDesc('Show word count and reading statistics')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableWordCount)
				.onChange(async (value) => {
					this.plugin.settings.enableWordCount = value;
					await this.plugin.saveSettings();
				}));

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
	}
}
