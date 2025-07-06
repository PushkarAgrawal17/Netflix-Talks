window.addEventListener("DOMContentLoaded", () => {
  const listContainer = document.querySelector(".poster-grid");
  const myList = JSON.parse(localStorage.getItem("myList")) || [];

  if (myList.length === 0) {
    listContainer.innerHTML =
      "<p style='color:white; font-size:18px; text-align:center; padding:2rem;'>No movies in My List yet!</p>";
    return;
  }

  listContainer.innerHTML = ""; // Clear existing content
  myList.forEach((movie) => {
    const div = document.createElement("div");
    div.classList.add("poster-card");
    div.innerHTML = `<img src="${movie.poster}" alt="${movie.title}" title="${movie.title}" />`;
    listContainer.appendChild(div);
  });
});
