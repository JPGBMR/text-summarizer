"""FastAPI application entry point."""
import os
import nltk
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from .routes import router


# Download required NLTK data
def download_nltk_data():
    """Download required NLTK datasets."""
    try:
        nltk.data.find('tokenizers/punkt')
    except LookupError:
        nltk.download('punkt', quiet=True)

    try:
        nltk.data.find('corpora/stopwords')
    except LookupError:
        nltk.download('stopwords', quiet=True)


# Create FastAPI app
app = FastAPI(
    title="Text Summarizer API",
    description="Automatic text summarization using TextRank and LSA algorithms",
    version="1.0.0"
)

# Add CORS middleware for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router, prefix="/api")

# Mount static files
static_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "static")
app.mount("/", StaticFiles(directory=static_path, html=True), name="static")


@app.on_event("startup")
async def startup_event():
    """Run on application startup."""
    print("🚀 Starting Text Summarizer API...")
    print("📦 Downloading NLTK data...")
    download_nltk_data()
    print("✅ Ready!")


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "service": "text-summarizer"}
