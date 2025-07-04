// Display movies through API
if (typeof apiKey === "undefined") {
    alert("API key is missing. Please create config.js with your TMDB API key.");
}

const endpoints = {
    trending: `https://api.themoviedb.org/3/trending/movie/week?api_key=${apiKey}`,
    topRated: `https://api.themoviedb.org/3/movie/top_rated?api_key=${apiKey}`,
    blockbuster: `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&sort_by=revenue.desc&region=US`,
    bollywood: `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_original_language=hi&region=IN&sort_by=popularity.desc`,
    koreanTV: `https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}&with_original_language=ko&sort_by=popularity.desc`,
    action: `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_genres=28&sort_by=popularity.desc&language=en-US`,
    horror: `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_genres=27&sort_by=popularity.desc`,
};

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
                        data-poster="https://image.tmdb.org/t/p/w500${movie.backdrop_path || movie.poster_path}"
                        data-description="${movie.overview}"
                        data-tags="${movie.release_date?.split('-')[0]}, Rating: ${movie.vote_average}, Popularity: ${Math.round(movie.popularity)}"
                    />
                `;

                container.appendChild(card);
            });

            addPopupListeners();
        })
        .catch(err => {
            console.error("TMDB fetch failed", err);
            container.innerHTML = "<p>Failed to load movies. Please try again later.</p>";
        });
}

// Fetch all rows
fetchAndDisplayMovies(endpoints.trending, "trending");
fetchAndDisplayMovies(endpoints.topRated, "top-rated");
fetchAndDisplayMovies(endpoints.blockbuster, "blockbuster");
fetchAndDisplayMovies(endpoints.bollywood, "bollywood");
fetchAndDisplayMovies(endpoints.koreanTV, "koreanTV");
fetchAndDisplayMovies(endpoints.action, "action");
fetchAndDisplayMovies(endpoints.horror, "horror");

function addPopupListeners() {
    document.querySelectorAll(".movie-poster").forEach(poster => {
        poster.addEventListener("click", () => {
            const popup = document.getElementById("popup1");
            const posterImg = popup.querySelector(".popup-movie-img");
            const titleImg = popup.querySelector(".popup-title-img");
            const descElem = popup.querySelector(".popup-description");
            const tagsWrap = popup.querySelector(".popup-tags");

            posterImg.src = poster.getAttribute("data-poster");
            titleImg.src = "";
            descElem.textContent = poster.getAttribute("data-description");

            tagsWrap.innerHTML = "";
            poster.getAttribute("data-tags").split(",").forEach(tag => {
                const span = document.createElement("span");
                span.textContent = tag.trim();
                tagsWrap.appendChild(span);
            });

            popup.style.display = "block";
        });
    });
}

// Add to watchlist
function addToWatchlist(movie) {
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            const watchlistRef = db.collection("watchlists").doc(user.uid);
            const docSnap = await watchlistRef.get();

            if (docSnap.exists) {
                const existingMovies = docSnap.data().movies || [];

                const isDuplicate = existingMovies.some(m => m.id === movie.id);
                if (!isDuplicate) {
                    await watchlistRef.update({
                        movies: firebase.firestore.FieldValue.arrayUnion(movie)
                    });
                    alert("Added to My List!");
                } else {
                    alert("Movie already in your list!");
                }
            } else {
                await watchlistRef.set({
                    movies: [movie]
                });
                alert("Added to My List!");
            }
        } else {
            alert("Please sign in to add to your list.");
        }
    });
}

document.querySelectorAll(".add-to-list").forEach((btn, index) => {
    const activeSlide = document.querySelectorAll(".hero-slide")[index];
    const bgImage = activeSlide.style.backgroundImage.match(/url\("(.*?)"\)/)[1];
    const title = activeSlide.querySelector(".slide-title-img").alt;
    const posterPath = bgImage.replace("https://image.tmdb.org/t/p/w500", "");

    const movie = {
        id: `hero-${index}`,
        title,
        poster_path: posterPath
    };

    setupWatchlistButtons(btn, movie);

    btn.addEventListener("click", () => {
        toggleWatchlist(btn, movie);
    });
});

// Load watchlist
function loadWatchlist() {
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            const ref = db.collection("watchlists").doc(user.uid);
            const snap = await ref.get();
            if (snap.exists) {
                const movies = snap.data().movies;
                const container = document.getElementById("user-watchlist");
                container.innerHTML = "";

                movies.forEach(movie => {
                    const card = document.createElement("div");
                    card.classList.add("movie-card");

                    card.innerHTML = `
                        <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" />
                        <p>${movie.title}</p>
                        <button class="remove-btn"><i class="fas fa-times"></i></button>
                    `;

                    const removeBtn = card.querySelector(".remove-btn");
                    removeBtn.addEventListener("click", () => {
                        removeFromWatchlist(movie);
                    });

                    container.appendChild(card);
                });
            }
        }
    });
}

loadWatchlist();

// Remove from watchlist
function removeFromWatchlist(movie) {
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            const watchlistRef = db.collection("watchlists").doc(user.uid);
            const docSnap = await watchlistRef.get();

            if (docSnap.exists) {
                await watchlistRef.update({
                    movies: firebase.firestore.FieldValue.arrayRemove(movie)
                });
                alert("Removed from My List!");
                loadWatchlist();
            }
        }
    });
}

// Watchlist buttons
function setupWatchlistButtons(button, movie) {
    const icon = button.querySelector("i");

    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            const ref = db.collection("watchlists").doc(user.uid);
            const snap = await ref.get();
            const list = snap.exists ? snap.data().movies : [];
            const isInList = list.some(m => m.id === movie.id);

            if (isInList) {
                icon.classList.remove("fa-plus");
                icon.classList.add("fa-times");
            } else {
                icon.classList.remove("fa-times");
                icon.classList.add("fa-plus");
            }
        }
    });
}

function toggleWatchlist(button, movie) {
    const icon = button.querySelector("i");

    firebase.auth().onAuthStateChanged(async (user) => {
        if (!user) {
            alert("Please sign in to use your watchlist.");
            return;
        }

        const ref = db.collection("watchlists").doc(user.uid);
        const snap = await ref.get();
        const movies = snap.exists ? snap.data().movies : [];
        const isInList = movies.some(m => m.id === movie.id);

        if (isInList) {
            await ref.update({
                movies: firebase.firestore.FieldValue.arrayRemove(movie)
            });
            icon.classList.remove("fa-times");
            icon.classList.add("fa-plus");
            alert("Removed from My List!");
            loadWatchlist();
        } else {
            if (snap.exists) {
                await ref.update({
                    movies: firebase.firestore.FieldValue.arrayUnion(movie)
                });
            } else {
                await ref.set({
                    movies: [movie]
                });
            }
            icon.classList.remove("fa-plus");
            icon.classList.add("fa-times");
            alert("Added to My List!");
            loadWatchlist();
        }
    });
}
