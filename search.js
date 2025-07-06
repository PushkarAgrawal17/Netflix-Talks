// --- Firebase Modular Import ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";

// --- 🔥 TMDB API Key ---
const apiKey = "675abfca53fb3ac33f6a90826ade779b";

// --- 🔥 Firebase Config ---
const firebaseConfig = {
  apiKey: "AIzaSyAmyFBiAahRlD8j15Am3UclG1-YJOmS5yQ",
  authDomain: "netflix-web-project.firebaseapp.com",
  projectId: "netflix-web-project",
  storageBucket: "netflix-web-project.firebasestorage.app",
  messagingSenderId: "616557096999",
  appId: "1:616557096999:web:027b9189b6f5b283115e02",
};

initializeApp(firebaseConfig);

// --- Element References ---
const searchInput = document.getElementById("searchInput");
const resultsBox = document.getElementById("searchResults");
const genreFilter = document.getElementById("genreFilter");
const recentSearches = document.getElementById("recentSearches");
const trendingList = document.getElementById("trendingList");
const voiceBtn = document.getElementById("voiceBtn");

// --- TMDB Constants ---
const baseURL = "https://api.themoviedb.org/3";
const imgURL = "https://image.tmdb.org/t/p/w500";

let allMovies = [];
let trendingMovies = [];
let recent = [];

createGlobalPopup();
fetchMovies();
fetchGenres();

// ================= Fetching ==================
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

// ================ Search Logic =================
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

// ============== Trending & Recent ===============
function showTrending() {
  trendingList.innerHTML = "";
  trendingMovies.forEach((movie) => {
    const span = document.createElement("span");
    span.innerText = movie.title;
    span.onclick = () => showMoviePopup(movie);
    trendingList.appendChild(span);
  });
}

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

// ============ Voice Search ===============
voiceBtn?.addEventListener("click", () => {
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

// ============ Popup Setup ===============
function createGlobalPopup() {
  const popup = document.createElement("div");
  popup.classList.add("popup-css");
  popup.id = "global-popup";
  popup.innerHTML = `
    <div class="popup-overlay"></div>
    <div class="popup-box">
      <span class="close-btn">&times;</span>
      <div class="poster-wrapper">
        <img src="" class="popup-movie-img" alt="Movie Poster" />
        <h1 class="popup-title-img"></h1>
        <div class="popup-gradient-overlay"></div>
      </div>
      <div class="popup-tags"></div>
      <p class="popup-description"></p>
      <button id="popup-mylist-btn" class="popup-mylist-btn"></button>
    </div>`;
  document.body.appendChild(popup);
  addGlobalPopupListeners();
}

function showMoviePopup(movie) {
  const popup = document.getElementById("global-popup");
  const posterTitle = popup.querySelector(".popup-title-img");
  const posterImg = popup.querySelector(".popup-movie-img");
  const descElem = popup.querySelector(".popup-description");
  const tagsWrap = popup.querySelector(".popup-tags");
  const popupBtn = popup.querySelector("#popup-mylist-btn");

  const highRes = `https://image.tmdb.org/t/p/original${movie.backdrop_path || movie.poster_path}`;
  const lowRes = `https://image.tmdb.org/t/p/w500${movie.backdrop_path || movie.poster_path}`;
  const tags = `${movie.release_date?.split('-')[0] || "N/A"}, Rating: ${movie.vote_average}, Popularity: ${Math.round(movie.popularity)}`;

  popup.style.display = "flex";
  document.body.style.overflow = "hidden";
  posterTitle.textContent = movie.title;
  posterImg.src = lowRes;
  descElem.textContent = movie.overview;

  tagsWrap.innerHTML = "";
  tags.split(",").forEach((tag) => {
    const span = document.createElement("span");
    span.textContent = tag.trim();
    tagsWrap.appendChild(span);
  });

  const movieObj = {
    title: movie.title,
    poster: highRes,
    description: movie.overview,
    tags
  };

  const myList = JSON.parse(localStorage.getItem("myList")) || [];
  const exists = myList.some((m) => m.title === movie.title);

  popupBtn.innerHTML = exists
    ? `<i class="fas fa-trash-alt"></i> Remove`
    : `<i class="fas fa-plus"></i> My List`;

  popupBtn.onclick = () => {
    let updatedList = [...myList];
    if (exists) {
      updatedList = updatedList.filter((m) => m.title !== movie.title);
      popupBtn.innerHTML = `<i class="fas fa-plus"></i> My List`;
      alert("Removed from My List");
    } else {
      updatedList.push(movieObj);
      popupBtn.innerHTML = `<i class="fas fa-check"></i> Added`;
      alert("Added to My List");
    }
    localStorage.setItem("myList", JSON.stringify(updatedList));
  };

  const tempImg = new Image();
  tempImg.src = highRes;
  tempImg.onload = () => {
    posterImg.src = highRes;
  };
}

function addGlobalPopupListeners() {
  const popup = document.getElementById("global-popup");
  const closeBtn = popup.querySelector(".close-btn");
  const overlay = popup.querySelector(".popup-overlay");

  closeBtn.addEventListener("click", () => {
    popup.style.display = "none";
    document.body.style.overflow = "auto";
  });

  overlay.addEventListener("click", () => {
    popup.style.display = "none";
    document.body.style.overflow = "auto";
  });
}
