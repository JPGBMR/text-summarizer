"""Text summarization algorithms package."""
from .base import BaseSummarizer
from .textrank_summarizer import TextRankSummarizer
from .lsa_summarizer import LSASummarizer


def get_summarizer(algorithm: str, language: str = "english") -> BaseSummarizer:
    """
    Factory function to get a summarizer instance.

    Args:
        algorithm: Algorithm name ('textrank' or 'lsa')
        language: Language for summarization (default: 'english')

    Returns:
        BaseSummarizer instance

    Raises:
        ValueError: If algorithm name is not recognized
    """
    algorithm = algorithm.lower().strip()

    if algorithm == "textrank":
        return TextRankSummarizer(language=language)
    elif algorithm == "lsa":
        return LSASummarizer(language=language)
    else:
        raise ValueError(
            f"Unknown algorithm: {algorithm}. "
            f"Available options: 'textrank', 'lsa'"
        )


__all__ = [
    "BaseSummarizer",
    "TextRankSummarizer",
    "LSASummarizer",
    "get_summarizer",
]
