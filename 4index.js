// ===== Firebase Setup =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyAmyFBiAahRlD8j15Am3UclG1-YJOmS5yQ",
    authDomain: "netflix-web-project.firebaseapp.com",
    projectId: "netflix-web-project",
    storageBucket: "netflix-web-project.appspot.com",
    messagingSenderId: "616557096999",
    appId: "1:616557096999:web:027b9189b6f5b283115e02"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

function showToast(message, color = "#00b09b") {
    Toastify({
        text: message,
        duration: 5000,
        gravity: "bottom",
        position: "left",
        backgroundColor: color
    }).showToast();
}

// -------- Safety check for TMDB API Key --------
if (typeof apiKey === "undefined") {
    alert("API key is missing. Please create config.js with your TMDB API key.");
}

// -------- Hero Slideshow Setup --------
const heroContainer = document.getElementById("hero-slides-container");
const dotsContainer = document.getElementById("slider-dots-container");

let slideElements = [];
let dotElements = [];
let index = 0;
let slideInterval;

function showSlide(i) {
    slideElements.forEach((slide, idx) => {
        slide.classList.remove("active-slide");
        dotElements[idx].classList.remove("active-dot");
    });

    slideElements[i].classList.add("active-slide");
    dotElements[i].classList.add("active-dot");
    index = i;
}

function nextSlide() {
    if (slideElements.length === 0) return;
    index = (index + 1) % slideElements.length;
    showSlide(index);
}

async function addToMyListFirestore(movie) {
    console.log("auth.currentUser:", auth.currentUser);
    const user = auth.currentUser;
    if (!user) {
        showToast("Please sign in to add to your list.", "#FFD700");
        return;
    }

    const uid = user.uid;
    const movieRef = doc(db, "users", uid, "myList", movie.title);
    const docSnap = await getDoc(movieRef);

    if (docSnap.exists()) {
        showToast("Already in My List", "#FFD700");
        return;
    }

    await setDoc(movieRef, {
        title: movie.title,
        poster: movie.poster,
        description: movie.description || "No description available",
        tags: movie.tags || "Movie",
        addedAt: new Date()
    });
    showToast("Added to My List!", "green");
}

function loadHeroSlides() {
    const heroEndpoint = `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=en-US&page=1`;

    fetch(heroEndpoint)
        .then((res) => res.json())
        .then((data) => {
            const slides = data.results.slice(0, 10);
            heroContainer.innerHTML = "";
            dotsContainer.innerHTML = "";

            slides.forEach((movie, i) => {
                const bgImg = `https://image.tmdb.org/t/p/original${movie.backdrop_path || movie.poster_path}`;
                const slide = document.createElement("div");
                slide.classList.add("hero-slide");
                if (i === 0) slide.classList.add("active-slide");
                slide.style.backgroundImage = `url(${bgImg})`;

                slide.innerHTML = `
                <div class="slide-content">
                    <h1 class="slide-title">${movie.title}</h1>
                    <p>${movie.overview}</p>
                    <div class="slide-buttons">

                    <!-- Info button -->
                    <button class="info-btn"
                        data-title="${movie.title}"
                        data-poster="https://image.tmdb.org/t/p/w500${movie.backdrop_path || movie.poster_path}"
                        data-highres-poster="https://image.tmdb.org/t/p/original${movie.backdrop_path || movie.poster_path}"
                        data-description="${movie.overview}"
                        data-tags="${movie.release_date?.split('-')[0]}, Rating: ${movie.vote_average}, Popularity: ${Math.round(movie.popularity)}"
                    ><i class="fas fa-info-circle"></i> Info</button>

                    <button class="mylist-btn"
                        data-title="${movie.title}"
                        data-poster="${bgImg}"
                        data-description="${movie.overview}"
                        data-tags="${movie.release_date?.split('-')[0]}, Rating: ${movie.vote_average}, Popularity: ${Math.round(movie.popularity)}"
                    ><i class="fas fa-plus"></i> My List</button>
                </div>
              </div>`;

                heroContainer.appendChild(slide);

                const dot = document.createElement("span");
                dot.classList.add("dot");
                if (i === 0) dot.classList.add("active-dot");
                dot.addEventListener("click", () => {
                    clearInterval(slideInterval);
                    showSlide(i);
                    slideInterval = setInterval(nextSlide, 5000);
                });
                dotsContainer.appendChild(dot);
            });

            slideElements = document.querySelectorAll(".hero-slide");
            dotElements = document.querySelectorAll(".dot");
            showSlide(0);

            document.querySelectorAll(".mylist-btn").forEach((btn) => {
                btn.addEventListener("click", () => {
                    console.log("My List button clicked!");
                    const movie = {
                        title: btn.dataset.title,
                        poster: btn.dataset.poster,
                        description: btn.dataset.description,
                        tags: btn.dataset.tags
                    };
                    addToMyListFirestore(movie);
                });
            });
        })
        .catch((err) => console.error("Failed to load hero slides", err));
}

loadHeroSlides();
slideInterval = setInterval(nextSlide, 5000);

// -------- Movie Rows --------
const endpoints = {
    trending: `https://api.themoviedb.org/3/trending/movie/week?api_key=${apiKey}`,
    topRated: `https://api.themoviedb.org/3/movie/top_rated?api_key=${apiKey}`,
    blockbuster: `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&sort_by=revenue.desc&region=US`,
    bollywood: `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_original_language=hi&region=IN&sort_by=popularity.desc`,
    koreanTV: `https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}&with_original_language=ko&sort_by=popularity.desc`,
    action: `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_genres=28&sort_by=popularity.desc&language=en-US`,
    horror: `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_genres=27&sort_by=popularity.desc`
};


createGlobalPopup();

fetchAndDisplayMovies(endpoints.trending, "trending");
fetchAndDisplayMovies(endpoints.topRated, "top-rated");
fetchAndDisplayMovies(endpoints.blockbuster, "blockbuster");
fetchAndDisplayMovies(endpoints.bollywood, "bollywood");
fetchAndDisplayMovies(endpoints.koreanTV, "koreanTV");
fetchAndDisplayMovies(endpoints.action, "action");
fetchAndDisplayMovies(endpoints.horror, "horror");

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

function fetchAndDisplayMovies(url, containerId) {
    const container = document.getElementById(containerId);

    fetch(url)
        .then((res) => res.json())
        .then((data) => {
            container.innerHTML = "";
            let rank = 1;

            data.results.forEach((movie) => {
                const card = document.createElement("div");
                card.classList.add("poster-card");

                card.innerHTML = `
                    <span class="rank">${rank++}</span>
                    <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}"
                        alt="${movie.title}"
                        class="movie-poster"
                        data-title="${movie.title}"
                        data-poster="https://image.tmdb.org/t/p/w500${movie.backdrop_path || movie.poster_path}"
                        data-highres-poster="https://image.tmdb.org/t/p/original${movie.backdrop_path || movie.poster_path}"
                        data-description="${movie.overview}"
                        data-tags="${movie.release_date?.split('-')[0]}, Rating: ${movie.vote_average}, Popularity: ${Math.round(movie.popularity)}"
                    />`;
                container.appendChild(card);
            });

            addPosterListeners(container);
        })
        .catch((err) => {
            console.error("TMDB fetch failed", err);
            container.innerHTML = "<p>Failed to load movies. Please try again later.</p>";
        });
}

function addPosterListeners(container) {
    const popup = document.getElementById("global-popup");
    const posterTitle = popup.querySelector(".popup-title-img");
    const posterImg = popup.querySelector(".popup-movie-img");
    const descElem = popup.querySelector(".popup-description");
    const tagsWrap = popup.querySelector(".popup-tags");
    const popupBtn = popup.querySelector("#popup-mylist-btn");

    container.querySelectorAll(".movie-poster").forEach((poster) => {
        poster.addEventListener("click", () => {
            const title = poster.dataset.title;
            const lowRes = poster.dataset.poster;
            const highRes = poster.dataset.highresPoster;
            const description = poster.dataset.description;
            const tags = poster.dataset.tags;

            popup.style.display = "flex";
            document.body.style.overflow = "hidden";
            posterTitle.textContent = title;
            posterImg.src = lowRes;
            descElem.textContent = description;

            tagsWrap.innerHTML = "";
            tags.split(",").forEach((tag) => {
                const span = document.createElement("span");
                span.textContent = tag.trim();
                tagsWrap.appendChild(span);
            });

            const movie = {
                title,
                poster: highRes,
                description,
                tags
            };

            onAuthStateChanged(auth, async (user) => {
                if (!user) {
                    popupBtn.innerHTML = `<a href="3sign_In.html"><i class="fas fa-lock"></i> Sign In to Save</a>`;
                    popupBtn.disabled = true;
                    return;
                }

                const uid = user.uid;
                const movieRef = doc(db, "users", uid, "myList", movie.title);
                const docSnap = await getDoc(movieRef);
                const exists = docSnap.exists();

                popupBtn.innerHTML = exists
                    ? `<i class="fas fa-trash-alt"></i> Remove`
                    : `<i class="fas fa-plus"></i> My List`;

                popupBtn.disabled = false;

                popupBtn.onclick = async () => {
                    if (exists) {
                        await deleteDoc(movieRef);
                        popupBtn.innerHTML = `<i class="fas fa-plus"></i> My List`;
                        showToast("Removed from My List", "red")
                    } else {
                        await setDoc(movieRef, {
                            title,
                            poster: highRes,
                            description,
                            tags,
                            addedAt: new Date()
                        });
                        popupBtn.innerHTML = `<i class="fas fa-check"></i> Added`;
                        showToast("Added to My List!", "green");
                    }
                };
            });

            const tempImg = new Image();
            tempImg.src = highRes;
            tempImg.onload = () => {
                posterImg.src = highRes;
            };
        });
    });
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

createGlobalPopup();

Object.entries(endpoints).forEach(([key, url]) =>
    fetchAndDisplayMovies(url, key)
);

// -------- Navbar Dropdown --------
const profileIcon = document.getElementById("profileIcon");
const profileDropdown = document.getElementById("profileDropdown");

profileIcon.addEventListener("click", () => {
    profileDropdown.style.display =
        profileDropdown.style.display === "block" ? "none" : "block";
});

document.addEventListener("click", (e) => {
    if (
        !profileDropdown.contains(e.target) &&
        !profileIcon.contains(e.target)
    ) {
        profileDropdown.style.display = "none";
    }
});

document.querySelectorAll("#profileDropdown li").forEach((item) => {
    item.addEventListener("click", () => {
        profileDropdown.style.display = "none";
    });
});

document.getElementById("signOut").addEventListener("click", () => {
    window.location.href = "1getStarted.html";
});

document.getElementById("accountBtn").addEventListener("click", () => {
    window.location.href = "account.html";
});

document.getElementById("settingsBtn")?.addEventListener("click", () => {
    window.location.href = "settings.html";
});

window.addEventListener("DOMContentLoaded", () => {
    const savedProfilePic = localStorage.getItem("profilePic");
    if (savedProfilePic) {
        const profileIcon = document.getElementById("profileIcon");
        if (profileIcon) profileIcon.src = savedProfilePic;
    }
});
