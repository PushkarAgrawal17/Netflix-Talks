// --------------- Safety check for TMDB API Key ----------------
if (typeof apiKey === "undefined") {
    alert("API key is missing. Please create config.js with your TMDB API key.");
}


// -------------------- Hero Slideshow Setup --------------------
const heroContainer = document.getElementById("hero-slides-container");
const dotsContainer = document.getElementById("slider-dots-container");

let slideElements = [];
let dotElements = [];
let index = 0;
let slideInterval;

function showSlide(i) {
    slideElements.forEach((slide, idx) => {
        slide.classList.remove('active-slide');
        dotElements[idx].classList.remove('active-dot');
    });

    slideElements[i].classList.add('active-slide');
    dotElements[i].classList.add('active-dot');
    index = i;
}

function nextSlide() {
    if (slideElements.length === 0) return;
    index = (index + 1) % slideElements.length;
    showSlide(index);
}

function loadHeroSlides() {
    const heroEndpoint = `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=en-US&page=1`;

    fetch(heroEndpoint)
        .then(res => res.json())
        .then(data => {
            const slides = data.results.slice(0, 10);
            heroContainer.innerHTML = "";
            dotsContainer.innerHTML = "";

            slides.forEach((movie, i) => {
                const bgImg = `https://image.tmdb.org/t/p/original${movie.backdrop_path || movie.poster_path}`;
                const description = movie.overview;

                const slide = document.createElement("div");
                slide.classList.add("hero-slide");
                if (i === 0) slide.classList.add("active-slide");
                slide.style.backgroundImage = `url(${bgImg})`;

                slide.innerHTML = `
<div class="slide-content">
  <h1 class="slide-title">${movie.title}</h1>
  <p>${description}</p>
  <div class="slide-buttons">
    <button><i class="fas fa-play"></i> Play</button>
    <button class="mylist-btn"
      data-title="${movie.title}"
      data-poster="${bgImg}"
      data-description="${movie.overview}"
      data-tags="${movie.release_date?.split('-')[0]}, Rating: ${movie.vote_average}, Popularity: ${Math.round(movie.popularity)}"
    ><i class="fas fa-plus"></i> My List
    </button>
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

            // MY LIST button working ---for hero slides
            document.querySelectorAll(".mylist-btn").forEach((btn) => {
                btn.addEventListener("click", () => {
                    const movie = {
                        title: btn.getAttribute("data-title"),
                        poster: btn.getAttribute("data-poster"),
                        description: btn.getAttribute("data-description"),
                        tags: btn.getAttribute("data-tags")
                    };
                    addToMyList(movie);
                });
            });

        })
        .catch(err => console.error("Failed to load hero slides", err));
}

loadHeroSlides();
slideInterval = setInterval(nextSlide, 5000);


// -------------------------- Movie Rows ---------------------------
const endpoints = {
    trending: `https://api.themoviedb.org/3/trending/movie/week?api_key=${apiKey}`,
    topRated: `https://api.themoviedb.org/3/movie/top_rated?api_key=${apiKey}`,
    blockbuster: `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&sort_by=revenue.desc&region=US`,
    bollywood: `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_original_language=hi&region=IN&sort_by=popularity.desc`,
    koreanTV: `https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}&with_original_language=ko&sort_by=popularity.desc`,
    action: `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_genres=28&sort_by=popularity.desc&language=en-US`,
    horror: `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_genres=27&sort_by=popularity.desc`,
};

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
      <button class="popup-mylist-btn" style="margin-left: 1rem; padding: 10px 16px; background: red; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;"><i class="fas fa-plus"></i> My List
        </button>
    </div>`;

    document.body.appendChild(popup);
    addGlobalPopupListeners();
}

function fetchAndDisplayMovies(url, containerId) {
    const container = document.getElementById(containerId);

    fetch(url)
        .then(res => res.json())
        .then(data => {
            container.innerHTML = "";
            let rank = 1;

            data.results.forEach(movie => {
                const card = document.createElement("div");
                card.classList.add("poster-card");

                card.innerHTML = `
                    <span class="rank">${rank++}</span>
                    <img
                        src="https://image.tmdb.org/t/p/w500${movie.poster_path}"
                        alt="${movie.title}"
                        class="movie-poster"
                        data-title="${movie.title}"
                        data-poster="https://image.tmdb.org/t/p/w500${movie.backdrop_path || movie.poster_path}"
                        data-highres-poster="https://image.tmdb.org/t/p/original${movie.backdrop_path || movie.poster_path}"
                        data-description="${movie.overview}"
                        data-tags="${movie.release_date?.split('-')[0]}, Rating: ${movie.vote_average}, Popularity: ${Math.round(movie.popularity)}"
                    />
                `;
                container.appendChild(card);
            });
            addPosterListeners(container);
        })
        .catch(err => {
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

    container.querySelectorAll(".movie-poster").forEach(poster => {
        poster.addEventListener("click", () => {
            popup.style.display = "flex";
            document.body.style.overflow = "hidden";

            const title = poster.getAttribute("data-title");
            const lowRes = poster.getAttribute("data-poster");
            const highRes = poster.getAttribute("data-highres-poster");

            posterTitle.textContent = title;
            posterImg.src = lowRes;
            descElem.textContent = poster.getAttribute("data-description");

            tagsWrap.innerHTML = "";
            poster.getAttribute("data-tags").split(",").forEach(tag => {
                const span = document.createElement("span");
                span.textContent = tag.trim();
                tagsWrap.appendChild(span);
            });

            const tempImg = new Image();
            tempImg.src = highRes;
            tempImg.onload = () => {
                posterImg.src = highRes;
            };

            const popupAddBtn = document.querySelector(".popup-mylist-btn");
            if (popupAddBtn) {
                popupAddBtn.onclick = () => {
                    const movie = {
                        title,
                        poster: highRes,
                        description: descElem.textContent,
                        tags: Array.from(tagsWrap.querySelectorAll("span"))
                            .map((span) => span.textContent)
                            .join(", ")
                    };
                    addToMyList(movie);
                };
            }
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

fetchAndDisplayMovies(endpoints.trending, "trending");
fetchAndDisplayMovies(endpoints.topRated, "top-rated");
fetchAndDisplayMovies(endpoints.blockbuster, "blockbuster");
fetchAndDisplayMovies(endpoints.bollywood, "bollywood");
fetchAndDisplayMovies(endpoints.koreanTV, "koreanTV");
fetchAndDisplayMovies(endpoints.action, "action");
fetchAndDisplayMovies(endpoints.horror, "horror");


// -------------------- Navbar Profile Dropdown ------------------
const profileIcon = document.getElementById("profileIcon");
const profileDropdown = document.getElementById("profileDropdown");

profileIcon.addEventListener("click", () => {
    profileDropdown.style.display =
        profileDropdown.style.display === "block" ? "none" : "block";
});

document.addEventListener("click", (e) => {
    if (!profileDropdown.contains(e.target) && !profileIcon.contains(e.target)) {
        profileDropdown.style.display = "none";
    }
});

document.querySelectorAll("#profileDropdown li").forEach((item) => {
    item.addEventListener("click", () => {
        profileDropdown.style.display = "none";
    });
});

document.getElementById("signOut").addEventListener("click", () => {
    profileDropdown.style.display = "none";
    window.location.href = "1getStarted.html";
});

document.getElementById("accountBtn").addEventListener("click", () => {
    profileDropdown.style.display = "none";
    window.location.href = "account.html";
});

document.getElementById("settingsBtn").addEventListener("click", () => {
    profileDropdown.style.display = "none";
    window.location.href = "settings.html";
});

window.addEventListener("DOMContentLoaded", () => {
    const savedProfilePic = localStorage.getItem("profilePic");
    if (savedProfilePic) {
        const profileIcon = document.getElementById("profileIcon");
        if (profileIcon) {
            profileIcon.src = savedProfilePic;
        }
    }
});


// -------------------- Add to My List ------------------
function addToMyList(movie) {
    const currentList = JSON.parse(localStorage.getItem("myList")) || [];
    const exists = currentList.some((m) => m.title === movie.title);
    if (!exists) {
        currentList.push({
            title: movie.title,
            poster: movie.poster,
            description: movie.description || "No description available",
            tags: movie.tags || "Movie"
        });
        localStorage.setItem("myList", JSON.stringify(currentList));
        alert("Added to My List!");
    } else {
        alert("Already in My List");
    }
}
