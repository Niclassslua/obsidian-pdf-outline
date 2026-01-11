import { App, PluginSettingTab, Setting } from 'obsidian';
import PDFOutlinePlugin from './main';

export interface PDFOutlinePluginSettings {
	// Placeholder for future settings
}

export const DEFAULT_SETTINGS: PDFOutlinePluginSettings = {};

export class PDFOutlineSettingTab extends PluginSettingTab {
	plugin: PDFOutlinePlugin;

	constructor(app: App, plugin: PDFOutlinePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: 'PDF Outline Settings' });

		new Setting(containerEl)
			.setName('About')
			.setDesc('This plugin automatically displays the outline (table of contents) of PDF files in the right sidebar. Open a PDF file to see its outline.');
	}
}
