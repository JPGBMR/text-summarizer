"""Base class for all text summarization algorithms."""
from abc import ABC, abstractmethod


class BaseSummarizer(ABC):
    """Abstract base class for text summarizers."""

    def __init__(self):
        """Initialize the summarizer."""
        pass

    @abstractmethod
    def summarize(self, text: str, sentence_count: int = 3) -> str:
        """
        Generate a summary of the given text.

        Args:
            text: The input text to summarize
            sentence_count: Number of sentences in the summary

        Returns:
            The summarized text
        """
        pass

    def _validate_input(self, text: str, sentence_count: int) -> tuple[str, bool]:
        """
        Validate input parameters.

        Args:
            text: Input text to validate
            sentence_count: Requested sentence count

        Returns:
            Tuple of (validated_text, is_valid)
        """
        # Handle empty or whitespace-only input
        if not text or not text.strip():
            return "", False

        text = text.strip()

        # If requested length is invalid, default to 3
        if sentence_count < 1:
            sentence_count = 3

        return text, True

    def get_word_count(self, text: str) -> int:
        """Count words in text."""
        return len(text.split())
