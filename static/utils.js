/**
 * Utility functions for text-summarizer
 */

/**
 * Count words in text
 * @param {string} text
 * @returns {number}
 */
function countWords(text) {
    if (!text || typeof text !== 'string') return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Count sentences in text
 * @param {string} text
 * @returns {number}
 */
function countSentences(text) {
    if (!text || typeof text !== 'string') return 0;
    // Match sentence-ending punctuation
    const sentences = text.match(/[^.!?]+[.!?]+/g);
    return sentences ? sentences.length : 0;
}

/**
 * Calculate reading time in seconds
 * @param {number} wordCount
 * @param {number} wordsPerMinute - Default 225 wpm (average reading speed)
 * @returns {number} - Reading time in seconds
 */
function calculateReadingTime(wordCount, wordsPerMinute = 225) {
    if (!wordCount || wordCount <= 0) return 0;
    return Math.ceil((wordCount / wordsPerMinute) * 60);
}

/**
 * Format time in seconds to human-readable format
 * @param {number} seconds
 * @returns {string}
 */
function formatTime(seconds) {
    if (!seconds || seconds <= 0) return '0s';

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes === 0) {
        return `${remainingSeconds}s`;
    } else if (remainingSeconds === 0) {
        return `${minutes}m`;
    } else {
        return `${minutes}m ${remainingSeconds}s`;
    }
}

/**
 * Calculate compression ratio
 * @param {number} originalWordCount
 * @param {number} summaryWordCount
 * @returns {number} - Compression ratio as percentage
 */
function calculateCompressionRatio(originalWordCount, summaryWordCount) {
    if (!originalWordCount || originalWordCount <= 0) return 0;
    return Math.round((summaryWordCount / originalWordCount) * 100);
}

/**
 * Calculate statistics for a summary
 * @param {string} originalText
 * @param {Array} summaries - Array of summary objects
 * @returns {Object} - Statistics object
 */
function calculateStatistics(originalText, summaries) {
    const originalWordCount = countWords(originalText);
    const originalSentenceCount = countSentences(originalText);

    // Calculate average summary word count
    const totalSummaryWords = summaries.reduce((sum, s) => sum + (s.word_count || 0), 0);
    const avgSummaryWords = summaries.length > 0 ? Math.round(totalSummaryWords / summaries.length) : 0;

    // Calculate reading times
    const originalReadingTime = calculateReadingTime(originalWordCount);
    const summaryReadingTime = calculateReadingTime(avgSummaryWords);
    const timeSaved = Math.max(0, originalReadingTime - summaryReadingTime);

    // Calculate compression ratio
    const compressionRatio = calculateCompressionRatio(originalWordCount, avgSummaryWords);

    return {
        originalWordCount,
        originalSentenceCount,
        summaryWordCount: avgSummaryWords,
        compressionRatio,
        originalReadingTime,
        summaryReadingTime,
        timeSaved
    };
}

/**
 * Display statistics in the UI
 * @param {Object} stats - Statistics object
 */
function displayStatistics(stats) {
    const statsCard = document.getElementById('statistics-card');
    const statOriginalWords = document.getElementById('stat-original-words');
    const statSummaryWords = document.getElementById('stat-summary-words');
    const statCompression = document.getElementById('stat-compression');
    const statTimeSaved = document.getElementById('stat-time-saved');

    if (!statsCard) return;

    // Update values
    statOriginalWords.textContent = stats.originalWordCount.toLocaleString();
    statSummaryWords.textContent = stats.summaryWordCount.toLocaleString();
    statCompression.textContent = stats.compressionRatio;
    statTimeSaved.textContent = formatTime(stats.timeSaved);

    // Show card
    statsCard.classList.remove('hidden');
}

/**
 * Hide statistics card
 */
function hideStatistics() {
    const statsCard = document.getElementById('statistics-card');
    if (statsCard) {
        statsCard.classList.add('hidden');
    }
}

/**
 * Generate timestamp in ISO format
 * @returns {string}
 */
function generateTimestamp() {
    return new Date().toISOString();
}

/**
 * Format timestamp for display
 * @param {string} isoString - ISO 8601 timestamp
 * @returns {string}
 */
function formatTimestamp(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

/**
 * Sanitize text content (prevent XSS)
 * @param {string} text
 * @returns {string}
 */
function sanitizeText(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.textContent;
}
