"""API route handlers."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Literal

from ..summarizers import get_summarizer


router = APIRouter()


class SummarizeRequest(BaseModel):
    """Request model for summarization."""
    text: str = Field(..., min_length=1, description="Text to summarize")
    algorithm: Literal["textrank", "lsa", "both"] = Field(
        default="both",
        description="Algorithm to use for summarization"
    )
    length: int = Field(
        default=3,
        ge=1,
        le=20,
        description="Number of sentences in summary"
    )


class SummaryResult(BaseModel):
    """Individual summary result."""
    algorithm: str
    summary: str
    word_count: int


class SummarizeResponse(BaseModel):
    """Response model for summarization."""
    summaries: list[SummaryResult]
    original_length: int


@router.post("/summarize", response_model=SummarizeResponse)
async def summarize_text(request: SummarizeRequest):
    """
    Summarize input text using specified algorithm(s).

    Args:
        request: Summarization request with text, algorithm, and length

    Returns:
        Summaries from requested algorithm(s)

    Raises:
        HTTPException: If summarization fails
    """
    try:
        # Validate input
        if not request.text.strip():
            raise HTTPException(
                status_code=400,
                detail="Input text cannot be empty"
            )

        original_word_count = len(request.text.split())
        summaries = []

        # Determine which algorithms to run
        algorithms_to_run = []
        if request.algorithm == "both":
            algorithms_to_run = ["textrank", "lsa"]
        else:
            algorithms_to_run = [request.algorithm]

        # Generate summaries
        for algo in algorithms_to_run:
            try:
                summarizer = get_summarizer(algo)
                summary = summarizer.summarize(request.text, request.length)

                summaries.append(SummaryResult(
                    algorithm=algo.upper(),
                    summary=summary,
                    word_count=len(summary.split()) if summary else 0
                ))
            except Exception as e:
                # If one algorithm fails, continue with others
                summaries.append(SummaryResult(
                    algorithm=algo.upper(),
                    summary=f"Error: {str(e)}",
                    word_count=0
                ))

        return SummarizeResponse(
            summaries=summaries,
            original_length=original_word_count
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Summarization failed: {str(e)}"
        )
