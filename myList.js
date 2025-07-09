import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import {
  getFirestore,
  getDocs,
  setDoc, updateDoc, getDoc, deleteDoc,
  doc, arrayUnion, arrayRemove, deleteField,
  collection, query, orderBy
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

function showToast(message, color = "#00b09b") {
    Toastify({
        text: message,
        duration: 5000,
        gravity: "bottom",
        position: "left",
        backgroundColor: color
    }).showToast();
}

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
      img.dataset.id = movie.id;
      img.dataset.title = movie.title;
      img.dataset.bgImgLow = movie.bgImgLowRes;
      img.dataset.bgImgHigh = movie.bgImg;
      img.dataset.description = movie.description || "No description available";
      img.dataset.tags = movie.tags || "Movie";

      card.appendChild(img);
      container.appendChild(card);
    });

    document.querySelectorAll(".poster").forEach((poster) => {
      poster.addEventListener("click", async () => {
        const popup = document.getElementById("mylist-popup");
        if (!popup) return;

        popup.style.display = "flex";
        document.body.style.overflow = "hidden";

        popup.querySelector(".popup-title-img").textContent = poster.dataset.title;
        popup.querySelector(".popup-movie-img").src = poster.dataset.bgImgLow;
        popup.querySelector(".popup-description").textContent = poster.dataset.description;

        const tempImg = new Image();
        tempImg.src = poster.dataset.bgImgHigh;
        tempImg.onload = () => {
          popup.querySelector(".popup-movie-img").src = poster.dataset.bgImgHigh;
        };

        const tagsWrap = popup.querySelector(".popup-tags");
        tagsWrap.innerHTML = "";
        (poster.dataset.tags || "").split(",").forEach((tag) => {
          const span = document.createElement("span");
          span.textContent = tag.trim();
          tagsWrap.appendChild(span);
        });

        const removeBtn = popup.querySelector("#remove-btn");
        removeBtn.onclick = async () => {
          showToast("Item Removed!","red")
          await deleteDoc(doc(db, "users", uid, "myList", poster.dataset.id));
          popup.style.display = "none";
          document.body.style.overflow = "auto";
          location.reload();
        };

        // 🔘 Create placeholder for buttons if not present in HTML
        let popupActions = popup.querySelector(".popup-actions");
        if (!popupActions) {
          popupActions = document.createElement("div");
          popupActions.classList.add("popup-actions");
          popupActions.innerHTML = `
    <button id="like-btn" class="like-btn"><i class="fas fa-thumbs-up"></i><span id="like-count">0</span></button>
    <button id="dislike-btn" class="dislike-btn"><i class="fas fa-thumbs-down"></i><span id="dislike-count">0</span></button>
    <button id="share-btn" class="share-btn"><i class="fas fa-share"></i></button>
  `;
          popup.querySelector(".popup-box").appendChild(popupActions);
        }

        // ✅ Create comment section if not present
        let commentSection = popup.querySelector(".comment-section");
        if (!commentSection) {
          commentSection = document.createElement("div");
          commentSection.classList.add("comment-section");
          commentSection.innerHTML = `
    <h3>Comments</h3>
    <div class="comment-input-box">
        <textarea id="comment-input" placeholder="Add a comment..."></textarea>
        <button id="post-comment">Post</button>
    </div>
    <div id="comments-list"></div>
  `;
          popup.querySelector(".popup-box").appendChild(commentSection);
        }

        // 🔥 Like/Dislike/Share logic
        const likeBtn = popup.querySelector("#like-btn");
        const dislikeBtn = popup.querySelector("#dislike-btn");
        const shareBtn = popup.querySelector("#share-btn");

        likeBtn.classList.remove("active");
        dislikeBtn.classList.remove("active");

        const movieId = poster.dataset.id;
        const userRef = doc(db, "users", uid);
        const mmovieRef = doc(db, "movies", movieId);

        const likeCountSpan = popup.querySelector("#like-count");
        const dislikeCountSpan = popup.querySelector("#dislike-count");

        const movieDocSnap = await getDoc(mmovieRef);
        const movieData = movieDocSnap.exists() ? movieDocSnap.data() : {};

        likeCountSpan.textContent = (movieData.likedBy || []).length;
        dislikeCountSpan.textContent = (movieData.dislikedBy || []).length;

        const userDocSnap = await getDoc(userRef);
        const userData = userDocSnap.exists() ? userDocSnap.data() : {};
        const likedArray = userData.liked || [];
        const dislikedArray = userData.disliked || [];

        if (likedArray.includes(movieId)) likeBtn.classList.add("active");
        if (dislikedArray.includes(movieId)) dislikeBtn.classList.add("active");

        // 👍 Like
        likeBtn.onclick = async () => {
          const isLiked = likedArray.includes(movieId);
          if (!isLiked) {
            await updateDoc(userRef, {
              liked: arrayUnion(movieId),
              disliked: arrayRemove(movieId)
            });
            await setDoc(mmovieRef, {
              likedBy: arrayUnion(uid),
              dislikedBy: arrayRemove(uid)
            }, { merge: true });

            likeBtn.classList.add("active");
            dislikeBtn.classList.remove("active");
          } else {
            await updateDoc(userRef, { liked: arrayRemove(movieId) });
            await updateDoc(mmovieRef, { likedBy: arrayRemove(uid) });
            likeBtn.classList.remove("active");
          }

          const updatedMovieSnap = await getDoc(mmovieRef);
          const updatedMovieData = updatedMovieSnap.data();
          likeCountSpan.textContent = (updatedMovieData.likedBy || []).length;
          dislikeCountSpan.textContent = (updatedMovieData.dislikedBy || []).length;
        };

        // 👎 Dislike
        dislikeBtn.onclick = async () => {
          const isDisliked = dislikedArray.includes(movieId);
          if (!isDisliked) {
            await updateDoc(userRef, {
              disliked: arrayUnion(movieId),
              liked: arrayRemove(movieId)
            });
            await setDoc(mmovieRef, {
              dislikedBy: arrayUnion(uid),
              likedBy: arrayRemove(uid)
            }, { merge: true });

            dislikeBtn.classList.add("active");
            likeBtn.classList.remove("active");
          } else {
            await updateDoc(userRef, { disliked: arrayRemove(movieId) });
            await updateDoc(mmovieRef, { dislikedBy: arrayRemove(uid) });
            dislikeBtn.classList.remove("active");
          }

          const updatedMovieSnap = await getDoc(mmovieRef);
          const updatedMovieData = updatedMovieSnap.data();
          likeCountSpan.textContent = (updatedMovieData.likedBy || []).length;
          dislikeCountSpan.textContent = (updatedMovieData.dislikedBy || []).length;
        };

        // 📤 Share
        shareBtn.onclick = () => {
          const shareUrl = window.location.href + `#${movieId}`;
          navigator.clipboard.writeText(shareUrl).then(() => {
            alert("Link copied to clipboard!");
          });
        };

        // 💬 Comment logic
        const commentInput = popup.querySelector("#comment-input");
        const postCommentBtn = popup.querySelector("#post-comment");
        const commentsList = popup.querySelector("#comments-list");

        postCommentBtn.onclick = async () => {
          const commentText = commentInput.value.trim();
          if (!commentText) return;

          const commentRef = doc(collection(mmovieRef, "comments"));
          await setDoc(commentRef, {
            username: user.email || user.displayName,
            comment: commentText,
            timestamp: new Date()
          });

          commentInput.value = "";
          loadComments();
        };

        async function loadComments() {
          commentsList.innerHTML = "";
          const commentsQuery = query(collection(mmovieRef, "comments"), orderBy("timestamp", "desc"));
          const commentsSnapshot = await getDocs(commentsQuery);

          if (commentsSnapshot.empty) {
            commentsList.innerHTML = `<p>No comments yet.</p>`;
            return;
          }

          commentsSnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const div = document.createElement("div");
            div.classList.add("comment-card");
            div.innerHTML = `<p>${data.username}</p><h4>${data.comment}</h4><div class="comment-meta">${new Date(data.timestamp?.toDate?.() || data.timestamp).toLocaleString()}</div>`;
            commentsList.appendChild(div);
          });
        }

        loadComments();

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