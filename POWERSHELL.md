# PowerShell Text Summarizer

A standalone PowerShell implementation of text summarization using word frequency tokenization.

## Overview

This script provides a simple, dependency-free approach to text summarization using extractive methods. Unlike the Python version which uses advanced algorithms like TextRank and LSA, this PowerShell version uses a straightforward word frequency-based approach.

## How It Works

The summarization process follows these steps:

1. **Tokenization**: Text is split into sentences and words
2. **Stop Word Filtering**: Common words (the, and, of, etc.) are excluded
3. **Frequency Analysis**: Word frequencies are calculated for significant words
4. **Sentence Scoring**: Each sentence is scored based on the cumulative frequency of its significant words
5. **Normalization**: Scores are normalized by word count to avoid bias toward longer sentences
6. **Selection**: Top N highest-scoring sentences are selected
7. **Ordering**: Selected sentences are returned in their original order

## Requirements

- **PowerShell 5.1+** (Windows)
- **PowerShell Core 7+** (Windows, macOS, Linux)
- No external dependencies required

## Usage Examples

### Basic Usage

```powershell
# Summarize a file (default: 3 sentences)
.\Summarize-Text.ps1 -InputFile "article.txt"
```

### Custom Sentence Count

```powershell
# Get a 5-sentence summary
.\Summarize-Text.ps1 -InputFile "article.txt" -SentenceCount 5
```

### Save to File

```powershell
# Save summary to output file
.\Summarize-Text.ps1 -InputFile "article.txt" -OutputFile "summary.txt" -SentenceCount 3
```

### Pipeline Input

```powershell
# Process text from pipeline
Get-Content "article.txt" | .\Summarize-Text.ps1 -SentenceCount 4

# Download and summarize web content
Invoke-WebRequest "https://example.com/article" | Select-Object -ExpandProperty Content | .\Summarize-Text.ps1
```

### Advanced Filtering

```powershell
# Use longer minimum word length for more selective keyword filtering
.\Summarize-Text.ps1 -InputFile "article.txt" -MinWordLength 6 -SentenceCount 3
```

### Verbose Output

```powershell
# Show detailed processing steps
.\Summarize-Text.ps1 -InputFile "article.txt" -SentenceCount 3 -Verbose
```

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `InputFile` | String | Yes* | - | Path to input text file |
| `Text` | String | Yes* | - | Direct text input (alternative to InputFile) |
| `OutputFile` | String | No | - | Path to save summary (prints to console if omitted) |
| `SentenceCount` | Int | No | 3 | Number of sentences to include in summary |
| `MinWordLength` | Int | No | 4 | Minimum word length to consider significant |

\* Either `InputFile` or `Text` must be provided

## Output

The script provides:
- **Summary text**: Either printed to console or saved to file
- **Statistics**:
  - Original word count
  - Summary word count
  - Reduction percentage

Example output:
```
==================================================
SUMMARY
==================================================
Machine learning algorithms can now process vast amounts of data to identify patterns and make predictions. Natural language processing enables computers to understand and generate human language. Computer vision allows machines to interpret and understand visual information from the world.
==================================================

Original: 145 words
Summary: 32 words
Reduction: 77.9%
```

## Stop Words

The script includes a comprehensive list of English stop words that are excluded from frequency analysis:

- Articles: the, a, an
- Pronouns: he, she, it, they, we, etc.
- Prepositions: in, on, at, from, to, etc.
- Conjunctions: and, or, but, etc.
- Common verbs: be, have, do, say, etc.

## Comparison with Python Version

| Feature | PowerShell | Python |
|---------|-----------|--------|
| **Algorithms** | Word Frequency | TextRank, LSA |
| **Dependencies** | None | NLTK, sumy, scikit-learn |
| **Platform** | Cross-platform (PS Core) | Cross-platform |
| **Speed** | Fast for small/medium texts | Slower but more accurate |
| **Accuracy** | Good for simple texts | Better for complex documents |
| **Use Case** | Quick summaries, no setup | Advanced analysis, production use |

## Limitations

- **No semantic analysis**: Only uses word frequency, not meaning
- **English-focused**: Stop words list is English-only
- **Sentence extraction only**: Cannot generate new sentences
- **No coreference resolution**: May miss context across sentences

## Tips for Best Results

1. **Adjust SentenceCount**: For longer documents, increase the sentence count
2. **Tune MinWordLength**:
   - Lower (3-4): Include more words, better for varied vocabulary
   - Higher (5-6): More selective, better for technical documents
3. **Clean input text**: Remove headers, footers, and non-content elements for better results
4. **Batch processing**: Use PowerShell loops to process multiple files:

```powershell
# Process all .txt files in a directory
Get-ChildItem -Path ".\documents" -Filter "*.txt" | ForEach-Object {
    $outputPath = ".\summaries\$($_.BaseName)_summary.txt"
    .\Summarize-Text.ps1 -InputFile $_.FullName -OutputFile $outputPath -SentenceCount 3
}
```

## Performance

Processing speed varies by text size:
- Small texts (< 1KB): < 1 second
- Medium texts (1-100KB): 1-5 seconds
- Large texts (100KB-1MB): 5-30 seconds

Performance is primarily limited by sentence scoring operations.

## Future Enhancements

Potential improvements:
- [ ] Multi-language support with configurable stop words
- [ ] TF-IDF scoring instead of simple frequency
- [ ] Paragraph-aware summarization
- [ ] Named entity recognition
- [ ] Configurable output formats (JSON, XML, Markdown)

## License

MIT License - Same as the main project

## Contributing

Contributions welcome! Some ideas:
- Add support for additional languages
- Implement TF-IDF scoring
- Add unit tests with Pester
- Improve sentence boundary detection

---

**Part of the Text Summarizer project** - See [README.md](README.md) for the full Python implementation.
