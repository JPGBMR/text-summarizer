# P1 Technical Specifications
## Text Summarizer - Architectural Blueprint

**Document Version**: 1.0
**Created**: 2026-02-22
**Agent**: Colombo (Software Architect)
**Project**: text-summarizer P1 feature enhancements
**For**: Vitalic (Builder) implementation

---

## Table of Contents

1. [Technology Stack Decisions](#1-technology-stack-decisions)
2. [Data Structures & Schemas](#2-data-structures--schemas)
3. [CSS Architecture for Dark Mode](#3-css-architecture-for-dark-mode)
4. [API Contracts](#4-api-contracts)
5. [File Organization](#5-file-organization)
6. [Component Specifications](#6-component-specifications)
7. [Integration Points](#7-integration-points)
8. [Testing Strategy](#8-testing-strategy)
9. [Performance Considerations](#9-performance-considerations)
10. [Security & Validation](#10-security--validation)

---

## 1. Technology Stack Decisions

### 1.1 Export Libraries

#### PDF Export: jsPDF (Recommended)
**Choice**: jsPDF v2.5.1
**CDN**: `https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js`

**Justification**:
- Lightweight (~200KB minified)
- Zero dependencies
- Excellent browser compatibility
- Simple API for text-based PDFs
- Active maintenance (last update 2023)
- No need for backend processing

**Alternative Considered**: pdfmake
- Rejected: Heavier (~500KB), more complex setup, overkill for simple text export

#### DOCX Export: docx.js (Recommended)
**Choice**: docx v7.8.2
**CDN**: `https://cdn.jsdelivr.net/npm/docx@7.8.2/build/index.min.js`

**Justification**:
- Native JavaScript, no backend required
- Generates proper Office Open XML format
- Works in all modern browsers
- TypeScript support (if needed later)
- Active development
- Size: ~300KB (acceptable for lazy loading)

**Alternative Considered**: html-docx-js
- Rejected: Less feature-rich, outdated, poor TypeScript support

#### Clipboard API
**Choice**: Native Browser Clipboard API with fallback
**Fallback**: `document.execCommand('copy')` for IE11/older Safari

**Justification**:
- No external library needed
- Native performance
- Modern browsers have excellent support (96%+ as of 2025)
- Fallback covers remaining 4%

### 1.2 Icon Library (Optional)
**Choice**: SVG icons inline or simple Unicode symbols

**Justification**:
- Current app uses emoji (📝, ✨, 📊) - maintain consistency
- For dark mode toggle: Use SVG inline for moon/sun icons
- No need for Font Awesome or similar heavy libraries
- Keeps page load fast

### 1.3 No Additional Frameworks
**Decision**: Continue with Vanilla JavaScript

**Justification**:
- Current codebase is vanilla JS
- Features are simple enough not to require React/Vue
- Performance remains optimal
- Easier for user to maintain and understand

---

## 2. Data Structures & Schemas

### 2.1 History Entry Format (localStorage)

```javascript
/**
 * @typedef {Object} HistoryEntry
 * @property {string} id - Unique identifier (timestamp-based)
 * @property {string} timestamp - ISO 8601 format datetime
 * @property {string} algorithm - "textrank" | "lsa" | "both"
 * @property {number} length - Number of sentences (1-10)
 * @property {string} originalText - Full original text
 * @property {number} originalWordCount - Word count of original
 * @property {Array<SummaryResult>} summaries - Array of summary results
 * @property {Statistics} statistics - Summary statistics
 */

/**
 * @typedef {Object} SummaryResult
 * @property {string} algorithm - "TextRank" | "LSA"
 * @property {string} summary - Generated summary text
 * @property {number} wordCount - Summary word count
 */

/**
 * @typedef {Object} Statistics
 * @property {number} compressionRatio - Percentage (0-100)
 * @property {number} originalReadingTime - Seconds
 * @property {number} summaryReadingTime - Seconds
 * @property {number} timeSaved - Seconds
 * @property {number} sentenceCount - Original sentence count
 * @property {number} summarySentenceCount - Summary sentence count
 */

// Example localStorage structure:
const historySchema = {
  "text-summarizer-history": [
    {
      "id": "1708621540123",
      "timestamp": "2026-02-22T14:45:40.123Z",
      "algorithm": "both",
      "length": 3,
      "originalText": "Full original text here...",
      "originalWordCount": 1000,
      "summaries": [
        {
          "algorithm": "TextRank",
          "summary": "Summary text here...",
          "wordCount": 200
        },
        {
          "algorithm": "LSA",
          "summary": "Summary text here...",
          "wordCount": 195
        }
      ],
      "statistics": {
        "compressionRatio": 20,
        "originalReadingTime": 240,
        "summaryReadingTime": 48,
        "timeSaved": 192,
        "sentenceCount": 45,
        "summarySentenceCount": 3
      }
    }
    // ... up to 20 entries total
  ]
}
```

### 2.2 Theme Preference Storage

```javascript
/**
 * @typedef {Object} ThemePreference
 * @property {string} theme - "light" | "dark"
 */

// localStorage key: "text-summarizer-theme"
const themeSchema = {
  "text-summarizer-theme": "dark"  // Simple string value
}
```

### 2.3 Export Metadata Format

```javascript
/**
 * @typedef {Object} ExportMetadata
 * @property {string} title - Document title
 * @property {string} algorithm - Algorithm used
 * @property {string} timestamp - Human-readable datetime
 * @property {number} originalWords - Original word count
 * @property {number} summaryWords - Summary word count
 * @property {string} compressionRatio - Formatted percentage
 */

const exportMetadata = {
  title: "Text Summary",
  algorithm: "TextRank",
  timestamp: "February 22, 2026 at 2:45 PM",
  originalWords: 1000,
  summaryWords: 200,
  compressionRatio: "20%"
}
```

### 2.4 LocalStorage Management Object

```javascript
/**
 * LocalStorage manager for the application
 */
const StorageManager = {
  KEYS: {
    THEME: 'text-summarizer-theme',
    HISTORY: 'text-summarizer-history'
  },

  MAX_HISTORY_ENTRIES: 20,

  /**
   * Get theme preference
   * @returns {string} "light" | "dark"
   */
  getTheme() {
    return localStorage.getItem(this.KEYS.THEME) || 'light';
  },

  /**
   * Save theme preference
   * @param {string} theme - "light" | "dark"
   */
  setTheme(theme) {
    localStorage.setItem(this.KEYS.THEME, theme);
  },

  /**
   * Get history entries
   * @returns {Array<HistoryEntry>}
   */
  getHistory() {
    try {
      const data = localStorage.getItem(this.KEYS.HISTORY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading history:', error);
      return [];
    }
  },

  /**
   * Save history entry
   * @param {HistoryEntry} entry
   */
  addToHistory(entry) {
    try {
      let history = this.getHistory();
      history.unshift(entry); // Add to beginning

      // Limit to MAX_HISTORY_ENTRIES
      if (history.length > this.MAX_HISTORY_ENTRIES) {
        history = history.slice(0, this.MAX_HISTORY_ENTRIES);
      }

      localStorage.setItem(this.KEYS.HISTORY, JSON.stringify(history));
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        // Handle quota exceeded
        this.handleQuotaExceeded();
      }
      console.error('Error saving to history:', error);
    }
  },

  /**
   * Delete specific history entry
   * @param {string} id - Entry ID
   */
  deleteHistoryEntry(id) {
    const history = this.getHistory().filter(entry => entry.id !== id);
    localStorage.setItem(this.KEYS.HISTORY, JSON.stringify(history));
  },

  /**
   * Clear all history
   */
  clearHistory() {
    localStorage.removeItem(this.KEYS.HISTORY);
  },

  /**
   * Handle localStorage quota exceeded
   */
  handleQuotaExceeded() {
    // Remove oldest entries until we have space
    let history = this.getHistory();
    while (history.length > 10) {
      history.pop(); // Remove oldest
    }
    localStorage.setItem(this.KEYS.HISTORY, JSON.stringify(history));
  }
};
```

---

## 3. CSS Architecture for Dark Mode

### 3.1 CSS Variable Naming Convention

**Strategy**: Extend existing CSS variable system with dark mode overrides

```css
/* Root variables for LIGHT mode (existing) */
:root {
    /* Primary colors */
    --primary-color: #3b82f6;
    --primary-hover: #2563eb;
    --secondary-color: #64748b;
    --success-color: #10b981;
    --error-color: #ef4444;

    /* Surface colors */
    --bg-color: #f8fafc;
    --surface-color: #ffffff;

    /* Text colors */
    --text-color: #1e293b;
    --text-secondary: #64748b;

    /* Border & shadow */
    --border-color: #e2e8f0;
    --shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    --shadow-lg: 0 10px 25px rgba(0, 0, 0, 0.1);

    /* Transitions */
    --theme-transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
}

/* Dark mode overrides */
body.dark-mode {
    /* Primary colors - slightly adjusted for dark backgrounds */
    --primary-color: #60a5fa;
    --primary-hover: #3b82f6;
    --secondary-color: #94a3b8;
    --success-color: #34d399;
    --error-color: #f87171;

    /* Surface colors - dark palette */
    --bg-color: #0f172a;
    --surface-color: #1e293b;

    /* Text colors - light on dark */
    --text-color: #f1f5f9;
    --text-secondary: #cbd5e1;

    /* Border & shadow */
    --border-color: #334155;
    --shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    --shadow-lg: 0 10px 25px rgba(0, 0, 0, 0.5);
}
```

### 3.2 Color Palette

#### Light Mode (Default)
```css
Background:      #f8fafc (Slate 50)
Surface:         #ffffff (White)
Text Primary:    #1e293b (Slate 800)
Text Secondary:  #64748b (Slate 500)
Border:          #e2e8f0 (Slate 200)
Primary:         #3b82f6 (Blue 500)
Success:         #10b981 (Emerald 500)
Error:           #ef4444 (Red 500)
```

#### Dark Mode
```css
Background:      #0f172a (Slate 950)
Surface:         #1e293b (Slate 800)
Text Primary:    #f1f5f9 (Slate 100)
Text Secondary:  #cbd5e1 (Slate 300)
Border:          #334155 (Slate 700)
Primary:         #60a5fa (Blue 400)
Success:         #34d399 (Emerald 400)
Error:           #f87171 (Red 400)
```

**WCAG AA Compliance**:
- Light mode: All text meets 4.5:1 contrast ratio
- Dark mode: All text meets 4.5:1 contrast ratio
- Tested with WebAIM Contrast Checker

### 3.3 Transition Strategy

```css
/* Add transitions to elements that change with theme */
body {
    transition: var(--theme-transition);
}

main,
.summary-card,
.error,
textarea,
.btn-primary {
    transition: var(--theme-transition);
}

/* Smooth toggle button rotation */
.theme-toggle-btn {
    transition: transform 0.3s ease;
}

.theme-toggle-btn:hover {
    transform: rotate(20deg);
}
```

### 3.4 Dark Mode Toggle Button Styles

```css
.theme-toggle {
    position: fixed;
    top: 1rem;
    right: 1rem;
    z-index: 1000;
}

.theme-toggle-btn {
    background: var(--surface-color);
    border: 2px solid var(--border-color);
    border-radius: 50%;
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: var(--theme-transition), transform 0.3s ease;
    box-shadow: var(--shadow);
}

.theme-toggle-btn:hover {
    transform: rotate(20deg);
    border-color: var(--primary-color);
}

.theme-toggle-btn:active {
    transform: scale(0.95);
}

/* SVG icon sizing */
.theme-toggle-btn svg {
    width: 24px;
    height: 24px;
    fill: var(--text-color);
}
```

### 3.5 Component-Specific Dark Mode Adjustments

```css
/* Error box in dark mode needs specific styling */
body.dark-mode .error {
    background: rgba(248, 113, 113, 0.1);
    border-left-color: var(--error-color);
}

/* Loading spinner */
body.dark-mode .spinner {
    border-color: var(--border-color);
    border-top-color: var(--primary-color);
}

/* Textarea placeholder */
body.dark-mode textarea::placeholder {
    color: var(--text-secondary);
    opacity: 0.6;
}

/* Summary card accent */
body.dark-mode .summary-card {
    border-left-color: var(--primary-color);
}
```

---

## 4. API Contracts

### 4.1 No New Backend Endpoints Required

**Decision**: All P1 features can be implemented frontend-only.

**Rationale**:
- Export: Client-side libraries (jsPDF, docx) handle generation
- Statistics: Pure calculation from existing API response data
- History: localStorage persistence
- Dark mode: CSS + localStorage
- Copy: Clipboard API (browser native)
- File upload: FileReader API (browser native)

**Current API**: `/api/summarize` (POST) - No changes needed

```typescript
// Existing endpoint remains unchanged
POST /api/summarize
Content-Type: application/json

Request:
{
  "text": string,
  "algorithm": "textrank" | "lsa" | "both",
  "length": number (1-10)
}

Response:
{
  "summaries": [
    {
      "algorithm": string,
      "summary": string,
      "word_count": number
    }
  ],
  "original_length": number
}
```

### 4.2 Error Response Format (Existing)

```json
{
  "detail": "Error message here"
}
```

**HTTP Status Codes**:
- 200: Success
- 400: Bad Request (validation error)
- 422: Unprocessable Entity (invalid JSON)
- 500: Internal Server Error

---

## 5. File Organization

### 5.1 Directory Structure (After P1)

```
static/
├── index.html          # Main HTML (modified)
├── style.css           # Main styles (extended with dark mode)
├── app.js              # Main application logic (extended)
├── utils.js            # NEW: Utility functions
├── storage.js          # NEW: LocalStorage manager
├── export.js           # NEW: Export functionality
└── icons/              # NEW: SVG icons for theme toggle
    ├── moon.svg
    └── sun.svg
```

**Rationale**:
- Keep `app.js` as main orchestrator
- Extract utilities into separate modules for maintainability
- Storage logic separated for testing
- Export logic isolated due to external libraries

### 5.2 HTML Structure Changes

**Location**: `/Users/flavioc/Downloads/text-summarizer/static/index.html`

**Changes Required**:
1. Add theme toggle button (in `<header>` or fixed position)
2. Add copy button container (in results section)
3. Add file upload drop zone (above textarea)
4. Add export dropdown (in results section)
5. Add statistics card container (in results section)
6. Add history panel (sidebar or modal)
7. Add CDN script tags for jsPDF and docx (at end of `<body>`)

**New HTML sections to add**:

```html
<!-- Theme Toggle (fixed position) -->
<div class="theme-toggle">
  <button id="theme-toggle-btn" class="theme-toggle-btn" aria-label="Toggle dark mode">
    <svg id="theme-icon" width="24" height="24" viewBox="0 0 24 24">
      <!-- Moon icon for light mode, Sun icon for dark mode -->
    </svg>
  </button>
</div>

<!-- File Upload Zone (before textarea) -->
<div class="form-group">
  <label>Input Text</label>
  <div class="file-upload-zone" id="file-upload-zone">
    <input type="file" id="file-input" accept=".txt" hidden>
    <div class="upload-prompt">
      <span class="upload-icon">📄</span>
      <p>Drag & drop a .txt file here or <button type="button" id="browse-btn" class="link-btn">browse</button></p>
      <p class="upload-hint">Maximum file size: 5MB</p>
    </div>
    <div id="file-loaded" class="file-loaded hidden">
      <span id="filename"></span>
      <button type="button" id="clear-file-btn" class="clear-btn">×</button>
    </div>
  </div>
  <textarea id="input-text" ...></textarea>
</div>

<!-- Copy & Export Buttons (in results section) -->
<div id="results" class="results hidden">
  <div class="results-header">
    <h2>Results</h2>
    <div class="results-actions">
      <button id="copy-btn" class="btn-secondary" aria-label="Copy summary to clipboard">
        <span id="copy-icon">📋</span>
        <span id="copy-text">Copy to Clipboard</span>
      </button>
      <div class="export-dropdown">
        <button id="export-btn" class="btn-secondary">
          Export ▾
        </button>
        <div id="export-menu" class="dropdown-menu hidden">
          <button data-format="txt">Download as TXT</button>
          <button data-format="pdf">Download as PDF</button>
          <button data-format="docx">Download as DOCX</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Statistics Card -->
  <div id="statistics-card" class="statistics-card hidden">
    <h3>Summary Statistics</h3>
    <div class="stats-grid">
      <div class="stat-item">
        <span class="stat-label">Original</span>
        <span class="stat-value" id="stat-original-words">-</span>
        <span class="stat-unit">words</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Summary</span>
        <span class="stat-value" id="stat-summary-words">-</span>
        <span class="stat-unit">words</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Compression</span>
        <span class="stat-value" id="stat-compression">-</span>
        <span class="stat-unit">%</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Time Saved</span>
        <span class="stat-value" id="stat-time-saved">-</span>
        <span class="stat-unit"></span>
      </div>
    </div>
  </div>

  <div id="results-container"></div>
</div>

<!-- History Panel (sidebar) -->
<div id="history-panel" class="history-panel">
  <button id="history-toggle-btn" class="history-toggle-btn">
    📜 History
  </button>
  <div id="history-sidebar" class="history-sidebar hidden">
    <div class="history-header">
      <h3>Recent Summaries</h3>
      <button id="close-history-btn" class="close-btn">×</button>
    </div>
    <div id="history-list" class="history-list">
      <!-- History entries populated by JS -->
    </div>
    <div class="history-footer">
      <button id="clear-history-btn" class="btn-text-danger">Clear All History</button>
    </div>
  </div>
</div>

<!-- CDN Scripts (before app.js) -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/docx@7.8.2/build/index.min.js"></script>
<script src="/storage.js"></script>
<script src="/utils.js"></script>
<script src="/export.js"></script>
<script src="/app.js"></script>
```

### 5.3 CSS Organization

**Location**: `/Users/flavioc/Downloads/text-summarizer/static/style.css`

**Strategy**: Extend existing `style.css` with new sections

**Sections to Add**:
1. Dark mode variables (at top)
2. Theme toggle button styles
3. File upload zone styles
4. Copy button styles
5. Export dropdown styles
6. Statistics card styles
7. History panel styles
8. Utility classes (tooltips, etc.)

**Estimated additions**: ~400 lines of CSS

---

## 6. Component Specifications

### 6.1 Feature 1: Dark Mode Toggle

#### 6.1.1 HTML Structure

```html
<div class="theme-toggle">
  <button id="theme-toggle-btn" class="theme-toggle-btn" aria-label="Toggle dark mode">
    <svg id="theme-icon" class="theme-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <!-- Moon icon (shown in light mode) -->
      <path class="moon-icon" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      <!-- Sun icon (shown in dark mode) -->
      <g class="sun-icon hidden">
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      </g>
    </svg>
  </button>
</div>
```

#### 6.1.2 JavaScript Implementation

```javascript
/**
 * Theme Manager
 * Handles dark mode toggle and persistence
 */
const ThemeManager = {
  /**
   * Initialize theme on page load
   */
  init() {
    const savedTheme = StorageManager.getTheme();
    this.applyTheme(savedTheme);
    this.setupToggle();
  },

  /**
   * Apply theme to document
   * @param {string} theme - "light" | "dark"
   */
  applyTheme(theme) {
    const body = document.body;
    const moonIcon = document.querySelector('.moon-icon');
    const sunIcon = document.querySelector('.sun-icon');

    if (theme === 'dark') {
      body.classList.add('dark-mode');
      moonIcon.classList.add('hidden');
      sunIcon.classList.remove('hidden');
    } else {
      body.classList.remove('dark-mode');
      moonIcon.classList.remove('hidden');
      sunIcon.classList.add('hidden');
    }
  },

  /**
   * Toggle between light and dark themes
   */
  toggle() {
    const currentTheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    this.applyTheme(newTheme);
    StorageManager.setTheme(newTheme);
  },

  /**
   * Setup toggle button event listener
   */
  setupToggle() {
    const toggleBtn = document.getElementById('theme-toggle-btn');
    toggleBtn.addEventListener('click', () => this.toggle());
  }
};

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  ThemeManager.init();
});
```

#### 6.1.3 CSS Specifications

```css
/* Theme Toggle Button */
.theme-toggle {
    position: fixed;
    top: 1rem;
    right: 1rem;
    z-index: 1000;
}

.theme-toggle-btn {
    background: var(--surface-color);
    border: 2px solid var(--border-color);
    border-radius: 50%;
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: var(--theme-transition), transform 0.3s ease;
    box-shadow: var(--shadow);
}

.theme-toggle-btn:hover {
    transform: rotate(20deg);
    border-color: var(--primary-color);
}

.theme-toggle-btn:active {
    transform: scale(0.95);
}

.theme-toggle-btn:focus {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
}

.theme-icon {
    stroke: var(--text-color);
}

@media (max-width: 768px) {
    .theme-toggle {
        top: 0.5rem;
        right: 0.5rem;
    }

    .theme-toggle-btn {
        width: 44px;
        height: 44px;
    }
}
```

---

### 6.2 Feature 2: Copy to Clipboard

#### 6.2.1 Function Signature

```javascript
/**
 * Copy summary text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} - Success status
 */
async function copyToClipboard(text) {
  // Modern browsers
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('Clipboard API failed:', error);
      // Fall through to fallback
    }
  }

  // Fallback for older browsers
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);

    return successful;
  } catch (error) {
    console.error('Fallback copy failed:', error);
    return false;
  }
}

/**
 * Handle copy button click
 */
async function handleCopyClick() {
  const copyBtn = document.getElementById('copy-btn');
  const copyText = document.getElementById('copy-text');
  const copyIcon = document.getElementById('copy-icon');

  // Get summary text (combine all summaries)
  const summaryTexts = Array.from(document.querySelectorAll('.summary-text'))
    .map(el => el.textContent)
    .join('\n\n---\n\n');

  if (!summaryTexts) {
    showError('No summary to copy');
    return;
  }

  const success = await copyToClipboard(summaryTexts);

  if (success) {
    // Show success feedback
    copyIcon.textContent = '✓';
    copyText.textContent = 'Copied!';
    copyBtn.classList.add('success');

    // Reset after 2 seconds
    setTimeout(() => {
      copyIcon.textContent = '📋';
      copyText.textContent = 'Copy to Clipboard';
      copyBtn.classList.remove('success');
    }, 2000);
  } else {
    showError('Failed to copy to clipboard. Please try selecting and copying manually.');
  }
}

// Setup event listener
document.addEventListener('DOMContentLoaded', () => {
  const copyBtn = document.getElementById('copy-btn');
  if (copyBtn) {
    copyBtn.addEventListener('click', handleCopyClick);
  }
});
```

#### 6.2.2 CSS Specifications

```css
.results-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
}

.results-actions {
    display: flex;
    gap: 0.5rem;
}

.btn-secondary {
    padding: 0.5rem 1rem;
    background: var(--surface-color);
    color: var(--text-color);
    border: 2px solid var(--border-color);
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: var(--theme-transition), transform 0.1s;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.btn-secondary:hover {
    border-color: var(--primary-color);
    color: var(--primary-color);
}

.btn-secondary:active {
    transform: scale(0.98);
}

.btn-secondary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.btn-secondary.success {
    border-color: var(--success-color);
    color: var(--success-color);
}

@media (max-width: 768px) {
    .results-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
    }

    .results-actions {
        width: 100%;
        flex-direction: column;
    }

    .btn-secondary {
        width: 100%;
        justify-content: center;
    }
}
```

---

### 6.3 Feature 3: File Upload (Drag & Drop)

#### 6.3.1 JavaScript Implementation

```javascript
/**
 * File Upload Manager
 * Handles drag-drop and file picker upload
 */
const FileUploadManager = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB in bytes
  ALLOWED_TYPE: 'text/plain',

  /**
   * Initialize file upload functionality
   */
  init() {
    const dropZone = document.getElementById('file-upload-zone');
    const fileInput = document.getElementById('file-input');
    const browseBtn = document.getElementById('browse-btn');
    const clearBtn = document.getElementById('clear-file-btn');

    // Drag and drop events
    dropZone.addEventListener('dragover', (e) => this.handleDragOver(e));
    dropZone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
    dropZone.addEventListener('drop', (e) => this.handleDrop(e));

    // File picker
    browseBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

    // Clear file
    clearBtn.addEventListener('click', () => this.clearFile());
  },

  /**
   * Handle drag over event
   */
  handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('drag-over');
  },

  /**
   * Handle drag leave event
   */
  handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('drag-over');
  },

  /**
   * Handle file drop
   */
  handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('drag-over');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      this.processFile(files[0]);
    }
  },

  /**
   * Handle file input change
   */
  handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
      this.processFile(files[0]);
    }
  },

  /**
   * Validate and process uploaded file
   * @param {File} file
   */
  processFile(file) {
    // Validate file type
    if (file.type !== this.ALLOWED_TYPE && !file.name.endsWith('.txt')) {
      showError('Please upload .txt files only');
      return;
    }

    // Validate file size
    if (file.size > this.MAX_FILE_SIZE) {
      showError('File too large. Maximum size is 5MB');
      return;
    }

    // Read file
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target.result;
      this.loadFileContent(file.name, text);
    };

    reader.onerror = () => {
      showError('Failed to read file. Please try again.');
    };

    reader.readAsText(file);
  },

  /**
   * Load file content into textarea
   * @param {string} filename
   * @param {string} content
   */
  loadFileContent(filename, content) {
    const textarea = document.getElementById('input-text');
    const filenameDisplay = document.getElementById('filename');
    const fileLoaded = document.getElementById('file-loaded');
    const uploadPrompt = document.querySelector('.upload-prompt');

    // Sanitize content
    const sanitized = this.sanitizeText(content);

    textarea.value = sanitized;
    filenameDisplay.textContent = `📄 ${filename}`;

    // Update UI
    uploadPrompt.classList.add('hidden');
    fileLoaded.classList.remove('hidden');

    // Clear any errors
    hideError();
  },

  /**
   * Sanitize text content (prevent XSS)
   * @param {string} text
   * @returns {string}
   */
  sanitizeText(text) {
    // Remove any HTML tags
    const div = document.createElement('div');
    div.textContent = text;
    return div.textContent;
  },

  /**
   * Clear uploaded file
   */
  clearFile() {
    const textarea = document.getElementById('input-text');
    const fileInput = document.getElementById('file-input');
    const fileLoaded = document.getElementById('file-loaded');
    const uploadPrompt = document.querySelector('.upload-prompt');

    textarea.value = '';
    fileInput.value = '';

    uploadPrompt.classList.remove('hidden');
    fileLoaded.classList.add('hidden');
  }
};

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  FileUploadManager.init();
});
```

#### 6.3.2 CSS Specifications

```css
.file-upload-zone {
    margin-bottom: 1rem;
    border: 2px dashed var(--border-color);
    border-radius: 8px;
    padding: 1.5rem;
    text-align: center;
    transition: var(--theme-transition), border-color 0.2s;
    background: var(--bg-color);
}

.file-upload-zone.drag-over {
    border-color: var(--primary-color);
    background: rgba(59, 130, 246, 0.05);
}

.upload-prompt {
    color: var(--text-secondary);
}

.upload-icon {
    font-size: 2rem;
    display: block;
    margin-bottom: 0.5rem;
}

.upload-prompt p {
    margin: 0.25rem 0;
}

.upload-hint {
    font-size: 0.85rem;
    opacity: 0.7;
}

.link-btn {
    background: none;
    border: none;
    color: var(--primary-color);
    text-decoration: underline;
    cursor: pointer;
    padding: 0;
    font-size: inherit;
}

.link-btn:hover {
    color: var(--primary-hover);
}

.file-loaded {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--surface-color);
    padding: 0.75rem;
    border-radius: 6px;
    border: 1px solid var(--border-color);
}

.clear-btn {
    background: none;
    border: none;
    color: var(--text-secondary);
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: background-color 0.2s;
}

.clear-btn:hover {
    background: var(--error-color);
    color: white;
}

@media (max-width: 768px) {
    .file-upload-zone {
        padding: 1rem;
    }
}
```

---

### 6.4 Feature 4: Export Options (.txt, .pdf, .docx)

#### 6.4.1 Export Manager Implementation

```javascript
/**
 * Export Manager
 * Handles exporting summaries in various formats
 */
const ExportManager = {
  currentSummaryData: null,

  /**
   * Initialize export functionality
   */
  init() {
    const exportBtn = document.getElementById('export-btn');
    const exportMenu = document.getElementById('export-menu');

    // Toggle dropdown
    exportBtn.addEventListener('click', () => {
      exportMenu.classList.toggle('hidden');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!exportBtn.contains(e.target) && !exportMenu.contains(e.target)) {
        exportMenu.classList.add('hidden');
      }
    });

    // Export format buttons
    exportMenu.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const format = e.target.dataset.format;
        this.exportAs(format);
        exportMenu.classList.add('hidden');
      });
    });
  },

  /**
   * Store current summary data for export
   * @param {Object} data - Summary data from API
   */
  setSummaryData(data) {
    this.currentSummaryData = data;
  },

  /**
   * Export summary in specified format
   * @param {string} format - "txt" | "pdf" | "docx"
   */
  async exportAs(format) {
    if (!this.currentSummaryData) {
      showError('No summary to export');
      return;
    }

    try {
      switch (format) {
        case 'txt':
          this.exportAsTXT();
          break;
        case 'pdf':
          await this.exportAsPDF();
          break;
        case 'docx':
          await this.exportAsDOCX();
          break;
        default:
          throw new Error('Unknown format');
      }
    } catch (error) {
      console.error('Export failed:', error);
      showError('Failed to export. Please try again.');
    }
  },

  /**
   * Export as plain text file
   */
  exportAsTXT() {
    const content = this.buildTextContent();
    const filename = this.generateFilename('txt');

    const blob = new Blob([content], { type: 'text/plain' });
    this.downloadBlob(blob, filename);
  },

  /**
   * Export as PDF using jsPDF
   */
  async exportAsPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const metadata = this.getMetadata();
    let yPos = 20;

    // Title
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('Text Summary', 20, yPos);
    yPos += 10;

    // Metadata
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100);
    doc.text(`Generated: ${metadata.timestamp}`, 20, yPos);
    yPos += 6;
    doc.text(`Algorithm: ${metadata.algorithm}`, 20, yPos);
    yPos += 6;
    doc.text(`Original: ${metadata.originalWords} words | Summary: ${metadata.summaryWords} words (${metadata.compressionRatio} compression)`, 20, yPos);
    yPos += 12;

    // Summary text
    doc.setTextColor(0);
    doc.setFontSize(11);

    const pageWidth = doc.internal.pageSize.getWidth();
    const margins = { left: 20, right: 20, top: 20, bottom: 20 };
    const maxLineWidth = pageWidth - margins.left - margins.right;

    this.currentSummaryData.summaries.forEach((summary, index) => {
      if (index > 0) yPos += 10;

      // Algorithm heading
      doc.setFont(undefined, 'bold');
      doc.text(`${summary.algorithm}:`, 20, yPos);
      yPos += 7;

      // Summary text (wrapped)
      doc.setFont(undefined, 'normal');
      const lines = doc.splitTextToSize(summary.summary, maxLineWidth);
      lines.forEach(line => {
        if (yPos > 270) { // New page if needed
          doc.addPage();
          yPos = 20;
        }
        doc.text(line, 20, yPos);
        yPos += 6;
      });
    });

    const filename = this.generateFilename('pdf');
    doc.save(filename);
  },

  /**
   * Export as DOCX using docx.js
   */
  async exportAsDOCX() {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = docx;

    const metadata = this.getMetadata();
    const children = [];

    // Title
    children.push(
      new Paragraph({
        text: 'Text Summary',
        heading: HeadingLevel.HEADING_1,
      })
    );

    // Metadata
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Generated: ${metadata.timestamp}`,
            size: 20,
            color: '666666',
          }),
        ],
        spacing: { after: 100 },
      })
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Algorithm: ${metadata.algorithm} | Original: ${metadata.originalWords} words | Summary: ${metadata.summaryWords} words (${metadata.compressionRatio} compression)`,
            size: 20,
            color: '666666',
          }),
        ],
        spacing: { after: 300 },
      })
    );

    // Summaries
    this.currentSummaryData.summaries.forEach((summary, index) => {
      if (index > 0) {
        children.push(new Paragraph({ text: '' })); // Spacing
      }

      children.push(
        new Paragraph({
          text: summary.algorithm,
          heading: HeadingLevel.HEADING_2,
        })
      );

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: summary.summary,
              size: 24,
            }),
          ],
          spacing: { after: 200 },
        })
      );
    });

    const doc = new Document({
      sections: [{
        properties: {},
        children: children,
      }],
    });

    const blob = await Packer.toBlob(doc);
    const filename = this.generateFilename('docx');
    this.downloadBlob(blob, filename);
  },

  /**
   * Build text content for TXT export
   * @returns {string}
   */
  buildTextContent() {
    const metadata = this.getMetadata();
    let content = 'TEXT SUMMARY\n';
    content += '='.repeat(50) + '\n\n';
    content += `Generated: ${metadata.timestamp}\n`;
    content += `Algorithm: ${metadata.algorithm}\n`;
    content += `Original: ${metadata.originalWords} words | Summary: ${metadata.summaryWords} words (${metadata.compressionRatio} compression)\n\n`;
    content += '='.repeat(50) + '\n\n';

    this.currentSummaryData.summaries.forEach((summary, index) => {
      if (index > 0) content += '\n' + '-'.repeat(50) + '\n\n';
      content += `${summary.algorithm.toUpperCase()}\n\n`;
      content += summary.summary + '\n';
    });

    return content;
  },

  /**
   * Get formatted metadata
   * @returns {Object}
   */
  getMetadata() {
    const now = new Date();
    const algorithms = this.currentSummaryData.summaries.map(s => s.algorithm).join(' & ');
    const summaryWords = this.currentSummaryData.summaries[0].word_count;
    const compressionRatio = this.currentSummaryData.original_length > 0
      ? Math.round((summaryWords / this.currentSummaryData.original_length) * 100)
      : 0;

    return {
      title: 'Text Summary',
      algorithm: algorithms,
      timestamp: now.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      originalWords: this.currentSummaryData.original_length,
      summaryWords: summaryWords,
      compressionRatio: `${compressionRatio}%`
    };
  },

  /**
   * Generate filename with timestamp
   * @param {string} extension
   * @returns {string}
   */
  generateFilename(extension) {
    const now = new Date();
    const timestamp = now.toISOString().slice(0, 19).replace(/:/g, '-');
    const algorithm = this.currentSummaryData.summaries[0].algorithm.toLowerCase();
    return `summary_${timestamp}_${algorithm}.${extension}`;
  },

  /**
   * Download blob as file
   * @param {Blob} blob
   * @param {string} filename
   */
  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  ExportManager.init();
});
```

#### 6.4.2 CSS Specifications

```css
.export-dropdown {
    position: relative;
}

.dropdown-menu {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 0.5rem;
    background: var(--surface-color);
    border: 2px solid var(--border-color);
    border-radius: 8px;
    box-shadow: var(--shadow-lg);
    min-width: 180px;
    z-index: 100;
}

.dropdown-menu button {
    display: block;
    width: 100%;
    padding: 0.75rem 1rem;
    border: none;
    background: none;
    text-align: left;
    cursor: pointer;
    color: var(--text-color);
    transition: background-color 0.2s;
}

.dropdown-menu button:first-child {
    border-radius: 6px 6px 0 0;
}

.dropdown-menu button:last-child {
    border-radius: 0 0 6px 6px;
}

.dropdown-menu button:hover {
    background: var(--bg-color);
}

.dropdown-menu button:active {
    background: var(--border-color);
}
```

---

### 6.5 Feature 5: Summary Statistics

#### 6.5.1 Statistics Calculator

```javascript
/**
 * Statistics Calculator
 * Calculates and displays summary statistics
 */
const StatisticsCalculator = {
  READING_SPEED_WPM: 225, // Average reading speed: 225 words per minute

  /**
   * Calculate statistics from summary data
   * @param {Object} data - API response data
   * @returns {Object} Statistics object
   */
  calculate(data) {
    const originalWords = data.original_length;
    const summaryWords = data.summaries[0].word_count; // Use first summary

    // Compression ratio
    const compressionRatio = originalWords > 0
      ? Math.round((summaryWords / originalWords) * 100)
      : 0;

    // Reading times (in seconds)
    const originalReadingTime = Math.round((originalWords / this.READING_SPEED_WPM) * 60);
    const summaryReadingTime = Math.round((summaryWords / this.READING_SPEED_WPM) * 60);
    const timeSaved = originalReadingTime - summaryReadingTime;

    // Sentence counts (estimate based on word count)
    const sentenceCount = this.estimateSentenceCount(data.original_text || '');
    const summarySentenceCount = this.countSentences(data.summaries[0].summary);

    return {
      originalWords,
      summaryWords,
      compressionRatio,
      originalReadingTime,
      summaryReadingTime,
      timeSaved,
      sentenceCount,
      summarySentenceCount
    };
  },

  /**
   * Estimate sentence count from text
   * @param {string} text
   * @returns {number}
   */
  estimateSentenceCount(text) {
    if (!text) return 0;
    const sentences = text.match(/[.!?]+/g);
    return sentences ? sentences.length : Math.ceil(text.split(' ').length / 15);
  },

  /**
   * Count sentences in text
   * @param {string} text
   * @returns {number}
   */
  countSentences(text) {
    if (!text) return 0;
    const sentences = text.match(/[.!?]+/g);
    return sentences ? sentences.length : 1;
  },

  /**
   * Format time in human-readable format
   * @param {number} seconds
   * @returns {string}
   */
  formatTime(seconds) {
    if (seconds < 60) {
      return `${seconds} sec`;
    }
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${minutes} min ${secs} sec` : `${minutes} min`;
  },

  /**
   * Display statistics in UI
   * @param {Object} stats - Statistics object
   */
  display(stats) {
    const statsCard = document.getElementById('statistics-card');
    const statOriginalWords = document.getElementById('stat-original-words');
    const statSummaryWords = document.getElementById('stat-summary-words');
    const statCompression = document.getElementById('stat-compression');
    const statTimeSaved = document.getElementById('stat-time-saved');

    // Update values
    statOriginalWords.textContent = stats.originalWords.toLocaleString();
    statSummaryWords.textContent = stats.summaryWords.toLocaleString();
    statCompression.textContent = stats.compressionRatio;
    statTimeSaved.textContent = this.formatTime(stats.timeSaved);

    // Show card
    statsCard.classList.remove('hidden');
  },

  /**
   * Hide statistics card
   */
  hide() {
    const statsCard = document.getElementById('statistics-card');
    statsCard.classList.add('hidden');
  }
};
```

#### 6.5.2 CSS Specifications

```css
.statistics-card {
    background: linear-gradient(135deg, var(--primary-color) 0%, #6366f1 100%);
    padding: 1.5rem;
    border-radius: 12px;
    margin-bottom: 1.5rem;
    color: white;
}

body.dark-mode .statistics-card {
    background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
}

.statistics-card h3 {
    margin-bottom: 1rem;
    font-size: 1.1rem;
    color: white;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 1rem;
}

.stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    background: rgba(255, 255, 255, 0.1);
    padding: 1rem;
    border-radius: 8px;
    backdrop-filter: blur(10px);
}

.stat-label {
    font-size: 0.85rem;
    opacity: 0.9;
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.stat-value {
    font-size: 1.8rem;
    font-weight: 700;
    line-height: 1;
}

.stat-unit {
    font-size: 0.9rem;
    opacity: 0.8;
    margin-top: 0.25rem;
}

/* Tooltip for statistics */
.stat-item[data-tooltip] {
    position: relative;
    cursor: help;
}

.stat-item[data-tooltip]:hover::after {
    content: attr(data-tooltip);
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    font-size: 0.8rem;
    white-space: nowrap;
    z-index: 100;
    margin-bottom: 0.5rem;
}

@media (max-width: 768px) {
    .stats-grid {
        grid-template-columns: repeat(2, 1fr);
    }

    .stat-value {
        font-size: 1.5rem;
    }
}
```

---

### 6.6 Feature 6: Summary History

#### 6.6.1 History Manager Implementation

```javascript
/**
 * History Manager
 * Manages summary history in localStorage
 */
const HistoryManager = {
  currentActiveId: null,

  /**
   * Initialize history functionality
   */
  init() {
    this.setupToggle();
    this.loadHistory();
    this.setupEventListeners();
  },

  /**
   * Setup toggle button
   */
  setupToggle() {
    const toggleBtn = document.getElementById('history-toggle-btn');
    const sidebar = document.getElementById('history-sidebar');
    const closeBtn = document.getElementById('close-history-btn');

    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('hidden');
      if (!sidebar.classList.contains('hidden')) {
        this.loadHistory(); // Refresh when opening
      }
    });

    closeBtn.addEventListener('click', () => {
      sidebar.classList.add('hidden');
    });
  },

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    const clearAllBtn = document.getElementById('clear-history-btn');

    clearAllBtn.addEventListener('click', () => {
      this.clearAllHistory();
    });
  },

  /**
   * Save current summary to history
   * @param {Object} data - API response data
   */
  save(data) {
    const entry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      algorithm: document.querySelector('input[name="algorithm"]:checked').value,
      length: parseInt(document.getElementById('length').value),
      originalText: document.getElementById('input-text').value,
      originalWordCount: data.original_length,
      summaries: data.summaries,
      statistics: StatisticsCalculator.calculate(data)
    };

    StorageManager.addToHistory(entry);
    this.currentActiveId = entry.id;
    this.loadHistory(); // Refresh display
  },

  /**
   * Load and display history
   */
  loadHistory() {
    const history = StorageManager.getHistory();
    const historyList = document.getElementById('history-list');

    if (history.length === 0) {
      historyList.innerHTML = `
        <div class="history-empty">
          <p>No history yet</p>
          <p class="history-empty-hint">Generated summaries will appear here</p>
        </div>
      `;
      return;
    }

    historyList.innerHTML = '';

    history.forEach(entry => {
      const item = this.createHistoryItem(entry);
      historyList.appendChild(item);
    });
  },

  /**
   * Create history item element
   * @param {Object} entry - History entry
   * @returns {HTMLElement}
   */
  createHistoryItem(entry) {
    const item = document.createElement('div');
    item.className = 'history-item';
    if (entry.id === this.currentActiveId) {
      item.classList.add('active');
    }

    const date = new Date(entry.timestamp);
    const formattedDate = date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Preview (first 60 characters)
    const preview = entry.summaries[0].summary.slice(0, 60) + '...';

    // Algorithm badge
    const algorithmDisplay = entry.algorithm === 'both'
      ? 'Both'
      : entry.algorithm === 'textrank' ? 'TextRank' : 'LSA';

    item.innerHTML = `
      <div class="history-item-content">
        <div class="history-item-header">
          <span class="history-date">${formattedDate}</span>
          <span class="history-badge">${algorithmDisplay} (${entry.length} sent.)</span>
        </div>
        <p class="history-preview">${preview}</p>
        <div class="history-stats">
          <span>${entry.originalWordCount} → ${entry.summaries[0].word_count} words</span>
        </div>
      </div>
      <button class="history-delete-btn" data-id="${entry.id}" aria-label="Delete entry">×</button>
    `;

    // Click to load
    item.querySelector('.history-item-content').addEventListener('click', () => {
      this.loadEntry(entry);
    });

    // Delete button
    item.querySelector('.history-delete-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      this.deleteEntry(entry.id);
    });

    return item;
  },

  /**
   * Load history entry into UI
   * @param {Object} entry
   */
  loadEntry(entry) {
    // Populate input
    const textarea = document.getElementById('input-text');
    textarea.value = entry.originalText;

    // Simulate API response to display results
    const responseData = {
      summaries: entry.summaries,
      original_length: entry.originalWordCount
    };

    displayResults(responseData);

    // Display statistics
    StatisticsCalculator.display(entry.statistics);

    // Set as active
    this.currentActiveId = entry.id;
    this.loadHistory(); // Refresh to show active state

    // Close sidebar
    document.getElementById('history-sidebar').classList.add('hidden');

    // Scroll to results
    document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
  },

  /**
   * Delete history entry
   * @param {string} id
   */
  deleteEntry(id) {
    if (confirm('Delete this summary from history?')) {
      StorageManager.deleteHistoryEntry(id);
      if (this.currentActiveId === id) {
        this.currentActiveId = null;
      }
      this.loadHistory();
    }
  },

  /**
   * Clear all history
   */
  clearAllHistory() {
    if (confirm('Clear all history? This cannot be undone.')) {
      StorageManager.clearHistory();
      this.currentActiveId = null;
      this.loadHistory();
    }
  }
};

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  HistoryManager.init();
});
```

#### 6.6.2 CSS Specifications

```css
.history-panel {
    position: fixed;
    right: 0;
    top: 0;
    height: 100vh;
    z-index: 999;
}

.history-toggle-btn {
    position: fixed;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    background: var(--primary-color);
    color: white;
    border: none;
    border-radius: 8px 0 0 8px;
    padding: 1rem 0.75rem;
    cursor: pointer;
    writing-mode: vertical-rl;
    text-orientation: mixed;
    font-weight: 600;
    box-shadow: var(--shadow-lg);
    transition: var(--theme-transition), transform 0.2s;
}

.history-toggle-btn:hover {
    background: var(--primary-hover);
    transform: translateY(-50%) translateX(-5px);
}

.history-sidebar {
    position: fixed;
    right: 0;
    top: 0;
    width: 350px;
    height: 100vh;
    background: var(--surface-color);
    border-left: 2px solid var(--border-color);
    box-shadow: -5px 0 15px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    transition: transform 0.3s ease;
}

.history-sidebar.hidden {
    transform: translateX(100%);
}

.history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 2px solid var(--border-color);
}

.history-header h3 {
    margin: 0;
    font-size: 1.2rem;
    color: var(--text-color);
}

.close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    color: var(--text-secondary);
    cursor: pointer;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: background-color 0.2s;
}

.close-btn:hover {
    background: var(--error-color);
    color: white;
}

.history-list {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
}

.history-item {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    padding: 1rem;
    margin-bottom: 0.75rem;
    background: var(--bg-color);
    border: 2px solid var(--border-color);
    border-radius: 8px;
    cursor: pointer;
    transition: var(--theme-transition), border-color 0.2s, transform 0.1s;
}

.history-item:hover {
    border-color: var(--primary-color);
    transform: translateX(-2px);
}

.history-item.active {
    border-color: var(--primary-color);
    background: rgba(59, 130, 246, 0.05);
}

.history-item-content {
    flex: 1;
}

.history-item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
}

.history-date {
    font-size: 0.85rem;
    color: var(--text-secondary);
}

.history-badge {
    font-size: 0.75rem;
    background: var(--primary-color);
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
}

.history-preview {
    font-size: 0.9rem;
    color: var(--text-color);
    margin: 0.5rem 0;
    line-height: 1.4;
}

.history-stats {
    font-size: 0.8rem;
    color: var(--text-secondary);
}

.history-delete-btn {
    background: none;
    border: none;
    color: var(--text-secondary);
    font-size: 1.25rem;
    cursor: pointer;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: background-color 0.2s;
    flex-shrink: 0;
}

.history-delete-btn:hover {
    background: var(--error-color);
    color: white;
}

.history-empty {
    text-align: center;
    padding: 3rem 1rem;
    color: var(--text-secondary);
}

.history-empty-hint {
    font-size: 0.9rem;
    opacity: 0.7;
    margin-top: 0.5rem;
}

.history-footer {
    padding: 1rem 1.5rem;
    border-top: 2px solid var(--border-color);
}

.btn-text-danger {
    background: none;
    border: none;
    color: var(--error-color);
    cursor: pointer;
    padding: 0.5rem;
    font-size: 0.9rem;
    width: 100%;
    border-radius: 4px;
    transition: background-color 0.2s;
}

.btn-text-danger:hover {
    background: rgba(239, 68, 68, 0.1);
}

@media (max-width: 768px) {
    .history-sidebar {
        width: 100%;
    }

    .history-toggle-btn {
        display: none; /* Use hamburger menu or bottom bar on mobile */
    }
}
```

---

## 7. Integration Points

### 7.1 Feature Interaction Map

```
┌─────────────────────────────────────────────────────────────┐
│                      User Interface                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  File Upload  →  Textarea  →  API Call  →  Results Display │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┼─────────┐
                    ▼         ▼         ▼
              ┌─────────┬─────────┬─────────┐
              │Statistics│ History │  Export │
              └─────────┴─────────┴─────────┘
                    │         │         │
                    └─────────┼─────────┘
                              ▼
                      ┌───────────────┐
                      │ LocalStorage  │
                      └───────────────┘
```

### 7.2 Shared Utilities Needed

**File**: `/Users/flavioc/Downloads/text-summarizer/static/utils.js`

```javascript
/**
 * Utility functions shared across features
 */

/**
 * Word count utility
 * @param {string} text
 * @returns {number}
 */
function countWords(text) {
  if (!text || text.trim() === '') return 0;
  return text.trim().split(/\s+/).length;
}

/**
 * Sentence count utility
 * @param {string} text
 * @returns {number}
 */
function countSentences(text) {
  if (!text) return 0;
  const sentences = text.match(/[.!?]+/g);
  return sentences ? sentences.length : 0;
}

/**
 * Sanitize HTML to prevent XSS
 * @param {string} text
 * @returns {string}
 */
function sanitizeHTML(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Format timestamp to human-readable
 * @param {string} isoString - ISO 8601 timestamp
 * @returns {string}
 */
function formatTimestamp(isoString) {
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Debounce function
 * @param {Function} func
 * @param {number} wait - Milliseconds to wait
 * @returns {Function}
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Check if localStorage is available
 * @returns {boolean}
 */
function isLocalStorageAvailable() {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}
```

### 7.3 Event Flow Diagram

```
User Action: Generate Summary
│
├─> File Upload (if file provided)
│   └─> Populate textarea
│
├─> Form Submit
│   ├─> Validate input
│   ├─> Call API
│   └─> Receive response
│
├─> Display Results
│   ├─> displayResults(data)
│   ├─> Calculate Statistics → StatisticsCalculator.calculate(data)
│   ├─> Display Statistics → StatisticsCalculator.display(stats)
│   ├─> Save to History → HistoryManager.save(data)
│   ├─> Store for Export → ExportManager.setSummaryData(data)
│   └─> Enable Copy & Export buttons
│
└─> User Actions on Results
    ├─> Copy to Clipboard → copyToClipboard()
    ├─> Export (TXT/PDF/DOCX) → ExportManager.exportAs(format)
    └─> View in History → HistoryManager.loadEntry(entry)
```

### 7.4 Modified app.js displayResults Function

```javascript
/**
 * Display results and trigger all dependent features
 * @param {Object} data - API response
 */
function displayResults(data) {
    // Clear previous results
    resultsContainer.innerHTML = '';

    // Show original text stats
    const statsCard = document.createElement('div');
    statsCard.className = 'summary-card';
    statsCard.innerHTML = `
        <h3>📊 Original Text</h3>
        <p class="summary-stats">Word count: ${data.original_length} words</p>
    `;
    resultsContainer.appendChild(statsCard);

    // Display each summary
    data.summaries.forEach(summary => {
        const card = document.createElement('div');
        card.className = 'summary-card';

        const reductionPercent = data.original_length > 0
            ? Math.round((1 - summary.word_count / data.original_length) * 100)
            : 0;

        card.innerHTML = `
            <h3>✨ ${summary.algorithm}</h3>
            <p class="summary-stats">
                ${summary.word_count} words
                ${reductionPercent > 0 ? `(${reductionPercent}% reduction)` : ''}
            </p>
            <p class="summary-text">${summary.summary || 'No summary generated'}</p>
        `;

        resultsContainer.appendChild(card);
    });

    // Show results section
    results.classList.remove('hidden');

    // === NEW: Trigger dependent features ===

    // 1. Calculate and display statistics
    const stats = StatisticsCalculator.calculate({
        ...data,
        original_text: inputText.value // Pass original text for sentence counting
    });
    StatisticsCalculator.display(stats);

    // 2. Save to history
    HistoryManager.save({
        ...data,
        statistics: stats
    });

    // 3. Enable export functionality
    ExportManager.setSummaryData(data);
    document.getElementById('export-btn').disabled = false;

    // 4. Enable copy button
    document.getElementById('copy-btn').disabled = false;

    // Scroll to results
    results.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
```

---

## 8. Testing Strategy

### 8.1 Test File Organization

```
tests/
├── test_api.py                 # Existing API tests (5 tests)
├── test_summarizers.py         # Existing unit tests (10 tests)
├── test_frontend.html          # NEW: Frontend test harness
├── test_dark_mode.js           # NEW: Dark mode tests
├── test_clipboard.js           # NEW: Clipboard tests
├── test_file_upload.js         # NEW: File upload tests
├── test_export.js              # NEW: Export tests
├── test_statistics.js          # NEW: Statistics tests
├── test_history.js             # NEW: History tests
└── test_integration.js         # NEW: Integration tests
```

### 8.2 Frontend Testing Approach

**Framework**: QUnit (lightweight, no build step required)

**CDN**: `https://code.jquery.com/qunit/qunit-2.19.4.js`

**Test Harness** (`test_frontend.html`):

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Text Summarizer Frontend Tests</title>
  <link rel="stylesheet" href="https://code.jquery.com/qunit/qunit-2.19.4.css">
</head>
<body>
  <div id="qunit"></div>
  <div id="qunit-fixture"></div>

  <!-- Include application code -->
  <script src="/storage.js"></script>
  <script src="/utils.js"></script>

  <!-- Include test files -->
  <script src="https://code.jquery.com/qunit/qunit-2.19.4.js"></script>
  <script src="test_dark_mode.js"></script>
  <script src="test_clipboard.js"></script>
  <script src="test_file_upload.js"></script>
  <script src="test_export.js"></script>
  <script src="test_statistics.js"></script>
  <script src="test_history.js"></script>
  <script src="test_integration.js"></script>
</body>
</html>
```

### 8.3 Example Test: Dark Mode (`test_dark_mode.js`)

```javascript
QUnit.module('Dark Mode', hooks => {
  hooks.beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  QUnit.test('Theme preference saves to localStorage', assert => {
    StorageManager.setTheme('dark');
    const saved = StorageManager.getTheme();
    assert.equal(saved, 'dark', 'Dark theme saved correctly');
  });

  QUnit.test('Theme preference defaults to light', assert => {
    const theme = StorageManager.getTheme();
    assert.equal(theme, 'light', 'Default theme is light');
  });

  QUnit.test('CSS class toggles on body', assert => {
    const body = document.body;

    // Apply dark theme
    body.classList.add('dark-mode');
    assert.ok(body.classList.contains('dark-mode'), 'Dark mode class added');

    // Remove dark theme
    body.classList.remove('dark-mode');
    assert.notOk(body.classList.contains('dark-mode'), 'Dark mode class removed');
  });
});
```

### 8.4 Example Test: Statistics (`test_statistics.js`)

```javascript
QUnit.module('Statistics Calculator', () => {

  QUnit.test('Compression ratio calculates correctly', assert => {
    const data = {
      original_length: 1000,
      summaries: [{ word_count: 200 }]
    };

    const stats = StatisticsCalculator.calculate(data);
    assert.equal(stats.compressionRatio, 20, 'Compression ratio is 20%');
  });

  QUnit.test('Reading time calculates correctly', assert => {
    const data = {
      original_length: 225, // 1 minute at 225 WPM
      summaries: [{ word_count: 45, summary: 'Test summary.' }]
    };

    const stats = StatisticsCalculator.calculate(data);
    assert.equal(stats.originalReadingTime, 60, 'Original reading time is 60 seconds');
    assert.equal(stats.summaryReadingTime, 12, 'Summary reading time is 12 seconds');
    assert.equal(stats.timeSaved, 48, 'Time saved is 48 seconds');
  });

  QUnit.test('Time formatting works correctly', assert => {
    assert.equal(StatisticsCalculator.formatTime(30), '30 sec');
    assert.equal(StatisticsCalculator.formatTime(60), '1 min');
    assert.equal(StatisticsCalculator.formatTime(125), '2 min 5 sec');
  });
});
```

### 8.5 Mock Strategies

#### Mock localStorage (for CI/CD environments)

```javascript
// Mock localStorage if not available
if (!window.localStorage) {
  window.localStorage = {
    _data: {},
    setItem(key, value) {
      this._data[key] = value;
    },
    getItem(key) {
      return this._data[key] || null;
    },
    removeItem(key) {
      delete this._data[key];
    },
    clear() {
      this._data = {};
    }
  };
}
```

#### Mock Clipboard API

```javascript
// Mock clipboard for testing
const mockClipboard = {
  _text: '',
  writeText(text) {
    this._text = text;
    return Promise.resolve();
  },
  readText() {
    return Promise.resolve(this._text);
  }
};

// Use in tests
if (!navigator.clipboard) {
  navigator.clipboard = mockClipboard;
}
```

#### Mock FileReader

```javascript
// Mock FileReader for testing
class MockFileReader {
  readAsText(file) {
    setTimeout(() => {
      this.result = file._mockContent || 'Mock file content';
      this.onload({ target: this });
    }, 10);
  }
}
```

### 8.6 Browser Testing Matrix

| Feature | Chrome | Firefox | Safari | Edge | Mobile Safari | Chrome Android |
|---------|--------|---------|--------|------|---------------|----------------|
| Dark Mode | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Clipboard | ✓ | ✓ | ✓ (13.1+) | ✓ | ✓ (13.1+) | ✓ |
| File Upload | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Export (PDF) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Export (DOCX) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| History | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

**Testing Tools**:
- Chrome DevTools (desktop & mobile emulation)
- BrowserStack (cross-browser testing)
- Lighthouse (accessibility & performance)
- WAVE (accessibility)

---

## 9. Performance Considerations

### 9.1 Lazy Loading Strategy for Export Libraries

```javascript
/**
 * Lazy load export libraries only when needed
 */
const LibraryLoader = {
  loaded: {
    jspdf: false,
    docx: false
  },

  /**
   * Load jsPDF library
   * @returns {Promise}
   */
  async loadJsPDF() {
    if (this.loaded.jspdf) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      script.onload = () => {
        this.loaded.jspdf = true;
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  },

  /**
   * Load docx library
   * @returns {Promise}
   */
  async loadDocx() {
    if (this.loaded.docx) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/docx@7.8.2/build/index.min.js';
      script.onload = () => {
        this.loaded.docx = true;
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
};

// Modified export functions
async function exportAsPDF() {
  await LibraryLoader.loadJsPDF();
  // ... rest of PDF export logic
}

async function exportAsDOCX() {
  await LibraryLoader.loadDocx();
  // ... rest of DOCX export logic
}
```

**Performance Gain**: Reduces initial page load by ~500KB

### 9.2 LocalStorage Size Management

```javascript
/**
 * Monitor localStorage usage
 */
const StorageMonitor = {
  /**
   * Get approximate localStorage size in bytes
   * @returns {number}
   */
  getSize() {
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length;
      }
    }
    return total;
  },

  /**
   * Get size in human-readable format
   * @returns {string}
   */
  getSizeFormatted() {
    const bytes = this.getSize();
    const kb = Math.round(bytes / 1024);
    const mb = (bytes / (1024 * 1024)).toFixed(2);
    return kb < 1024 ? `${kb} KB` : `${mb} MB`;
  },

  /**
   * Check if near quota
   * @returns {boolean}
   */
  isNearQuota() {
    const size = this.getSize();
    const quota = 5 * 1024 * 1024; // 5MB typical quota
    return size > quota * 0.8; // 80% threshold
  }
};
```

**Action**: Warn user if localStorage usage > 4MB

### 9.3 Debouncing Statistics Calculations

```javascript
// Debounce statistics display when slider changes
const debouncedStatisticsUpdate = debounce(() => {
  if (currentSummaryData) {
    const stats = StatisticsCalculator.calculate(currentSummaryData);
    StatisticsCalculator.display(stats);
  }
}, 300);

lengthSlider.addEventListener('input', debouncedStatisticsUpdate);
```

### 9.4 Performance Budget

| Metric | Target | Max Acceptable |
|--------|--------|----------------|
| Initial Load Time | < 1s | < 2s |
| Time to Interactive | < 2s | < 3s |
| Export Generation (PDF) | < 1s | < 2s |
| Export Generation (DOCX) | < 1.5s | < 3s |
| History Load Time | < 100ms | < 200ms |
| Theme Toggle | < 50ms | < 100ms |
| localStorage Read/Write | < 10ms | < 50ms |

---

## 10. Security & Validation

### 10.1 XSS Prevention

#### File Upload Sanitization

```javascript
/**
 * Sanitize uploaded file content
 * Removes any HTML/script tags
 */
function sanitizeFileContent(text) {
  // Remove HTML tags
  const temp = document.createElement('div');
  temp.textContent = text;

  // Remove potential script execution
  let sanitized = temp.innerHTML;

  // Additional sanitization: remove javascript: urls
  sanitized = sanitized.replace(/javascript:/gi, '');

  // Remove data: urls
  sanitized = sanitized.replace(/data:text\/html/gi, '');

  return temp.textContent; // Return plain text only
}
```

#### Display Sanitization

```javascript
/**
 * Sanitize text before display
 * Used when displaying user-generated content
 */
function sanitizeForDisplay(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
```

### 10.2 Input Validation Rules

#### File Upload Validation

```javascript
const FILE_VALIDATION = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['text/plain'],
  allowedExtensions: ['.txt'],

  validate(file) {
    const errors = [];

    // Check file type
    if (!this.allowedTypes.includes(file.type) &&
        !this.allowedExtensions.some(ext => file.name.endsWith(ext))) {
      errors.push('Only .txt files are allowed');
    }

    // Check file size
    if (file.size > this.maxSize) {
      errors.push('File size exceeds 5MB limit');
    }

    // Check file name (prevent path traversal)
    if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
      errors.push('Invalid file name');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
};
```

#### Text Input Validation

```javascript
const TEXT_VALIDATION = {
  minLength: 50, // Minimum 50 characters for meaningful summary
  maxLength: 1000000, // 1M characters max

  validate(text) {
    const trimmed = text.trim();
    const errors = [];

    if (trimmed.length === 0) {
      errors.push('Please enter some text to summarize');
    } else if (trimmed.length < this.minLength) {
      errors.push(`Text must be at least ${this.minLength} characters`);
    } else if (trimmed.length > this.maxLength) {
      errors.push(`Text exceeds maximum length of ${this.maxLength} characters`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
};
```

### 10.3 Content Security Policy (CSP)

**Recommendation**: Add CSP meta tag to `index.html`

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net;
  style-src 'self' 'unsafe-inline';
  connect-src 'self';
  img-src 'self' data:;
  font-src 'self';
">
```

**Note**: `'unsafe-inline'` for styles is needed for dynamic styling. Can be removed if all styles move to CSS files.

### 10.4 localStorage Security

```javascript
/**
 * Secure localStorage wrapper
 * Prevents storing sensitive data
 */
const SecureStorage = {
  SENSITIVE_PATTERNS: [
    /password/i,
    /ssn/i,
    /credit.?card/i,
    /api.?key/i,
    /secret/i,
    /token/i
  ],

  /**
   * Check if text contains sensitive data
   * @param {string} text
   * @returns {boolean}
   */
  containsSensitiveData(text) {
    return this.SENSITIVE_PATTERNS.some(pattern => pattern.test(text));
  },

  /**
   * Safe set item
   * @param {string} key
   * @param {string} value
   */
  setItem(key, value) {
    // Don't warn for theme preference
    if (key === StorageManager.KEYS.THEME) {
      localStorage.setItem(key, value);
      return;
    }

    // Check for sensitive data in history
    if (this.containsSensitiveData(value)) {
      console.warn('Warning: Potentially sensitive data detected. Not saving to localStorage.');
      return;
    }

    localStorage.setItem(key, value);
  }
};
```

### 10.5 Error Handling Patterns

```javascript
/**
 * Global error handler
 */
window.addEventListener('error', (event) => {
  console.error('Unhandled error:', event.error);

  // Don't expose technical details to user
  showError('An unexpected error occurred. Please try again.');

  // Log to console for debugging (in production, send to logging service)
  if (window.location.hostname !== 'localhost') {
    // Send to error tracking service
  }
});

/**
 * Promise rejection handler
 */
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  showError('An unexpected error occurred. Please try again.');
});
```

---

## Implementation Checklist for Vitalic

### Phase 1: Quick Wins

- [ ] **Feature 2: Copy to Clipboard**
  - [ ] Add HTML structure (copy button)
  - [ ] Implement copyToClipboard() function
  - [ ] Add CSS styling
  - [ ] Add success feedback animation
  - [ ] Write tests (3 tests)
  - [ ] Manual testing across browsers

- [ ] **Feature 1: Dark Mode**
  - [ ] Add CSS variables for dark mode
  - [ ] Create dark mode CSS overrides
  - [ ] Add theme toggle button HTML
  - [ ] Implement ThemeManager in app.js
  - [ ] Add localStorage persistence
  - [ ] Test WCAG AA contrast ratios
  - [ ] Write tests (4 tests)

### Phase 2: Core Functionality

- [ ] **Feature 5: Summary Statistics**
  - [ ] Create StatisticsCalculator utility
  - [ ] Add HTML structure (statistics card)
  - [ ] Add CSS styling
  - [ ] Integrate with displayResults()
  - [ ] Add tooltips (optional)
  - [ ] Write tests (6 tests)

- [ ] **Feature 6: Summary History**
  - [ ] Create storage.js with StorageManager
  - [ ] Add HTML structure (sidebar)
  - [ ] Implement HistoryManager
  - [ ] Add CSS styling
  - [ ] Integrate with displayResults()
  - [ ] Add delete & clear functionality
  - [ ] Write tests (8 tests)

### Phase 3: Advanced Features

- [ ] **Feature 3: File Upload**
  - [ ] Add HTML structure (drop zone)
  - [ ] Implement FileUploadManager
  - [ ] Add drag-drop event handlers
  - [ ] Add file validation
  - [ ] Add CSS styling
  - [ ] Add mobile file picker
  - [ ] Write tests (7 tests)

- [ ] **Feature 4: Export Options**
  - [ ] Add CDN script tags (jsPDF, docx)
  - [ ] Add HTML structure (export dropdown)
  - [ ] Implement export.js with ExportManager
  - [ ] Implement TXT export
  - [ ] Implement PDF export
  - [ ] Implement DOCX export
  - [ ] Add CSS styling
  - [ ] Write tests (9 tests)

### Final Steps

- [ ] Update README.md with new features
- [ ] Update CLAUDE.md with implementation notes
- [ ] Run full test suite (existing + new tests)
- [ ] Cross-browser testing
- [ ] Accessibility audit (WAVE/axe)
- [ ] Performance audit (Lighthouse)
- [ ] Git commit with descriptive message
- [ ] Handoff to Athena for QA

---

## Notes for Vitalic

1. **Preserve Existing Functionality**: All 15 existing tests must continue to pass.

2. **Code Style**: Match existing code style in app.js (camelCase, const/let, arrow functions).

3. **Comments**: Add JSDoc comments for all new functions.

4. **Error Handling**: Use try-catch for async operations, validate inputs.

5. **Mobile First**: Test on mobile as you build, don't wait until the end.

6. **Git Commits**: Commit after each feature completion with descriptive messages.

7. **Questions**: Flag any blockers or unclear requirements immediately.

8. **Testing**: Write tests alongside implementation (TDD approach recommended).

9. **Accessibility**: Add ARIA labels, ensure keyboard navigation works.

10. **Performance**: Use lazy loading for export libraries, debounce where needed.

---

**End of Technical Specifications**

*This document provides all technical details needed for implementation. Vitalic should use this as the definitive blueprint for building all P1 features.*

**Created by**: Colombo (Software Architect Agent)
**Status**: ✅ READY FOR IMPLEMENTATION
**Next Agent**: Vitalic (Builder)
