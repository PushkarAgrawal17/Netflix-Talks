window.addEventListener("DOMContentLoaded", () => {
    const list = JSON.parse(localStorage.getItem("myList")) || [];
    const container = document.querySelector(".poster-grid");

    if (!container) return;
    container.innerHTML = "";

    list.forEach((movie) => {
        const card = document.createElement("div");
        card.classList.add("poster-card");
        card.innerHTML = `
      <img src="${movie.poster}" alt="${movie.title}"
        class="poster"
        data-title="${movie.title}"
        data-poster="${movie.poster}"
        data-description="${movie.description || 'No description available'}"
        data-tags="${movie.tags || 'Movie'}"
      />
    `;
        container.appendChild(card);
    });

    // Poster click → open popup
    document.querySelectorAll(".poster").forEach((poster) => {
        poster.addEventListener("click", () => {
            const popup = document.getElementById("mylist-popup");
            if (!popup) return;

            popup.style.display = "flex";
            document.body.style.overflow = "hidden";

            popup.querySelector(".popup-title-img").textContent = poster.dataset.title;
            popup.querySelector(".popup-movie-img").src = poster.dataset.poster;
            popup.querySelector(".popup-description").textContent = poster.dataset.description;

            const tagsWrap = popup.querySelector(".popup-tags");
            tagsWrap.innerHTML = "";
            (poster.dataset.tags || "").split(",").forEach((tag) => {
                const span = document.createElement("span");
                span.textContent = tag.trim();
                tagsWrap.appendChild(span);
            });

            // Remove from list
            const removeBtn = popup.querySelector("#remove-btn");
            removeBtn.onclick = () => {
                const title = poster.dataset.title;
                const updated = list.filter((item) => item.title !== title);
                localStorage.setItem("myList", JSON.stringify(updated));
                popup.style.display = "none";
                document.body.style.overflow = "auto";
                location.reload();
            };
        });
    });

    // Close popup
    document.querySelector(".popup-overlay")?.addEventListener("click", closePopup);
    document.querySelector(".close-btn")?.addEventListener("click", closePopup);

    function closePopup() {
        const popup = document.getElementById("mylist-popup");
        if (popup) {
            popup.style.display = "none";
            document.body.style.overflow = "auto";
        }
    }
});
