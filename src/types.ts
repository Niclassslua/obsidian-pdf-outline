/**
 * Type definitions for PDF outline structure
 */

export interface PDFOutlineItem {
	title: string;
	page: number;
	children: PDFOutlineItem[];
	dest?: any; // PDF.js destination object
}

export type PDFOutline = PDFOutlineItem[];
