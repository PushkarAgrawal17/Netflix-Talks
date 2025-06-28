const apiKey = "675abfca53fb3ac33f6a90826ade779b"; 
const trendingUrl = `https://api.themoviedb.org/3/trending/movie/week?api_key=${apiKey}`;
const trendingContainer = document.getElementById("test");

function fetchTrendingMovies() {
    fetch(trendingUrl)
        .then(res => res.json())
        .then(data => {
            trendingContainer.innerHTML = ""; // Clear existing
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
                        data-title=""
                        data-description="${movie.overview}"
                        data-tags="${movie.release_date?.split('-')[0]}, Rating: ${movie.vote_average}, Popularity: ${Math.round(movie.popularity)}"
                    />
                `;

                trendingContainer.appendChild(card);
            });

            addPopupListeners(); // Activate click events again
        })
        .catch(err => console.error("TMDB fetch failed", err));
}

function addPopupListeners() {
    document.querySelectorAll(".movie-poster").forEach(poster => {
        poster.addEventListener("click", () => {
            const popup = document.getElementById("popup1");
            const posterImg = popup.querySelector(".popup-movie-img");
            const titleImg = popup.querySelector(".popup-title-img");
            const descElem = popup.querySelector(".popup-description");
            const tagsWrap = popup.querySelector(".popup-tags");

            posterImg.src = poster.getAttribute("data-poster");
            titleImg.src = ""; // You can leave this blank or use a custom text image
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

// Run fetch
fetchTrendingMovies();
