import { TFile, loadPdfJs } from 'obsidian';
import { PDFOutlineItem } from './types';

// PDF.js library - will be loaded via Obsidian's loadPdfJs() function
let pdfjsLib: any = null;

/**
 * Recursively converts PDF.js outline items to our structure
 */
function convertOutlineItem(item: any, pageMap: Map<any, number>): PDFOutlineItem {
	const page = pageMap.get(item.dest) ?? 1;
	
	const outlineItem: PDFOutlineItem = {
		title: item.title || 'Untitled',
		page: page,
		children: [],
		dest: item.dest,
	};

	if (item.items && item.items.length > 0) {
		outlineItem.children = item.items.map((child: any) => convertOutlineItem(child, pageMap));
	}

	return outlineItem;
}

/**
 * Builds a page map from the PDF document's page references
 */
async function buildPageMap(doc: any): Promise<Map<any, number>> {
	const pageMap = new Map<any, number>();
	
	try {
		// Get all pages to build destination map
		const numPages = doc.numPages;
		for (let i = 1; i <= numPages; i++) {
			const page = await doc.getPage(i);
			// Map common destination types
			const pageRef = page.ref;
			if (pageRef) {
				pageMap.set(pageRef, i);
			}
		}
	} catch (error) {
		console.error('Error building page map:', error);
	}

	return pageMap;
}

/**
 * Resolves a destination to a page number
 */
async function resolveDestination(doc: any, dest: any): Promise<number> {
	try {
		if (typeof dest === 'string') {
			dest = await doc.getDestination(dest);
		}
		
		if (Array.isArray(dest)) {
			const [ref] = dest;
			const pageIndex = await doc.getPageIndex(ref);
			return pageIndex + 1; // PDF pages are 1-indexed
		}
	} catch (error) {
		console.error('Error resolving destination:', error);
	}
	
	return 1; // Default to page 1 if resolution fails
}

/**
 * Recursively converts PDF.js outline items with proper page resolution
 */
async function convertOutlineItemAsync(item: any, doc: any): Promise<PDFOutlineItem> {
	let page = 1;
	
	if (item.dest) {
		page = await resolveDestination(doc, item.dest);
	}
	
	const outlineItem: PDFOutlineItem = {
		title: item.title || 'Untitled',
		page: page,
		children: [],
		dest: item.dest,
	};

	if (item.items && item.items.length > 0) {
		outlineItem.children = await Promise.all(
			item.items.map((child: any) => convertOutlineItemAsync(child, doc))
		);
	}

	return outlineItem;
}

/**
 * Parses the outline (table of contents) from a PDF file
 */
export async function parsePDFOutline(file: TFile, app: any): Promise<PDFOutlineItem[]> {
	try {
		// Load PDF.js using Obsidian's built-in function
		// This handles worker configuration automatically
		if (!pdfjsLib) {
			pdfjsLib = await loadPdfJs();
		}
		
		// Read the file as ArrayBuffer
		const arrayBuffer = await app.vault.readBinary(file);
		
		// Load the PDF document
		const loadingTask = pdfjsLib.getDocument({
			data: arrayBuffer,
			useSystemFonts: true,
			verbosity: 0, // Reduce console output
		});
		
		const doc = await loadingTask.promise;
		
		// Get the outline
		const outline = await doc.getOutline();
		
		if (!outline || outline.length === 0) {
			return [];
		}
		
		// Convert outline items recursively
		const convertedOutline = await Promise.all(
			outline.map((item: any) => convertOutlineItemAsync(item, doc))
		);
		
		return convertedOutline;
	} catch (error) {
		console.error('Error parsing PDF outline:', error);
		throw error;
	}
}
