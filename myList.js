import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import {
    getFirestore,
    collection,
    getDocs,
    deleteDoc,
    doc
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
const auth = getAuth(app);
const db = getFirestore(app);

window.addEventListener("DOMContentLoaded", () => {
    const container = document.querySelector(".poster-grid");
    if (!container) return;

    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            container.innerHTML = "<p>Please sign in to view your list.</p>";
            return;
        }

        const uid = user.uid;
        const listRef = collection(db, "users", uid, "myList");
        const snapshot = await getDocs(listRef);

        container.innerHTML = "";

        snapshot.forEach((docSnap) => {
            const movie = docSnap.data();

            const card = document.createElement("div");
            card.classList.add("poster-card");

            const img = document.createElement("img");
            img.classList.add("poster");
            img.src = movie.poster;
            img.alt = movie.title;
            img.dataset.title = movie.title;
            img.dataset.poster = movie.poster;
            img.dataset.description = movie.description || "No description available";
            img.dataset.tags = movie.tags || "Movie";

            card.appendChild(img);
            container.appendChild(card);
        });

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

                const removeBtn = popup.querySelector("#remove-btn");
                removeBtn.onclick = async () => {
                    await deleteDoc(doc(db, "users", uid, "myList", poster.dataset.title));
                    popup.style.display = "none";
                    document.body.style.overflow = "auto";
                    location.reload();
                };
            });
        });

        // Close pop up
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
});
