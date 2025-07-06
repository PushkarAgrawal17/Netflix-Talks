// window.addEventListener("DOMContentLoaded", () => {
//   const listContainer = document.querySelector(".poster-grid");
//   const myList = JSON.parse(localStorage.getItem("myList")) || [];

//   if (myList.length === 0) {
//     listContainer.innerHTML =
//       "<p style='color:white; font-size:18px; text-align:center; padding:2rem;'>No movies in My List yet!</p>";
//     return;
//   }

//   listContainer.innerHTML = ""; // Clear existing content
//   myList.forEach((movie) => {
//     const div = document.createElement("div");
//     div.classList.add("poster-card");
//     div.innerHTML = `<img src="${movie.poster}" alt="${movie.title}" title="${movie.title}" />`;
//     listContainer.appendChild(div);
//   });
// });

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
popup.style.display = "flex";
document.body.style.overflow = "hidden";

  document.querySelector(".popup-title-img").textContent = poster.dataset.title;
  document.querySelector(".popup-movie-img").src = poster.dataset.poster;
  document.querySelector(".popup-description").textContent = poster.dataset.description;

  const tagsWrap = document.querySelector(".popup-tags");
  tagsWrap.innerHTML = "";
  (poster.dataset.tags || "").split(",").forEach((tag) => {
    const span = document.createElement("span");
    span.textContent = tag.trim();
    tagsWrap.appendChild(span);
  });

  // Remove from list
  const removeBtn = document.getElementById("remove-btn");
  removeBtn.onclick = () => {
    const title = poster.dataset.title;
    const updated = list.filter((item) => item.title !== title);
    localStorage.setItem("myList", JSON.stringify(updated));
    popup.style.display = "none";
    document.body.style.overflow = "auto";
    location.reload(); // Refresh the list
  };
});
});

// Close popup
document.querySelector(".popup-overlay").addEventListener("click", closePopup);
document.querySelector(".close-btn").addEventListener("click", closePopup);

function closePopup() {
document.getElementById("mylist-popup").style.display = "none";
document.body.style.overflow = "auto";
}
});