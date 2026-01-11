import { Plugin, TFile } from 'obsidian';
import { DEFAULT_SETTINGS, PDFOutlinePluginSettings, PDFOutlineSettingTab } from './settings';
import { PDFOutlineView, PDF_OUTLINE_VIEW_TYPE } from './view';
import { parsePDFOutline } from './pdf-parser';

export default class PDFOutlinePlugin extends Plugin {
	settings: PDFOutlinePluginSettings;
	private view: PDFOutlineView;

	async onload() {
		await this.loadSettings();

		// Register the view
		this.registerView(
			PDF_OUTLINE_VIEW_TYPE,
			(leaf) => (this.view = new PDFOutlineView(leaf))
		);

		// Activate the view in the right sidebar
		this.app.workspace.onLayoutReady(() => {
			this.activateView();
		});

		// Listen for file open events to update outline when PDF is opened
		this.registerEvent(
			this.app.workspace.on('file-open', async (file: TFile | null) => {
				if (file && file.extension === 'pdf') {
					await this.updateOutlineForFile(file);
				} else {
					// Clear outline if non-PDF file is opened
					if (this.view) {
						this.view.displayOutline([]);
					}
				}
			})
		);

		// Also check active file on load
		this.app.workspace.onLayoutReady(async () => {
			const activeFile = this.app.workspace.getActiveFile();
			if (activeFile && activeFile.extension === 'pdf') {
				await this.updateOutlineForFile(activeFile);
			}
		});

		// Add settings tab
		this.addSettingTab(new PDFOutlineSettingTab(this.app, this));
	}

	onunload() {
		// Cleanup is handled automatically by Obsidian
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<PDFOutlinePluginSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	/**
	 * Activates the PDF Outline view in the right sidebar
	 */
	private async activateView() {
		const { workspace } = this.app;

		let leaf = workspace.getLeavesOfType(PDF_OUTLINE_VIEW_TYPE)[0];
		
		if (!leaf) {
			// Create a new leaf in the right sidebar
			leaf = workspace.getRightLeaf(false);
			await leaf.setViewState({
				type: PDF_OUTLINE_VIEW_TYPE,
				active: true,
			});
		}

		workspace.revealLeaf(leaf);
	}

	/**
	 * Updates the outline view with the outline from the given PDF file
	 */
	private async updateOutlineForFile(file: TFile): Promise<void> {
		if (!this.view) {
			await this.activateView();
		}

		try {
			const outline = await parsePDFOutline(file, this.app);
			if (this.view) {
				this.view.displayOutline(outline);
			}
		} catch (error) {
			console.error('Failed to parse PDF outline:', error);
			if (this.view) {
				this.view.displayOutline([]);
			}
		}
	}
}
