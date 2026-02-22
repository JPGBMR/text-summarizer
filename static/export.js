/**
 * Export Manager
 * Handles exporting summaries in various formats
 */
const ExportManager = {
    currentSummaryData: null,
    currentOriginalText: null,
    currentAlgorithm: null,
    currentLength: null,

    /**
     * Initialize export functionality
     */
    init() {
        const exportBtn = document.getElementById('export-btn');
        const exportMenu = document.getElementById('export-menu');

        if (!exportBtn || !exportMenu) return;

        // Toggle dropdown
        exportBtn.addEventListener('click', (e) => {
            e.stopPropagation();
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
     * @param {string} originalText - Original input text
     * @param {string} algorithm - Algorithm used
     * @param {number} length - Summary length
     */
    setSummaryData(data, originalText, algorithm, length) {
        this.currentSummaryData = data;
        this.currentOriginalText = originalText;
        this.currentAlgorithm = algorithm;
        this.currentLength = length;
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
        if (!window.jspdf) {
            throw new Error('jsPDF library not loaded');
        }

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
        if (!window.docx) {
            throw new Error('docx library not loaded');
        }

        const { Document, Packer, Paragraph, TextRun, HeadingLevel } = window.docx;

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
        content += '='.repeat(60) + '\n\n';
        content += `Generated: ${metadata.timestamp}\n`;
        content += `Algorithm: ${metadata.algorithm}\n`;
        content += `Original: ${metadata.originalWords} words\n`;
        content += `Summary: ${metadata.summaryWords} words (${metadata.compressionRatio} compression)\n\n`;
        content += '='.repeat(60) + '\n\n';

        this.currentSummaryData.summaries.forEach((summary, index) => {
            if (index > 0) content += '\n' + '-'.repeat(60) + '\n\n';
            content += `${summary.algorithm}:\n\n`;
            content += summary.summary + '\n';
        });

        return content;
    },

    /**
     * Get metadata for export
     * @returns {Object}
     */
    getMetadata() {
        const now = new Date();
        const timestamp = now.toLocaleString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });

        // Calculate average summary word count
        const totalSummaryWords = this.currentSummaryData.summaries.reduce(
            (sum, s) => sum + (s.word_count || 0), 0
        );
        const avgSummaryWords = this.currentSummaryData.summaries.length > 0
            ? Math.round(totalSummaryWords / this.currentSummaryData.summaries.length)
            : 0;

        const compressionRatio = this.currentSummaryData.original_length > 0
            ? Math.round((avgSummaryWords / this.currentSummaryData.original_length) * 100)
            : 0;

        return {
            title: 'Text Summary',
            algorithm: this.currentAlgorithm,
            timestamp: timestamp,
            originalWords: this.currentSummaryData.original_length,
            summaryWords: avgSummaryWords,
            compressionRatio: `${compressionRatio}%`
        };
    },

    /**
     * Generate filename with timestamp
     * @param {string} extension - File extension
     * @returns {string}
     */
    generateFilename(extension) {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
        return `summary_${dateStr}_${timeStr}_${this.currentAlgorithm}.${extension}`;
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
