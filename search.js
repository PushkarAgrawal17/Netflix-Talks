const searchInput = document.getElementById("searchInput");
const resultsBox = document.getElementById("searchResults");
const movieModal = document.getElementById("movieModal");
const modalDetails = document.getElementById("modalDetails");
const closeBtn = document.querySelector(".close");
const genreFilter = document.getElementById("genreFilter");
const recentSearches = document.getElementById("recentSearches");
const trendingList = document.getElementById("trendingList");
const voiceBtn = document.getElementById("voiceBtn");

// 💎 Your TMDB API key
const apiKey = "675abfca53fb3ac33f6a90826ade779b";
const baseURL = "https://api.themoviedb.org/3";
const imgURL = "https://image.tmdb.org/t/p/w500";

let allMovies = [];
let trendingMovies = [];
let recent = [];

// Fetch movie data
async function fetchMovies() {
  const res = await fetch(`${baseURL}/movie/popular?api_key=${apiKey}`);
  const data = await res.json();
  allMovies = data.results;
  trendingMovies = data.results.slice(0, 5);
  showTrending();
}

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

fetchMovies();
fetchGenres();

// Search logic
searchInput.addEventListener("input", () => {
  const query = searchInput.value.toLowerCase();
  const genreVal = genreFilter.value;
  resultsBox.innerHTML = "";

  if (query.length > 0) {
    const filtered = allMovies.filter((movie) => {
      const matchTitle = movie.title.toLowerCase().includes(query);
      const matchGenre = genreVal
        ? movie.genre_ids.includes(Number(genreVal))
        : true;
      return matchTitle && matchGenre;
    });

    filtered.forEach((movie) => {
      const item = document.createElement("div");
      item.classList.add("result-item");
      item.innerText = movie.title;
      item.addEventListener("click", () => {
        saveRecentSearch(movie.title);
        showMoviePopup(movie);
      });
      resultsBox.appendChild(item);
    });
  }
});

// Show popup
function showMoviePopup(movie) {
  modalDetails.innerHTML = `
    <h2>${movie.title}</h2>
    <img src="${imgURL + movie.poster_path}" alt="${
    movie.title
  }" style="width:100%; border-radius:10px;"/>
    <p>${movie.overview}</p>
    <p><strong>Release Date:</strong> ${movie.release_date}</p>
  `;
  movieModal.style.display = "flex";
  resultsBox.innerHTML = "";
  searchInput.value = "";
}

// Close popup
closeBtn.onclick = () => (movieModal.style.display = "none");
window.onclick = (e) => {
  if (e.target == movieModal) movieModal.style.display = "none";
};

// 🎯 Trending
function showTrending() {
  trendingList.innerHTML = "";
  trendingMovies.forEach((movie) => {
    const span = document.createElement("span");
    span.innerText = movie.title;
    span.onclick = () => showMoviePopup(movie);
    trendingList.appendChild(span);
  });
}

// ❤️ Recent Searches
function saveRecentSearch(title) {
  if (!recent.includes(title)) {
    recent.unshift(title);
    if (recent.length > 5) recent.pop();
    renderRecentSearches();
  }
}

function renderRecentSearches() {
  recentSearches.innerHTML = "";
  recent.forEach((item) => {
    const span = document.createElement("span");
    span.innerText = item;
    span.onclick = () => {
      searchInput.value = item;
      searchInput.dispatchEvent(new Event("input"));
    };
    recentSearches.appendChild(span);
  });
}

// 🎤 Voice Search
voiceBtn.addEventListener("click", () => {
  const recognition = new (window.SpeechRecognition ||
    window.webkitSpeechRecognition)();
  recognition.lang = "en-US";
  recognition.start();

  recognition.onresult = function (event) {
    const transcript = event.results[0][0].transcript;
    searchInput.value = transcript;
    searchInput.dispatchEvent(new Event("input"));
  };

  recognition.onerror = function (event) {
    alert("Voice search failed: " + event.error);
  };
});
