"""Batch processing for multiple text files."""
import os
from pathlib import Path
from typing import List, Dict
from tqdm import tqdm

from .summarizers import get_summarizer


class BatchProcessor:
    """Process multiple text files in batch."""

    def __init__(self, algorithm: str = "textrank", sentence_count: int = 3):
        """
        Initialize batch processor.

        Args:
            algorithm: Summarization algorithm to use
            sentence_count: Number of sentences in summary
        """
        self.algorithm = algorithm
        self.sentence_count = sentence_count
        self.summarizer = get_summarizer(algorithm)

    def process_directory(
        self,
        input_dir: str,
        output_dir: str,
        recursive: bool = False
    ) -> Dict[str, any]:
        """
        Process all .txt files in a directory.

        Args:
            input_dir: Input directory path
            output_dir: Output directory path
            recursive: Whether to search recursively

        Returns:
            Report dictionary with processing results
        """
        # Validate input directory
        input_path = Path(input_dir)
        if not input_path.exists():
            raise FileNotFoundError(f"Input directory not found: {input_dir}")
        if not input_path.is_dir():
            raise NotADirectoryError(f"Not a directory: {input_dir}")

        # Create output directory if it doesn't exist
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        # Find all .txt files
        pattern = "**/*.txt" if recursive else "*.txt"
        txt_files = list(input_path.glob(pattern))

        if not txt_files:
            return {
                "total_files": 0,
                "successful": 0,
                "failed": [],
                "message": "No .txt files found in input directory"
            }

        # Process files
        successful = 0
        failed = []

        for file_path in tqdm(txt_files, desc="Processing files", unit="file"):
            try:
                # Read input file
                with open(file_path, 'r', encoding='utf-8') as f:
                    text = f.read()

                # Skip empty files
                if not text.strip():
                    failed.append({
                        "file": str(file_path),
                        "error": "Empty file"
                    })
                    continue

                # Generate summary
                summary = self.summarizer.summarize(text, self.sentence_count)

                # Determine output file path
                relative_path = file_path.relative_to(input_path)
                output_file = output_path / relative_path.parent / f"{relative_path.stem}_summary.txt"

                # Create subdirectories if needed
                output_file.parent.mkdir(parents=True, exist_ok=True)

                # Write summary
                with open(output_file, 'w', encoding='utf-8') as f:
                    f.write(f"# Summary of {file_path.name}\n")
                    f.write(f"# Algorithm: {self.algorithm.upper()}\n")
                    f.write(f"# Sentence count: {self.sentence_count}\n")
                    f.write(f"# Original word count: {len(text.split())}\n")
                    f.write(f"# Summary word count: {len(summary.split())}\n\n")
                    f.write(summary)

                successful += 1

            except Exception as e:
                failed.append({
                    "file": str(file_path),
                    "error": str(e)
                })

        return {
            "total_files": len(txt_files),
            "successful": successful,
            "failed": failed,
            "output_directory": str(output_path)
        }

    def process_files(
        self,
        file_paths: List[str],
        output_dir: str
    ) -> Dict[str, any]:
        """
        Process a list of specific files.

        Args:
            file_paths: List of file paths to process
            output_dir: Output directory path

        Returns:
            Report dictionary with processing results
        """
        # Create output directory
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        successful = 0
        failed = []

        for file_path_str in tqdm(file_paths, desc="Processing files", unit="file"):
            file_path = Path(file_path_str)

            try:
                # Validate file
                if not file_path.exists():
                    failed.append({
                        "file": str(file_path),
                        "error": "File not found"
                    })
                    continue

                if not file_path.is_file():
                    failed.append({
                        "file": str(file_path),
                        "error": "Not a file"
                    })
                    continue

                # Read file
                with open(file_path, 'r', encoding='utf-8') as f:
                    text = f.read()

                if not text.strip():
                    failed.append({
                        "file": str(file_path),
                        "error": "Empty file"
                    })
                    continue

                # Generate summary
                summary = self.summarizer.summarize(text, self.sentence_count)

                # Write summary
                output_file = output_path / f"{file_path.stem}_summary.txt"
                with open(output_file, 'w', encoding='utf-8') as f:
                    f.write(f"# Summary of {file_path.name}\n")
                    f.write(f"# Algorithm: {self.algorithm.upper()}\n")
                    f.write(f"# Sentence count: {self.sentence_count}\n")
                    f.write(f"# Original word count: {len(text.split())}\n")
                    f.write(f"# Summary word count: {len(summary.split())}\n\n")
                    f.write(summary)

                successful += 1

            except Exception as e:
                failed.append({
                    "file": str(file_path),
                    "error": str(e)
                })

        return {
            "total_files": len(file_paths),
            "successful": successful,
            "failed": failed,
            "output_directory": str(output_path)
        }
