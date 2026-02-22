# Text Summarizer

Automatic text summarization utility in Python with multiple algorithms, web interface, and batch processing capabilities.

## Tech Stack
![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)
![NLTK](https://img.shields.io/badge/NLTK-154f3c?style=flat&logo=python&logoColor=white)
![PowerShell](https://img.shields.io/badge/PowerShell-5391FE?style=flat&logo=powershell&logoColor=white)

## Features

- **Multiple Algorithms**: TextRank and LSA (Latent Semantic Analysis) summarization
- **Web Interface**: Modern, responsive UI for interactive summarization
- **CLI Tool**: Command-line interface for quick summarization tasks
- **Batch Processing**: Process multiple files at once with progress tracking
- **Local Processing**: No external APIs required - all processing happens locally
- **PowerShell Version**: Standalone PowerShell script for Windows users with simple word frequency-based summarization

## Installation

1. Clone the repository:
```bash
git clone https://github.com/JPGBMR/text-summarizer.git
cd text-summarizer
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

The first run will automatically download required NLTK data.

## Usage

### Web Interface

Launch the web UI:
```bash
python main.py web
```
Then open [http://localhost:8000](http://localhost:8000) in your browser.

### CLI - Single File

Summarize a single file:
```bash
python main.py summarize -i input.txt -o output.txt -a textrank -l 3
```

Options:
- `-i, --input`: Input text file
- `-o, --output`: Output file (optional, prints to console if omitted)
- `-a, --algorithm`: Algorithm to use (`textrank` or `lsa`)
- `-l, --length`: Number of sentences in summary (default: 3)

### CLI - Batch Processing

Process multiple files:
```bash
python main.py batch -i input_folder -o output_folder -a textrank -l 2
```

Options:
- `-i, --input-dir`: Directory containing text files
- `-o, --output-dir`: Directory for output summaries
- `-a, --algorithm`: Algorithm to use (`textrank` or `lsa`)
- `-l, --length`: Number of sentences in summary (default: 3)
- `-r, --recursive`: Process subdirectories recursively

### PowerShell Script (Windows)

A standalone PowerShell implementation using word frequency tokenization:

```powershell
# Summarize a file
.\Summarize-Text.ps1 -InputFile examples\sample.txt -SentenceCount 3

# Save summary to file
.\Summarize-Text.ps1 -InputFile input.txt -OutputFile summary.txt -SentenceCount 5

# Pipe text directly
Get-Content article.txt | .\Summarize-Text.ps1 -SentenceCount 3

# Adjust minimum word length filter
.\Summarize-Text.ps1 -InputFile input.txt -SentenceCount 4 -MinWordLength 5
```

**PowerShell Parameters:**
- `-InputFile`: Path to text file to summarize
- `-Text`: Direct text input (alternative to InputFile)
- `-OutputFile`: Save summary to file (optional)
- `-SentenceCount`: Number of sentences in summary (default: 3)
- `-MinWordLength`: Minimum word length to consider (default: 4)

## Examples

Try the included sample:
```bash
python main.py summarize -i examples/sample.txt -a textrank -l 2
```

Batch process examples:
```bash
python main.py batch -i examples/input -o examples/output -a lsa -l 3
```

## API Documentation

When running the web server, API documentation is available at:
- Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

## Algorithms

### Python Implementation

#### TextRank
Graph-based ranking algorithm that identifies the most important sentences based on their relationships with other sentences.

#### LSA (Latent Semantic Analysis)
Uses singular value decomposition to identify the most semantically significant sentences by analyzing underlying concepts.

### PowerShell Implementation

#### Word Frequency Scoring
Simple extractive summarization using tokenization and word frequency analysis:
1. Text is tokenized into sentences and words
2. Word frequencies are calculated (excluding common stop words)
3. Each sentence is scored based on the frequency of significant words it contains
4. Top N highest-scoring sentences are selected and returned in original order

This approach is lightweight and requires no external dependencies beyond PowerShell itself.

## Testing

Run the test suite:
```bash
pytest tests/ -v
```

With coverage:
```bash
pytest tests/ -v --cov=src --cov-report=term-missing
```

## Project Structure

```
text-summarizer/
├── src/
│   ├── api/              # FastAPI web application
│   ├── summarizers/      # Summarization algorithms
│   └── batch_processor.py
├── static/               # Web UI assets
├── tests/                # Test suite
├── examples/             # Sample files
├── main.py               # CLI entry point
├── Summarize-Text.ps1    # PowerShell implementation
└── requirements.txt
```

## License

MIT License - feel free to use this project for learning and development.

---
*Part of the [JPGBMR](https://github.com/JPGBMR) open-source portfolio.*
