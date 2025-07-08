const tileContainer = document.getElementById("tile-bg");
const tileSize = 80;
const gap = 4;

function createTiles() {
    const columns = Math.floor(window.innerWidth / (tileSize + gap));
    const rows = Math.floor(window.innerHeight / (tileSize + gap));
    const total = columns * rows;

    tileContainer.innerHTML = '';

    for (let i = 0; i < total; i++) {
        const tile = document.createElement("div");
        tile.classList.add("tile");

        // Hover-triggered glow
        tile.addEventListener("mouseenter", () => {
            tile.classList.remove("glowing");
            void tile.offsetWidth; // Force reflow to restart animation
            tile.classList.add("glowing");
        });

        tileContainer.appendChild(tile);
    }
}

window.addEventListener("resize", createTiles);
window.addEventListener("DOMContentLoaded", createTiles);
