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

        if (!dropZone || !fileInput || !browseBtn || !clearBtn) return;

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
        const sanitized = sanitizeText(content);

        textarea.value = sanitized;
        filenameDisplay.textContent = `📄 ${filename}`;

        // Update UI
        uploadPrompt.classList.add('hidden');
        fileLoaded.classList.remove('hidden');

        // Clear any errors
        hideError();
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

/**
 * History Manager
 * Handles summary history persistence and display
 */
const HistoryManager = {
    currentActiveId: null,

    /**
     * Initialize history functionality
     */
    init() {
        this.setupEventListeners();
        this.loadHistory();
    },

    /**
     * Setup event listeners for history panel
     */
    setupEventListeners() {
        const toggleBtn = document.getElementById('history-toggle-btn');
        const closeBtn = document.getElementById('close-history-btn');
        const clearBtn = document.getElementById('clear-history-btn');
        const sidebar = document.getElementById('history-sidebar');

        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleSidebar());
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeSidebar());
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearAllHistory());
        }

        // Close sidebar when clicking outside
        document.addEventListener('click', (e) => {
            if (sidebar && !sidebar.classList.contains('hidden')) {
                if (!sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
                    this.closeSidebar();
                }
            }
        });
    },

    /**
     * Toggle history sidebar
     */
    toggleSidebar() {
        const sidebar = document.getElementById('history-sidebar');
        if (sidebar) {
            sidebar.classList.toggle('hidden');
            if (!sidebar.classList.contains('hidden')) {
                this.loadHistory();
            }
        }
    },

    /**
     * Close history sidebar
     */
    closeSidebar() {
        const sidebar = document.getElementById('history-sidebar');
        if (sidebar) {
            sidebar.classList.add('hidden');
        }
    },

    /**
     * Save current summary to history
     * @param {Object} data - Summary data from API
     * @param {string} originalText - Original input text
     * @param {string} algorithm - Algorithm used
     * @param {number} length - Summary length
     * @param {Object} stats - Statistics object
     */
    saveToHistory(data, originalText, algorithm, length, stats) {
        const entry = {
            id: Date.now().toString(),
            timestamp: generateTimestamp(),
            algorithm: algorithm,
            length: length,
            originalText: originalText,
            originalWordCount: data.original_length,
            summaries: data.summaries,
            statistics: stats
        };

        StorageManager.addToHistory(entry);
        this.currentActiveId = entry.id;
        this.loadHistory();
    },

    /**
     * Load and display history entries
     */
    loadHistory() {
        const historyList = document.getElementById('history-list');
        if (!historyList) return;

        const history = StorageManager.getHistory();

        if (history.length === 0) {
            historyList.innerHTML = `
                <div class="history-empty">
                    <div class="history-empty-icon">📜</div>
                    <p>No summaries yet</p>
                    <p style="font-size: 0.85rem;">Your recent summaries will appear here</p>
                </div>
            `;
            return;
        }

        historyList.innerHTML = history.map(entry => this.renderHistoryItem(entry)).join('');

        // Add click listeners to history items
        historyList.querySelectorAll('.history-item').forEach(item => {
            const entryId = item.dataset.id;
            const deleteBtn = item.querySelector('.history-item-delete');

            item.addEventListener('click', (e) => {
                if (!deleteBtn.contains(e.target)) {
                    this.loadFromHistory(entryId);
                }
            });

            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteEntry(entryId);
            });
        });
    },

    /**
     * Render a history item
     * @param {Object} entry - History entry
     * @returns {string} - HTML string
     */
    renderHistoryItem(entry) {
        const preview = entry.summaries[0]?.summary.substring(0, 60) + '...' || 'No summary';
        const isActive = entry.id === this.currentActiveId ? 'active' : '';

        return `
            <div class="history-item ${isActive}" data-id="${entry.id}">
                <div class="history-item-header">
                    <span class="history-item-time">${formatTimestamp(entry.timestamp)}</span>
                    <button class="history-item-delete" aria-label="Delete entry">×</button>
                </div>
                <div class="history-item-preview">${sanitizeText(preview)}</div>
                <div class="history-item-meta">
                    <span>${entry.algorithm}</span>
                    <span>•</span>
                    <span>${entry.length} sent.</span>
                    <span>•</span>
                    <span>${entry.statistics.compressionRatio}%</span>
                </div>
            </div>
        `;
    },

    /**
     * Load a summary from history
     * @param {string} entryId - Entry ID
     */
    loadFromHistory(entryId) {
        const history = StorageManager.getHistory();
        const entry = history.find(e => e.id === entryId);

        if (!entry) return;

        // Populate input textarea
        inputText.value = entry.originalText;

        // Set algorithm radio button
        const algorithmRadio = document.querySelector(`input[name="algorithm"][value="${entry.algorithm}"]`);
        if (algorithmRadio) {
            algorithmRadio.checked = true;
        }

        // Set length slider
        lengthSlider.value = entry.length;
        lengthValue.textContent = entry.length;

        // Display results
        const data = {
            summaries: entry.summaries,
            original_length: entry.originalWordCount
        };
        displayResults(data);

        // Mark as active
        this.currentActiveId = entryId;
        this.loadHistory();

        // Close sidebar
        this.closeSidebar();

        // Scroll to results
        results.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    },

    /**
     * Delete a history entry
     * @param {string} entryId - Entry ID
     */
    deleteEntry(entryId) {
        if (confirm('Delete this summary from history?')) {
            StorageManager.deleteHistoryEntry(entryId);
            if (this.currentActiveId === entryId) {
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
            if (moonIcon) moonIcon.classList.add('hidden');
            if (sunIcon) sunIcon.classList.remove('hidden');
        } else {
            body.classList.remove('dark-mode');
            if (moonIcon) moonIcon.classList.remove('hidden');
            if (sunIcon) sunIcon.classList.add('hidden');
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
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggle());
        }
    }
};

// DOM elements
const form = document.getElementById('summarize-form');
const inputText = document.getElementById('input-text');
const lengthSlider = document.getElementById('length');
const lengthValue = document.getElementById('length-value');
const submitBtn = document.getElementById('submit-btn');
const loading = document.getElementById('loading');
const results = document.getElementById('results');
const resultsContainer = document.getElementById('results-container');
const errorDiv = document.getElementById('error');

// Update length display
lengthSlider.addEventListener('input', (e) => {
    lengthValue.textContent = e.target.value;
});

// Form submission
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Clear previous results and errors
    hideError();
    hideResults();

    // Validate input
    const text = inputText.value.trim();
    if (!text) {
        showError('Please enter some text to summarize');
        return;
    }

    // Get form data
    const algorithm = document.querySelector('input[name="algorithm"]:checked').value;
    const length = parseInt(lengthSlider.value);

    // Show loading state
    showLoading();

    try {
        // Call API
        const response = await fetch('/api/summarize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: text,
                algorithm: algorithm,
                length: length
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Summarization failed');
        }

        const data = await response.json();

        // Save to history
        const stats = calculateStatistics(text, data.summaries);
        HistoryManager.saveToHistory(data, text, algorithm, length, stats);

        // Store data for export
        ExportManager.setSummaryData(data, text, algorithm, length);

        displayResults(data);

    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
});

function showLoading() {
    loading.classList.remove('hidden');
    submitBtn.disabled = true;
}

function hideLoading() {
    loading.classList.add('hidden');
    submitBtn.disabled = false;
}

function showError(message) {
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
}

function hideError() {
    errorDiv.classList.add('hidden');
}

function hideResults() {
    results.classList.add('hidden');
    resultsContainer.innerHTML = '';
    hideStatistics();
}

function displayResults(data) {
    // Clear previous results
    resultsContainer.innerHTML = '';

    // Calculate and display statistics
    const originalText = inputText.value.trim();
    const stats = calculateStatistics(originalText, data.summaries);
    displayStatistics(stats);

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

    // Scroll to results
    results.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

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

// Initialize app on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize theme
    ThemeManager.init();

    // Initialize history
    HistoryManager.init();

    // Initialize file upload
    FileUploadManager.init();

    // Initialize export
    ExportManager.init();

    // Setup copy button
    const copyBtn = document.getElementById('copy-btn');
    if (copyBtn) {
        copyBtn.addEventListener('click', handleCopyClick);
    }
});
