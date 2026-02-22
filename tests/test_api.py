"""Integration tests for FastAPI endpoints."""
import pytest
from fastapi.testclient import TestClient
from src.api.main import app


@pytest.fixture
def client():
    """Create test client."""
    return TestClient(app)


@pytest.fixture
def sample_text():
    """Sample text for testing."""
    return """
    Artificial intelligence is revolutionizing various industries.
    Machine learning algorithms can analyze vast amounts of data.
    Natural language processing enables computers to understand language.
    Computer vision allows machines to interpret visual information.
    These technologies are transforming how businesses operate.
    """


class TestSummarizeEndpoint:
    """Test the /api/summarize endpoint."""

    def test_summarize_with_textrank(self, client, sample_text):
        """POST /api/summarize with TextRank algorithm."""
        response = client.post(
            "/api/summarize",
            json={"text": sample_text, "algorithm": "textrank", "length": 2}
        )
        assert response.status_code == 200
        data = response.json()
        assert "summaries" in data
        assert len(data["summaries"]) == 1
        assert data["summaries"][0]["algorithm"] == "TEXTRANK"
        assert data["summaries"][0]["word_count"] > 0

    def test_summarize_with_lsa(self, client, sample_text):
        """POST /api/summarize with LSA algorithm."""
        response = client.post(
            "/api/summarize",
            json={"text": sample_text, "algorithm": "lsa", "length": 2}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["summaries"][0]["algorithm"] == "LSA"

    def test_summarize_with_both_algorithms(self, client, sample_text):
        """POST /api/summarize with both algorithms."""
        response = client.post(
            "/api/summarize",
            json={"text": sample_text, "algorithm": "both", "length": 3}
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["summaries"]) == 2
        algorithms = {s["algorithm"] for s in data["summaries"]}
        assert algorithms == {"TEXTRANK", "LSA"}

    def test_empty_text_validation(self, client):
        """Empty text should return validation error."""
        response = client.post(
            "/api/summarize",
            json={"text": "", "algorithm": "textrank", "length": 3}
        )
        assert response.status_code == 422

    def test_original_length_returned(self, client, sample_text):
        """Response includes original word count."""
        response = client.post(
            "/api/summarize",
            json={"text": sample_text, "algorithm": "textrank", "length": 2}
        )
        data = response.json()
        assert "original_length" in data
        assert data["original_length"] > 0
