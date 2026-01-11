import { ItemView, WorkspaceLeaf } from 'obsidian';
import { PDFOutlineItem } from './types';

export const PDF_OUTLINE_VIEW_TYPE = 'pdf-outline-view';

interface OutlineItemState {
	item: PDFOutlineItem;
	element: HTMLElement;
	childrenContainer: HTMLElement | null;
	isCollapsed: boolean;
}

export class PDFOutlineView extends ItemView {
	private outlineItems: PDFOutlineItem[] = [];
	private itemStates: Map<PDFOutlineItem, OutlineItemState> = new Map();
	private searchQuery: string = '';
	private allExpanded: boolean = true;
	private searchInputEl: HTMLInputElement | null = null;
	private toggleAllButton: HTMLElement | null = null;
	private outlineContainer: HTMLElement | null = null;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType(): string {
		return PDF_OUTLINE_VIEW_TYPE;
	}

	getDisplayText(): string {
		return 'PDF Outline';
	}

	getIcon(): string {
		return 'file-text';
	}

	async onOpen(): Promise<void> {
		this.displayOutline(this.outlineItems);
	}

	async onClose(): Promise<void> {
		this.itemStates.clear();
	}

	/**
	 * Updates the view with new outline data
	 */
	displayOutline(outline: PDFOutlineItem[]): void {
		this.outlineItems = outline;
		this.itemStates.clear();
		const container = this.contentEl;
		
		container.empty();

		if (outline.length === 0) {
			const emptyState = container.createDiv('pdf-outline-empty');
			emptyState.setText('No outline available. Open a PDF file to see its outline.');
			return;
		}

		// Create header with search and toggle button
		this.createHeader(container);
		
		// Create outline container
		this.outlineContainer = container.createDiv('pdf-outline-content');
		
		// Render filtered outline
		this.renderFilteredOutline();
	}

	/**
	 * Creates the header with search input and toggle all button
	 */
	private createHeader(container: HTMLElement): void {
		const header = container.createDiv('pdf-outline-header');
		
		// Search input
		const searchContainer = header.createDiv('pdf-outline-search');
		this.searchInputEl = searchContainer.createEl('input', {
			type: 'text',
			placeholder: 'Search outline...',
			cls: 'pdf-outline-search-input'
		});
		this.searchInputEl.value = this.searchQuery;
		
		// Search icon
		const searchIcon = searchContainer.createSpan('pdf-outline-search-icon');
		searchIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg>';
		
		// Toggle all button
		this.toggleAllButton = header.createEl('button', {
			cls: 'pdf-outline-toggle-all mod-cta'
		});
		this.updateToggleButtonText();
		
		// Event listeners
		this.searchInputEl.addEventListener('input', (e) => {
			this.searchQuery = (e.target as HTMLInputElement).value.toLowerCase();
			this.renderFilteredOutline();
		});
		
		this.toggleAllButton.addEventListener('click', () => {
			this.toggleAll();
		});
	}

	/**
	 * Updates the toggle button text based on current state
	 */
	private updateToggleButtonText(): void {
		if (this.toggleAllButton) {
			this.toggleAllButton.textContent = this.allExpanded ? 'Alles einklappen' : 'Alles ausklappen';
		}
	}

	/**
	 * Toggles all items expanded/collapsed
	 */
	private toggleAll(): void {
		this.allExpanded = !this.allExpanded;
		this.updateToggleButtonText();
		
		// Get all items that have children
		const itemsWithChildren = Array.from(this.itemStates.values())
			.filter(state => state.item.children && state.item.children.length > 0);
		
		itemsWithChildren.forEach(state => {
			if (state.isCollapsed === this.allExpanded) {
				this.toggleItem(state.item);
			}
		});
	}

	/**
	 * Filters outline items based on search query
	 */
	private filterOutline(items: PDFOutlineItem[]): PDFOutlineItem[] {
		if (!this.searchQuery.trim()) {
			return items;
		}
		
		const query = this.searchQuery.toLowerCase();
		const filtered: PDFOutlineItem[] = [];
		
		items.forEach(item => {
			const matches = item.title.toLowerCase().includes(query);
			const filteredChildren = this.filterOutline(item.children);
			
			if (matches || filteredChildren.length > 0) {
				filtered.push({
					...item,
					children: filteredChildren
				});
			}
		});
		
		return filtered;
	}

	/**
	 * Renders the filtered outline
	 */
	private renderFilteredOutline(): void {
		if (!this.outlineContainer) {
			return;
		}
		
		this.itemStates.clear();
		this.outlineContainer.empty();
		
		const filtered = this.filterOutline(this.outlineItems);
		
		if (filtered.length === 0) {
			const noResults = this.outlineContainer.createDiv('pdf-outline-empty');
			noResults.setText('No matching items found.');
			return;
		}
		
		// Render filtered items
		this.renderOutlineItems(this.outlineContainer, filtered);
		
		// Apply current expand/collapse state
		if (!this.allExpanded) {
			// Collapse all items that have children
			const itemsWithChildren = Array.from(this.itemStates.values())
				.filter(state => state.item.children && state.item.children.length > 0);
			
			itemsWithChildren.forEach(state => {
				if (!state.isCollapsed) {
					this.toggleItem(state.item);
				}
			});
		}
	}

	/**
	 * Recursively renders outline items as a collapsible tree using Obsidian's tree-item structure
	 */
	private renderOutlineItems(container: HTMLElement, items: PDFOutlineItem[]): void {
		items.forEach((item) => {
			const hasChildren = item.children && item.children.length > 0;
			const isCollapsed = false; // Start expanded by default
			
			// Create tree-item structure like Obsidian's native outline
			const treeItem = container.createDiv('tree-item');
			const itemState: OutlineItemState = {
				item,
				element: treeItem,
				childrenContainer: null,
				isCollapsed: isCollapsed,
			};
			this.itemStates.set(item, itemState);

			// Create the tree-item-self (clickable title)
			const treeItemSelf = treeItem.createDiv('tree-item-self is-clickable');
			if (hasChildren) {
				treeItemSelf.addClass('mod-collapsible');
			}

			// Collapse/expand icon (only if has children)
			if (hasChildren) {
				const collapseIcon = treeItemSelf.createDiv('tree-item-icon collapse-icon');
				collapseIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon right-triangle"><path d="M3 8L12 17L21 8"></path></svg>';
				
				// Toggle collapse on icon click
				collapseIcon.addEventListener('click', (e) => {
					e.stopPropagation();
					this.toggleItem(item);
				});
			}

			// Create the inner content
			const treeItemInner = treeItemSelf.createDiv('tree-item-inner');
			treeItemInner.setText(item.title);
			
			// Add page number after the title
			const pageNumber = treeItemInner.createSpan('nav-file-tag');
			pageNumber.setText(` p.${item.page}`);
			pageNumber.style.marginLeft = 'auto';
			pageNumber.style.opacity = '0.7';
			pageNumber.style.fontSize = '0.85em';
			
			// Make entire title clickable to jump to page
			treeItemSelf.addEventListener('click', (e) => {
				// Don't trigger if clicking the collapse icon
				if (!e.target || !(e.target as HTMLElement).closest('.tree-item-icon')) {
					this.jumpToPage(item.page);
				}
			});

			// Create children container (collapsible) - ALWAYS create it if has children
			if (hasChildren) {
				const childrenContainer = treeItem.createDiv('tree-item-children');
				itemState.childrenContainer = childrenContainer;
				
				// Always render children initially (since isCollapsed = false)
				// The children will be inside the collapsible container
				this.renderOutlineItems(childrenContainer, item.children);
			} else {
				// Create empty children container for items without children (for consistency)
				const childrenContainer = treeItem.createDiv('tree-item-children');
				childrenContainer.style.minHeight = '0px';
			}
		});
	}

	/**
	 * Toggles the collapsed state of an outline item
	 */
	private toggleItem(item: PDFOutlineItem): void {
		const state = this.itemStates.get(item);
		if (!state || !state.childrenContainer) {
			return;
		}

		state.isCollapsed = !state.isCollapsed;
		
		if (state.isCollapsed) {
			state.element.addClass('is-collapsed');
			state.childrenContainer.empty();
		} else {
			state.element.removeClass('is-collapsed');
			if (state.item.children) {
				// Apply search filter to children when expanding
				const filteredChildren = this.filterOutline(state.item.children);
				this.renderOutlineItems(state.childrenContainer!, filteredChildren);
			}
		}
	}

	/**
	 * Attempts to navigate to the specified page in the PDF
	 */
	private jumpToPage(page: number): void {
		const activeFile = this.app.workspace.getActiveFile();
		
		if (!activeFile || !activeFile.path.endsWith('.pdf')) {
			return;
		}

		// Find all leaves and check for PDF views
		const allLeaves = this.app.workspace.getLeavesOfType('pdf');
		
		// Try to find a PDF view that matches the current file
		let targetLeaf = allLeaves.find(leaf => {
			const view = leaf.view;
			// @ts-ignore - accessing internal properties
			return view?.file?.path === activeFile.path;
		});

		// If no matching leaf found, use the first PDF leaf or open a new one
		if (!targetLeaf) {
			if (allLeaves.length > 0) {
				targetLeaf = allLeaves[0];
			} else {
				// Open PDF in new leaf
				this.app.workspace.openLinkText(activeFile.path, '', true).then(() => {
					// Wait a bit for the PDF to load, then navigate
					setTimeout(() => {
						this.navigateToPageInLeaf(page, activeFile);
					}, 300);
				});
				return;
			}
		}

		// Activate the PDF view and navigate
		if (targetLeaf) {
			this.app.workspace.setActiveLeaf(targetLeaf, { focus: true });
			this.navigateToPageInLeaf(page, activeFile, targetLeaf);
		}
	}

	/**
	 * Navigates to a specific page in a PDF leaf
	 */
	private navigateToPageInLeaf(page: number, file: any, leaf?: any): void {
		if (!leaf) {
			const pdfLeaves = this.app.workspace.getLeavesOfType('pdf');
			leaf = pdfLeaves.find(l => {
				// @ts-ignore
				return l.view?.file?.path === file.path;
			}) || pdfLeaves[0];
		}

		if (!leaf || !leaf.view) {
			return;
		}

		const pdfView = leaf.view;
		
		// Try different methods to navigate to the page
		// Method 1: goToPage (most common)
		if (pdfView && typeof pdfView.goToPage === 'function') {
			pdfView.goToPage(page);
			return;
		}

		// Method 2: jumpToPage
		if (pdfView && typeof pdfView.jumpToPage === 'function') {
			pdfView.jumpToPage(page);
			return;
		}

		// Method 3: navigateToPage
		if (pdfView && typeof pdfView.navigateToPage === 'function') {
			pdfView.navigateToPage(page);
			return;
		}

		// Method 4: Try accessing internal PDF.js viewer
		// @ts-ignore
		if (pdfView?.pdfViewer) {
			// @ts-ignore
			const pdfViewer = pdfView.pdfViewer;
			if (pdfViewer && typeof pdfViewer.currentPageNumber !== 'undefined') {
				// @ts-ignore
				pdfViewer.currentPageNumber = page;
				return;
			}
		}

		// Method 5: Try to find and trigger page navigation via DOM
		const pdfContainer = pdfView?.containerEl || leaf.containerEl;
		if (pdfContainer) {
			// Look for page input or navigation controls
			const pageInput = pdfContainer.querySelector('input[type="number"]') as HTMLInputElement;
			if (pageInput) {
				pageInput.value = page.toString();
				pageInput.dispatchEvent(new Event('change', { bubbles: true }));
				return;
			}
		}

		// Fallback: Log warning
		console.warn('Could not navigate to PDF page', page, 'in file', file.path);
	}
}
