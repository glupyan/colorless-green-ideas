document.addEventListener('DOMContentLoaded', () => {
    // ⬇️ IMPORTANT: PASTE YOUR GOOGLE APPS SCRIPT URL HERE ⬇️
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyELXN0Kp6LoJPyZelGwf5sG878T0B6waKeG81MzuG821714AElZoGDY1meHdooawxc/exec';

    // --- All View Containers ---
    const homeView = document.getElementById('home-view');
    const submissionView = document.getElementById('submission-view');
    const ratingView = document.getElementById('rating-view');
    const resultsView = document.getElementById('results-view');
    const errorState = document.getElementById('error-state');
    const allViews = [homeView, submissionView, ratingView, resultsView, errorState];

    // --- Sub-views and Elements ---
    let loadingState, sentenceDisplay, resultsDisplay;

    // --- Buttons ---
    const goToSubmitBtn = document.getElementById('go-to-submit-btn');
    const goToRateBtn = document.getElementById('go-to-rate-btn');
    const goToResultsBtn = document.getElementById('go-to-results-btn');
    const backBtns = document.querySelectorAll('.back-btn');

    // --- Forms and Dynamic Content ---
    const submitForm = document.getElementById('submit-form');
    const sentenceInput = document.getElementById('sentence-input');
    const submitMessage = document.getElementById('submit-message');
    const resultsList = document.getElementById('results-list');
    const resultsLoading = document.getElementById('results-loading');
    const errorMessage = document.getElementById('error-message');

    // --- App State ---
    let sentences = [];
    let currentSentenceIndex = 0;
    let userId = '';
    let tempMeaningfulnessRating = null;
    let tempSourceRating = null;
    
    // --- UTILITY FUNCTIONS ---
    /**
     * Shuffles an array in place using the Fisher-Yates algorithm.
     * @param {Array} array The array to shuffle.
     */
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]; // Swap elements
        }
    }

    // --- INITIALIZATION ---
    function init() {
        userId = localStorage.getItem('sentenceRaterUserId');
        if (!userId) {
            userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem('sentenceRaterUserId', userId);
        }
        setupEventListeners();
        showView(homeView);
    }

    // --- VIEW MANAGEMENT ---
    function showView(viewToShow) {
        allViews.forEach(view => view.style.display = 'none');
        viewToShow.style.display = 'block';
    }

    // --- EVENT LISTENERS ---
    function setupEventListeners() {
        goToSubmitBtn.addEventListener('click', () => showView(submissionView));
        goToRateBtn.addEventListener('click', getSentences);
        goToResultsBtn.addEventListener('click', handleViewResults);

        backBtns.forEach(btn => btn.addEventListener('click', () => {
            submitMessage.textContent = '';
            showView(homeView);
        }));

        submitForm.addEventListener('submit', handleSentenceSubmission);
    }

    // --- SENTENCE SUBMISSION LOGIC ---
    async function handleSentenceSubmission(event) {
        event.preventDefault();
        const sentence = sentenceInput.value.trim();
        if (!sentence) return;

        submitMessage.textContent = 'Submitting...';
        try {
            await fetch(SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                body: JSON.stringify({
                    type: 'submission',
                    userId: userId,
                    sentence: sentence
                }),
            });
            submitMessage.textContent = '✅ Thank you, your sentence has been submitted!';
            sentenceInput.value = '';
        } catch (error) {
            submitMessage.textContent = `Error: ${error.message}`;
        }
    }

    // --- SENTENCE RATING LOGIC ---
    async function getSentences() {
        ratingView.innerHTML = `
            <div id="loading-state-inner" class="card"><p>🔄 Loading sentences...</p></div>
            <div id="sentence-display-inner" class="card" style="display: none;">
                <p id="sentence-text">...</p>
                <div id="meaningfulness-rating" class="rating-group">
                    <p class="rating-label">How meaningful is this sentence?</p>
                    <button class="rate-btn" data-value="1">1</button> 
                    <button class="rate-btn" data-value="2">2</button> 
                    <button class="rate-btn" data-value="3">3</button> 
                    <button class="rate-btn" data-value="4">4</button> 
                    <button class="rate-btn" data-value="5">5</button>
                </div>
                <div id="source-rating" class="rating-group">
                    <p class="rating-label">Is it from a human or an LLM?</p>
                    <button class="btn-source" data-value="0">Human</button> 
                    <button class="btn-source" data-value="1">LLM</button>
                </div>
                <p id="progress-indicator"></p>
            </div>
            <div id="results-display-inner" class="card" style="display: none;">
                <h2>All Sentences Rated!</h2>
                <p>Thank you! Your ratings have been saved.</p>
                <button id="restart-btn">Rate Again</button>
            </div>
            <button class="back-btn">&larr; Back to Home</button>
        `;
        ratingView.querySelector('.back-btn').addEventListener('click', () => showView(homeView));
        
        loadingState = document.getElementById('loading-state-inner');
        sentenceDisplay = document.getElementById('sentence-display-inner');
        resultsDisplay = document.getElementById('results-display-inner');

        showView(ratingView);

        try {
            if (!SCRIPT_URL) throw new Error("SCRIPT_URL is not set in script.js.");
            const response = await fetch(SCRIPT_URL);
            if (!response.ok) throw new Error(`Network error: ${response.statusText}`);
            
            const data = await response.json();
            sentences = data.sentences;
            
            if (sentences.length === 0) throw new Error("No sentences found to rate.");
            
            shuffleArray(sentences);
            
            startRating();
        } catch (error) {
            errorMessage.textContent = error.message;
            showView(errorState);
        }
    }
    
    function startRating() {
        currentSentenceIndex = 0;
        document.getElementById('meaningfulness-rating').addEventListener('click', handleMeaningfulnessRating);
        document.getElementById('source-rating').addEventListener('click', handleSourceRating);
        document.getElementById('restart-btn').addEventListener('click', startRating);
        displayCurrentSentence();
        loadingState.style.display = 'none';
        resultsDisplay.style.display = 'none';
        sentenceDisplay.style.display = 'block';
    }

    function handleMeaningfulnessRating(event) {
        const target = event.target;
        if (!target.classList.contains('rate-btn')) return;
        
        tempMeaningfulnessRating = parseInt(target.dataset.value, 10);
        
        // Visual feedback
        document.querySelectorAll('#meaningfulness-rating .rate-btn').forEach(btn => btn.classList.remove('selected'));
        target.classList.add('selected');
        
        checkAndSubmitRatings();
    }

    function handleSourceRating(event) {
        const target = event.target;
        if (!target.classList.contains('btn-source')) return;

        tempSourceRating = parseInt(target.dataset.value, 10);

        // Visual feedback
        document.querySelectorAll('#source-rating .btn-source').forEach(btn => btn.classList.remove('selected'));
        target.classList.add('selected');

        checkAndSubmitRatings();
    }

    function checkAndSubmitRatings() {
        if (tempMeaningfulnessRating !== null && tempSourceRating !== null) {
            const sentence = sentences[currentSentenceIndex];
            
            // Send the save request but don't wait for it to finish.
            fetch(SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                body: JSON.stringify({ 
                    type: 'rating', 
                    userId, 
                    sentence, 
                    meaningfulness_rating: tempMeaningfulnessRating,
                    source_rating: tempSourceRating 
                }),
            }).catch(error => {
                console.error('Failed to save rating:', error);
            });

            // Reset for the next sentence
            tempMeaningfulnessRating = null;
            tempSourceRating = null;
            currentSentenceIndex++;
            setTimeout(displayCurrentSentence, 200); // Small delay for user to see selection
        }
    }

    function displayCurrentSentence() {
        // Reset button visuals
        document.querySelectorAll('.rate-btn, .btn-source').forEach(btn => btn.classList.remove('selected'));

        if (currentSentenceIndex < sentences.length) {
            document.getElementById('sentence-text').textContent = sentences[currentSentenceIndex];
            document.getElementById('progress-indicator').textContent = `Sentence ${currentSentenceIndex + 1} of ${sentences.length}`;
        } else {
            // When done, just show the final message.
            const resultsDisplayInner = document.getElementById('results-display-inner');
            const resultsMessage = resultsDisplayInner.querySelector('p');
            resultsMessage.textContent = 'Thank you! Your ratings have been saved.';
            sentenceDisplay.style.display = 'none';
            resultsDisplay.style.display = 'block';
        }
    }


    // --- RESULTS VIEW LOGIC ---
    async function handleViewResults() {
        showView(resultsView);
        resultsList.innerHTML = '';
        resultsLoading.style.display = 'block';

        try {
            if (!SCRIPT_URL) throw new Error("SCRIPT_URL is not set.");
            const response = await fetch(`${SCRIPT_URL}?action=getResults`);
            if (!response.ok) throw new Error(`Network error: ${response.statusText}`);
            
            const results = await response.json();

            if (results.length === 0) {
                resultsList.innerHTML = '<li>No ratings have been submitted yet.</li>';
            } else {
                results.forEach(item => {
                    const li = document.createElement('li');
                    
                    const typeClass = (item.user_type || 'other').toLowerCase();
                    li.classList.add(typeClass);

                    li.innerHTML = `
                        <div class="sentence-text">${item.sentence}</div>
                        <div class="stats-container">
                            <div class="stat">
                                <span class="stat-label">Meaning:</span>
                                ${item.meaningfulness_average.toFixed(2)} ★
                            </div>
                            <div class="stat">
                                <span class="stat-label">LLM Score:</span>
                                ${item.source_average.toFixed(2)}
                            </div>
                            <em>(${item.count} ratings)</em>
                        </div>
                    `;
                    resultsList.appendChild(li);
                });
            }
        } catch (error) {
            errorMessage.textContent = error.message;
            showView(errorState);
        } finally {
            resultsLoading.style.display = 'none';
        }
    }

    init();
});