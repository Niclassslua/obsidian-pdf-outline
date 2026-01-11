# PDF Outline Plugin for Obsidian

An Obsidian plugin that displays PDF outlines (table of contents) in a sidebar view, allowing users to navigate through PDF documents efficiently.

## Features

### Core Functionality

- **Automatic PDF Outline Detection**: Automatically detects when a PDF file is opened and parses its outline structure
- **Sidebar View**: Displays the outline in a dedicated sidebar tab that matches Obsidian's native outline appearance
- **Collapsible Tree Structure**: Hierarchical outline with expand/collapse functionality for nested sections
- **Page Navigation**: Click on any outline item to jump to the corresponding page in the PDF viewer

### Advanced Features

- **Search Functionality**: Real-time filtering of outline items by title
  - Case-insensitive search
  - Recursive filtering (shows parent items if children match)
  - Instant results as you type

- **Expand/Collapse All**: Toggle button to expand or collapse all outline sections at once
  - Button text dynamically changes based on current state
  - Works with filtered search results

## Technical Implementation

### Architecture

The plugin is built using TypeScript and follows Obsidian's plugin development best practices:

```
src/
  main.ts          # Plugin lifecycle, view registration, event listeners
  view.ts          # PDFOutlineView class implementing ItemView
  pdf-parser.ts    # PDF outline parsing using PDF.js
  types.ts         # TypeScript interfaces for outline structure
  settings.ts      # Plugin settings configuration
```

### Key Components

#### 1. PDF Parsing (`src/pdf-parser.ts`)

- **PDF.js Integration**: Uses Obsidian's built-in `loadPdfJs()` function to ensure compatibility and proper worker configuration
- **Outline Extraction**: Recursively parses PDF outline structure using PDF.js `getOutline()` API
- **Destination Resolution**: Resolves PDF destinations to page numbers for navigation
- **Error Handling**: Comprehensive error handling with fallbacks

**Key Functions:**
- `parsePDFOutline()`: Main function that loads PDF and extracts outline
- `convertOutlineItemAsync()`: Recursively converts PDF.js outline items to our structure
- `resolveDestination()`: Resolves PDF destinations to page numbers

#### 2. View Implementation (`src/view.ts`)

- **ItemView Extension**: Extends Obsidian's `ItemView` class for sidebar integration
- **Tree Structure**: Uses Obsidian's native `tree-item` CSS classes for consistent UI
- **State Management**: Tracks expand/collapse state of all outline items
- **Search Filtering**: Real-time filtering with recursive matching

**Key Features:**
- `displayOutline()`: Updates view with new outline data
- `renderOutlineItems()`: Recursively renders outline as collapsible tree
- `filterOutline()`: Filters outline items based on search query
- `toggleItem()`: Handles individual item expand/collapse
- `toggleAll()`: Expands or collapses all items
- `jumpToPage()`: Navigates to PDF page when outline item is clicked

#### 3. Plugin Main (`src/main.ts`)

- **View Registration**: Registers the PDF Outline view with Obsidian
- **Event Listeners**: Listens for file-open events to detect PDF files
- **Automatic Updates**: Updates outline when PDF files are opened or switched

**Key Functionality:**
- Registers view in right sidebar on plugin load
- Monitors file-open events for PDF files
- Automatically parses and displays outline when PDF is opened

### UI/UX Design

#### Visual Consistency

- **Native Obsidian Styling**: Uses Obsidian's built-in CSS classes (`tree-item`, `tree-item-self`, etc.) for seamless integration
- **Collapsible Icons**: SVG icons matching Obsidian's native outline appearance
- **Responsive Layout**: Header with search and controls, scrollable content area

#### User Interface Elements

1. **Search Input**: 
   - Positioned at top of view
   - Search icon for visual clarity
   - Real-time filtering as user types

2. **Toggle All Button**:
   - Located next to search input
   - Text changes based on state ("Alles einklappen" / "Alles ausklappen")
   - Uses Obsidian's `mod-cta` class for consistent button styling

3. **Outline Tree**:
   - Hierarchical structure with proper indentation
   - Collapse icons for items with children
   - Page numbers displayed as tags
   - Clickable items for navigation

### PDF Navigation

The plugin implements multiple navigation methods to ensure compatibility:

1. **Primary Methods**:
   - `goToPage()`: Most common PDF viewer method
   - `jumpToPage()`: Alternative navigation method
   - `navigateToPage()`: Additional fallback

2. **Internal API Access**:
   - Direct access to PDF.js viewer instance
   - Page number manipulation via `currentPageNumber`

3. **DOM Manipulation**:
   - Fallback to DOM-based navigation if APIs unavailable
   - Input field manipulation for page navigation

### Error Handling

- **Graceful Degradation**: Falls back to page-based navigation if destination-based navigation fails
- **Console Logging**: Debug information for troubleshooting
- **Empty States**: User-friendly messages when no outline is available or search returns no results

## Installation

### Development Setup

1. Clone the repository:
```bash
git clone https://github.com/Niclassslua/obsidian-pdf-outline.git
cd obsidian-pdf-outline
```

2. Install dependencies:
```bash
npm install
```

3. Build the plugin:
```bash
npm run build
```

4. For development with watch mode:
```bash
npm run dev
```

### Manual Installation

1. Copy `main.js`, `manifest.json`, and `styles.css` to your vault's `.obsidian/plugins/obsidian-pdf-outline/` folder
2. Reload Obsidian
3. Enable the plugin in Settings → Community plugins

## Usage

1. **Open a PDF file** in Obsidian
2. The **PDF Outline** tab will automatically appear in the right sidebar
3. **Click any outline item** to navigate to that section in the PDF
4. **Use the search box** to filter outline items
5. **Click "Alles einklappen/ausklappen"** to collapse or expand all sections

## Technical Details

### Dependencies

- **obsidian**: Latest Obsidian API
- **pdfjs-dist**: ^3.11.174 (loaded via Obsidian's `loadPdfJs()`)

### Browser Compatibility

- Uses Obsidian's built-in PDF.js loading mechanism
- No external CDN dependencies
- Worker configuration handled automatically by Obsidian

### TypeScript Configuration

- Strict type checking enabled
- ES2018 target for compatibility
- Module resolution: Node

## Development

### Project Structure

```
obsidian-pdf-outline/
├── src/
│   ├── main.ts          # Plugin entry point
│   ├── view.ts          # Sidebar view implementation
│   ├── pdf-parser.ts    # PDF parsing logic
│   ├── types.ts         # TypeScript definitions
│   └── settings.ts      # Settings tab
├── styles.css           # Custom styles
├── manifest.json        # Plugin manifest
├── package.json         # Dependencies
└── tsconfig.json        # TypeScript config
```

### Building

```bash
# Development build with watch mode
npm run dev

# Production build
npm run build

# Type checking
npm run lint
```

## Contributing

Contributions are welcome! Please ensure:
- Code follows TypeScript best practices
- New features include proper error handling
- UI matches Obsidian's native design patterns
- All changes are tested before submitting

## License

See LICENSE file for details.

## Acknowledgments

- Built using the [Obsidian Sample Plugin](https://github.com/obsidianmd/obsidian-sample-plugin) as a template
- Uses PDF.js for PDF parsing (loaded via Obsidian's API)
- Follows Obsidian's plugin development guidelines
