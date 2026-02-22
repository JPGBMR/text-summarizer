// DOM elements
const form = document.getElementById('summarize-form');
const inputText = document.getElementById('input-text');
const lengthSlider = document.getElementById('length');
const lengthValue = document.getElementById('length-value');
const submitBtn = document.getElementById('submit-btn');
const loading = document.getElementById('loading');
const results = document.getElementById('results');
const resultsContainer = document.getElementById('results-container');
const errorDiv = document.getElementById('error');

// Update length display
lengthSlider.addEventListener('input', (e) => {
    lengthValue.textContent = e.target.value;
});

// Form submission
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Clear previous results and errors
    hideError();
    hideResults();

    // Validate input
    const text = inputText.value.trim();
    if (!text) {
        showError('Please enter some text to summarize');
        return;
    }

    // Get form data
    const algorithm = document.querySelector('input[name="algorithm"]:checked').value;
    const length = parseInt(lengthSlider.value);

    // Show loading state
    showLoading();

    try {
        // Call API
        const response = await fetch('/api/summarize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: text,
                algorithm: algorithm,
                length: length
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Summarization failed');
        }

        const data = await response.json();
        displayResults(data);

    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
});

function showLoading() {
    loading.classList.remove('hidden');
    submitBtn.disabled = true;
}

function hideLoading() {
    loading.classList.add('hidden');
    submitBtn.disabled = false;
}

function showError(message) {
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
}

function hideError() {
    errorDiv.classList.add('hidden');
}

function hideResults() {
    results.classList.add('hidden');
    resultsContainer.innerHTML = '';
}

function displayResults(data) {
    // Clear previous results
    resultsContainer.innerHTML = '';

    // Show original text stats
    const statsCard = document.createElement('div');
    statsCard.className = 'summary-card';
    statsCard.innerHTML = `
        <h3>📊 Original Text</h3>
        <p class="summary-stats">Word count: ${data.original_length} words</p>
    `;
    resultsContainer.appendChild(statsCard);

    // Display each summary
    data.summaries.forEach(summary => {
        const card = document.createElement('div');
        card.className = 'summary-card';

        const reductionPercent = data.original_length > 0
            ? Math.round((1 - summary.word_count / data.original_length) * 100)
            : 0;

        card.innerHTML = `
            <h3>✨ ${summary.algorithm}</h3>
            <p class="summary-stats">
                ${summary.word_count} words
                ${reductionPercent > 0 ? `(${reductionPercent}% reduction)` : ''}
            </p>
            <p class="summary-text">${summary.summary || 'No summary generated'}</p>
        `;

        resultsContainer.appendChild(card);
    });

    // Show results section
    results.classList.remove('hidden');

    // Scroll to results
    results.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
