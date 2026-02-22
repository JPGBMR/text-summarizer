"""Unit tests for summarization algorithms."""
import pytest
from src.summarizers import get_summarizer, TextRankSummarizer, LSASummarizer


class TestSummarizerFactory:
    """Test the get_summarizer factory function."""

    def test_get_textrank_summarizer(self):
        """Factory returns TextRank summarizer."""
        summarizer = get_summarizer("textrank")
        assert isinstance(summarizer, TextRankSummarizer)

    def test_get_lsa_summarizer(self):
        """Factory returns LSA summarizer."""
        summarizer = get_summarizer("lsa")
        assert isinstance(summarizer, LSASummarizer)

    def test_invalid_algorithm_raises_error(self):
        """Factory raises ValueError for unknown algorithm."""
        with pytest.raises(ValueError, match="Unknown algorithm"):
            get_summarizer("invalid")


class TestTextRankSummarizer:
    """Test TextRank summarization algorithm."""

    def setup_method(self):
        """Set up test fixtures."""
        self.summarizer = TextRankSummarizer()
        self.sample_text = """
        Artificial intelligence is revolutionizing various industries.
        Machine learning algorithms can analyze vast amounts of data.
        Natural language processing enables computers to understand human language.
        Computer vision allows machines to interpret visual information.
        These technologies are transforming how businesses operate.
        """

    def test_summarize_normal_text(self):
        """Summarize normal text returns expected length."""
        summary = self.summarizer.summarize(self.sample_text, sentence_count=2)
        assert len(summary) > 0
        assert summary != self.sample_text.strip()

    def test_summarize_empty_text(self):
        """Summarize empty text returns empty string."""
        summary = self.summarizer.summarize("", sentence_count=3)
        assert summary == ""

    def test_summarize_whitespace_only(self):
        """Summarize whitespace-only text returns empty string."""
        summary = self.summarizer.summarize("   \n  \t  ", sentence_count=3)
        assert summary == ""

    def test_summarize_text_shorter_than_requested(self):
        """Text shorter than requested summary returns original text."""
        short_text = "This is a single sentence."
        summary = self.summarizer.summarize(short_text, sentence_count=5)
        assert summary == short_text


class TestLSASummarizer:
    """Test LSA summarization algorithm."""

    def setup_method(self):
        """Set up test fixtures."""
        self.summarizer = LSASummarizer()
        self.sample_text = """
        Cloud computing provides on-demand access to resources.
        It offers scalability and flexibility for businesses.
        Companies can reduce infrastructure costs significantly.
        Security is a critical concern for cloud adoption.
        Major providers include AWS, Azure, and Google Cloud.
        """

    def test_summarize_normal_text(self):
        """Summarize normal text returns expected length."""
        summary = self.summarizer.summarize(self.sample_text, sentence_count=2)
        assert len(summary) > 0
        assert summary != self.sample_text.strip()

    def test_summarize_empty_text(self):
        """Summarize empty text returns empty string."""
        summary = self.summarizer.summarize("", sentence_count=3)
        assert summary == ""

    def test_both_algorithms_produce_output(self):
        """Both algorithms produce valid summaries for same text."""
        textrank = TextRankSummarizer()
        lsa = LSASummarizer()

        tr_summary = textrank.summarize(self.sample_text, 2)
        lsa_summary = lsa.summarize(self.sample_text, 2)

        assert len(tr_summary) > 0
        assert len(lsa_summary) > 0
