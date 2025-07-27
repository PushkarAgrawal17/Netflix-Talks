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
            const posterCard = document.createElement('div');
            posterCard.classList.add('poster-card');

            const backdropLow = `https://image.tmdb.org/t/p/w500${movie.backdrop_path}`

            const backdropHigh = `https://image.tmdb.org/t/p/original${movie.backdrop_path}`

            posterCard.innerHTML = `
                <span class="rank">${index + 1}</span>
                <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title}" class="movie-poster"
                    data-backdrop-low="${backdropLow}"
                    data-backdrop="${backdropHigh}"
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
            const lowRes = poster.getAttribute("data-backdrop-low"); // w500
            const highRes = poster.getAttribute("data-backdrop");     // original

            // Load low-res first
            posterImg.src = lowRes;
            posterImg.style.filter = "blur(8px)";
            posterImg.style.transition = "filter 0.4s ease";

            // Preload high-res
            const highResImg = new Image();
            highResImg.src = highRes;
            highResImg.onload = () => {
                posterImg.src = highRes;
                posterImg.style.filter = "blur(0)";
            };

            // Fill in other content
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

    // Popup close logic
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
