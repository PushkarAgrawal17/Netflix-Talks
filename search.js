const baseURL = "https://api.themoviedb.org/3";
const imgURL = "https://image.tmdb.org/t/p/w500";

// --- Elements ---
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const searchResultsContainer = document.getElementById("searchResultsContainer");
const searchResults = document.getElementById("searchResults");
const noResultsMessage = document.getElementById("noResultsMessage");

const genreFilter = document.getElementById("genreFilter");
const genreResults = document.getElementById("genreResults");
const genreResultsList = document.getElementById("genreResultsList");

const recentSearches = document.getElementById("recentSearches");
const recentContainer = document.getElementById("recentContainer");

const voiceBtn = document.getElementById("voiceBtn");

let allGenres = [];
let recent = [];

fetchGenres();

// --- Fetch Genres ---
async function fetchGenres() {
    const res = await fetch(`${baseURL}/genre/movie/list?api_key=${apiKey}&include_adult=false`);

    const data = await res.json();
    allGenres = data.genres;

    data.genres.forEach((genre) => {
        const opt = document.createElement("option");
        opt.value = genre.id;
        opt.text = genre.name;
        genreFilter.appendChild(opt);
    });
}

// --- Live Search (No Recent Save) ---
searchInput.addEventListener("input", () => {
    performSearch(false); // don't save to recent while typing
});

// --- Save on Enter ---
searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        performSearch(true); // save to recent
    }
});

// --- Save on Button Click ---
searchBtn.addEventListener("click", () => {
    performSearch(true); // save to recent
});

// --- Main Search Logic ---
async function performSearch(saveToRecent = false) {
    const query = searchInput.value.toLowerCase().trim();
    const genreVal = genreFilter.value;
    searchResults.innerHTML = "";
    searchResultsContainer.classList.add("hidden");
    noResultsMessage.classList.add("hidden");

    if (!query) return;

    try {
        const res = await fetch(`${baseURL}/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&include_adult=false`);
        const data = await res.json();

        const filtered = data.results
            .filter((m) => !m.adult && m.poster_path) // ⛔ skip adult and no-poster
            .filter((m) => genreVal ? m.genre_ids.includes(+genreVal) : true);

        if (filtered.length === 0) {
            noResultsMessage.classList.remove("hidden");
        } else {
            filtered.forEach((movie) => {
                const poster = createPoster(movie);
                searchResults.appendChild(poster);
            });

            if (saveToRecent) {
                saveRecentSearch(query);
            }
        }

        searchResultsContainer.classList.remove("hidden");
    } catch (error) {
        console.error("Search API failed", error);
        noResultsMessage.textContent = "Something went wrong. Please try again.";
        noResultsMessage.classList.remove("hidden");
        searchResultsContainer.classList.remove("hidden");
    }
}

// --- Genre Filter Only ---
genreFilter.addEventListener("change", async () => {
    const genreId = genreFilter.value;
    genreResultsList.innerHTML = "";
    genreResults.classList.add("hidden");

    if (!genreId) return;

    try {
        const res = await fetch(`${baseURL}/discover/movie?api_key=${apiKey}&with_genres=${genreId}&sort_by=popularity.desc&include_adult=false`);
        const data = await res.json();

        const movies = data.results.filter((m) => m.poster_path); // ⛔ skip missing posters

        movies.forEach((movie) => {
            const poster = createPoster(movie);
            genreResultsList.appendChild(poster);
        });

        genreResults.classList.remove("hidden");
    } catch (err) {
        console.error("Genre fetch failed", err);
    }
});

// --- Poster Generator ---
function createPoster(movie) {
    const poster = document.createElement("img");
    poster.src = `${imgURL}${movie.poster_path}`;
    poster.alt = movie.title;
    poster.classList.add("search-result-poster");
    return poster;
}

// --- Recent Search Logic ---
function saveRecentSearch(title) {
    title = title.trim();
    if (!title) return;

    recent = recent.filter((item) => item !== title);
    recent.unshift(title);
    if (recent.length > 5) recent.pop();
    renderRecentSearches();
}

function renderRecentSearches() {
    recentSearches.innerHTML = "";
    if (recent.length === 0) {
        recentContainer.classList.add("hidden");
        return;
    }

    recent.forEach((title) => {
        const span = document.createElement("span");
        span.innerText = title;
        span.onclick = () => {
            searchInput.value = title;
            performSearch(true);
        };
        recentSearches.appendChild(span);
    });

    recentContainer.classList.remove("hidden");
}

// --- Voice Input ---
voiceBtn?.addEventListener("click", () => {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "en-US";
    recognition.start();

    recognition.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        searchInput.value = transcript;
        performSearch(true);
    };

    recognition.onerror = (e) => alert("Voice search error: " + e.error);
});

// --- Back Button ---
const backBtn = document.getElementById("backBtn");
if (backBtn) {
    backBtn.addEventListener("click", () => {
        window.history.back();
    });
}

// Genre toggle animation logic
const genreToggleBtn = document.getElementById("genreToggleBtn");
const searchBarContainer = document.getElementById("searchBarContainer");
const genreDropdown = document.querySelector(".genre-dropdown");

if (genreToggleBtn && searchBarContainer && voiceBtn && genreDropdown) {
    genreToggleBtn.addEventListener("click", () => {
        searchBarContainer.classList.add("hide");
        voiceBtn.classList.add("hide");

        setTimeout(() => {
            genreDropdown.classList.add("show");
        }, 400);
    });
} else {
    console.warn("Warning! Some elements not found: genreToggleBtn / searchBarContainer / voiceBtn / genreDropdown");
}


//Working Genre button
document.getElementById("genreToggleBtn").addEventListener("click", () => {
    const popupContent = document.querySelector(".popup-content");
    popupContent.classList.add("genre-active");
});


// === Genre Mode Toggle ===
const backToSearchBtn = document.getElementById("backToSearchBtn");
const popupContent = document.querySelector(".popup-content");
const genreTitle = document.getElementById("genreFilterTitle");

// Enable genre mode
genreToggleBtn.addEventListener("click", () => {
popupContent.classList.add("genre-active");
backToSearchBtn.classList.remove("hidden");
genreTitle.style.display = "block";
genreDropdown.style.display = "flex";

// ✅ HIDE & CLEAR regular search results
    searchResultsContainer.classList.add("hidden");
    searchResults.innerHTML = "";

    recentContainer.classList.add("hidden"); // ✅ Hide recent
});

// Back to normal search mode
backToSearchBtn.addEventListener("click", () => {
    popupContent.classList.remove("genre-active");
    backToSearchBtn.classList.add("hidden");
    genreTitle.style.display = "none";
    genreDropdown.style.display = "none";
    genreResults.classList.add("hidden"); // Hide genre result section
    document.getElementById("genreFilter").selectedIndex = 0;
});