// ================== Trending movies through API ===================
import { apiKey } from './config.js';

const scrollContainer = document.getElementById('scrollContainer');

// Fetch trending movies
async function fetchTrendingMovies() {
    try {
        const res = await fetch(
            `https://api.themoviedb.org/3/trending/movie/week?api_key=${apiKey}`
        );
        const data = await res.json();

        // Clear existing cards
        scrollContainer.innerHTML = '';

        data.results.slice(0, 10).forEach((movie, index) => {
            const poster = movie.poster_path
                ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                : 'Images/default.jpg';

            const posterCard = document.createElement('div');
            posterCard.classList.add('poster-card');
            posterCard.innerHTML = `
                <span class="rank">${index + 1}</span>
                <img src="${poster}" alt="${movie.title}" class="movie-poster"
                    data-poster="${poster}"
                    data-backdrop="https://image.tmdb.org/t/p/w780${movie.backdrop_path}"
                    data-title="${movie.title}"
                    data-description="${movie.overview}"
                    data-tags="${movie.release_date.split('-')[0]},${movie.vote_average >= 7 ? 'Popular' : 'Drama'},${movie.original_language.toUpperCase()}"/>
            `;
            scrollContainer.appendChild(posterCard);
        });

        attachPosterPopupEvents(); // rebind popup logic
    } catch (err) {
        console.error('Failed to fetch trending:', err);
    }
}

// Re-attach popup events after DOM update
function attachPosterPopupEvents() {
    const popup = document.getElementById("popup1");
    const posterImg = popup.querySelector(".popup-movie-img");
    const textTitle = popup.querySelector(".popup-title-text");
    const descElem = popup.querySelector(".popup-description");
    const tagsWrap = popup.querySelector(".popup-tags");

    document.querySelectorAll(".movie-poster").forEach((poster) => {
        poster.addEventListener("click", () => {
            posterImg.src = poster.getAttribute("data-backdrop");
            textTitle.textContent = poster.getAttribute("data-title");
            descElem.textContent = poster.getAttribute("data-description");

            tagsWrap.innerHTML = '';
            poster.getAttribute("data-tags").split(",").forEach(tag => {
                const span = document.createElement("span");
                span.textContent = tag.trim();
                tagsWrap.appendChild(span);
            });

            popup.style.display = "flex";
        });
    });

    // Add popup close logic here
    const closeBtn = popup.querySelector(".close-btn");
    const overlay = popup.querySelector(".popup-overlay");

    closeBtn.addEventListener("click", () => {
        popup.style.display = "none";
    });

    overlay.addEventListener("click", () => {
        popup.style.display = "none";
    });
}

fetchTrendingMovies();


// FAQ plus to cross
document.querySelectorAll(".faq-question").forEach((btn) => {
    btn.addEventListener("click", () => {
        const item = btn.closest(".faq-item");
        item.classList.toggle("open");
    });
});
