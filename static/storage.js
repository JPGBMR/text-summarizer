/**
 * LocalStorage manager for the text-summarizer application
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
     * @returns {Array}
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
     * @param {Object} entry
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
