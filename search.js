const apiKey = "675abfca53fb3ac33f6a90826ade779b";
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

let allMovies = [];
let recent = [];

// --- INIT ---
fetchMovies();
fetchGenres();

// --- Fetch Movies ---
async function fetchMovies() {
  const res = await fetch(`${baseURL}/movie/popular?api_key=${apiKey}`);
  const data = await res.json();
  allMovies = data.results;
}

// --- Fetch Genres ---
async function fetchGenres() {
  const res = await fetch(`${baseURL}/genre/movie/list?api_key=${apiKey}`);
  const data = await res.json();
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
function performSearch(saveToRecent = false) {
  const query = searchInput.value.toLowerCase().trim();
  const genreVal = genreFilter.value;
  searchResults.innerHTML = "";
  searchResultsContainer.classList.add("hidden");
  noResultsMessage.classList.add("hidden");

  if (!query) return;

  const filtered = allMovies.filter((movie) => {
    const matchTitle = movie.title.toLowerCase().includes(query);
    const matchGenre = genreVal ? movie.genre_ids.includes(+genreVal) : true;
    return matchTitle && matchGenre;
  });

  if (filtered.length === 0) {
    noResultsMessage.classList.remove("hidden");
    searchResultsContainer.classList.remove("hidden");
  } else {
    filtered.forEach((movie) => {
      const poster = createPoster(movie);
      searchResults.appendChild(poster);
    });
    searchResultsContainer.classList.remove("hidden");

    if (saveToRecent) {
      saveRecentSearch(query);
    }
  }
}

// --- Genre Filter ---
genreFilter.addEventListener("change", () => {
  const genreId = genreFilter.value;
  genreResultsList.innerHTML = "";
  genreResults.classList.add("hidden");

  if (!genreId) return;

  const filtered = allMovies.filter((m) => m.genre_ids.includes(+genreId));
  if (filtered.length > 0) {
    filtered.forEach((movie) => {
      const poster = createPoster(movie);
      genreResultsList.appendChild(poster);
    });
    genreResults.classList.remove("hidden");
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

// Back Button JS
document.getElementById("backBtn").addEventListener("click", () => {
  window.history.back();
});
