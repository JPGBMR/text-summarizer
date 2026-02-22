"""LSA (Latent Semantic Analysis) algorithm implementation."""
from sumy.parsers.plaintext import PlaintextParser
from sumy.nlp.tokenizers import Tokenizer
from sumy.summarizers.lsa import LsaSummarizer as SumyLSA
from sumy.nlp.stemmers import Stemmer
from sumy.utils import get_stop_words

from .base import BaseSummarizer


class LSASummarizer(BaseSummarizer):
    """
    LSA (Latent Semantic Analysis) summarizer.

    Uses singular value decomposition to identify key semantic concepts.
    """

    def __init__(self, language: str = "english"):
        """
        Initialize LSA summarizer.

        Args:
            language: Language for stemming and stop words (default: english)
        """
        super().__init__()
        self.language = language
        self.stemmer = Stemmer(language)
        self.summarizer = SumyLSA(self.stemmer)
        self.summarizer.stop_words = get_stop_words(language)

    def summarize(self, text: str, sentence_count: int = 3) -> str:
        """
        Summarize text using LSA algorithm.

        Args:
            text: Input text to summarize
            sentence_count: Number of sentences to extract

        Returns:
            Summarized text
        """
        # Validate input
        text, is_valid = self._validate_input(text, sentence_count)
        if not is_valid:
            return ""

        try:
            # Parse the text
            parser = PlaintextParser.from_string(text, Tokenizer(self.language))

            # Check if text is too short
            total_sentences = len(parser.document.sentences)
            if total_sentences == 0:
                return ""
            if total_sentences <= sentence_count:
                return text

            # Generate summary
            summary_sentences = self.summarizer(parser.document, sentence_count)

            # Combine sentences
            summary = " ".join(str(sentence) for sentence in summary_sentences)
            return summary

        except Exception as e:
            # Fallback: return first N sentences if summarization fails
            sentences = text.split('. ')
            return '. '.join(sentences[:sentence_count]) + '.'
