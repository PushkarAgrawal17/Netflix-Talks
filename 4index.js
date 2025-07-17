// ===== Firebase Setup =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    getDocs,
    deleteDoc,
    updateDoc,
    deleteField,
    arrayUnion,
    arrayRemove,
    collection, query, orderBy
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import {
    getAuth,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

// Imports from config.js
import { firebaseConfig } from "./config.js";
import { apiKey } from "./config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

function showToast(message, color = "#00b09b") {
    Toastify({
        text: message,
        duration: 5000,
        gravity: "bottom",
        position: "left",
        backgroundColor: color
    }).showToast();
}

let pollOptionCount = 2;


// -------- Safety check for TMDB API Key --------
if (typeof apiKey === "undefined") {
    alert("API key is missing. Please create config.js with your TMDB API key.");
}

// -------- Hero Slideshow Setup --------
const heroContainer = document.getElementById("hero-slides-container");
const dotsContainer = document.getElementById("slider-dots-container");

let slideElements = [];
let dotElements = [];
let index = 0;
let slideInterval;

function showSlide(i) {
    slideElements.forEach((slide, idx) => {
        slide.classList.remove("active-slide");
        dotElements[idx].classList.remove("active-dot");
    });

    slideElements[i].classList.add("active-slide");
    dotElements[i].classList.add("active-dot");
    index = i;
}

function nextSlide() {
    if (slideElements.length === 0) return;
    index = (index + 1) % slideElements.length;
    showSlide(index);
}

async function addToMyListFirestore(movie) {
    console.log("auth.currentUser:", auth.currentUser);
    const user = auth.currentUser;
    if (!user) {
        showToast("Please sign in to add to your list.", "#FFD700");
        return;
    }

    const uid = user.uid;
    const movieRef = doc(db, "users", uid, "myList", movie.id);
    const docSnap = await getDoc(movieRef);

    if (docSnap.exists()) {
        showToast("Already in My List", "#FFD700");
        return;
    }

    await setDoc(movieRef, {
        id: movie.id,
        title: movie.title,
        bgImg: movie.bgImg,
        bgImgLowRes: movie.bgImgLowRes,
        poster: movie.poster,
        description: movie.description || "No description available",
        tags: movie.tags || "Movie",
        addedAt: new Date()
    });
    showToast("Added to My List!", "green");
}

function loadHeroSlides() {
    const heroEndpoint = `https://api.themoviedb.org/3/trending/movie/day?api_key=${apiKey}&language=en-US&page=1`;

    fetch(heroEndpoint)
        .then((res) => res.json())
        .then((data) => {
            const slides = data.results.slice(0, 10);
            heroContainer.innerHTML = "";
            dotsContainer.innerHTML = "";

            slides.forEach((movie, i) => {
                const bgImg = `https://image.tmdb.org/t/p/original${movie.backdrop_path || movie.poster_path}`;
                const bgImgLowRes = `https://image.tmdb.org/t/p/w500${movie.backdrop_path || movie.poster_path}`;
                const posterImg = `https://image.tmdb.org/t/p/original${movie.poster_path || movie.backdrop_path}`;
                const slide = document.createElement("div");
                slide.classList.add("hero-slide");
                if (i === 0) slide.classList.add("active-slide");
                slide.style.backgroundImage = `url(${bgImg})`;

                slide.innerHTML = `
                <div class="slide-content">
                    <h1 class="slide-title">${movie.title}</h1>
                    <p>${movie.overview}</p>
                    <div class="slide-buttons">
                    <button class="mylist-btn"
                        data-id="${movie.id}"
                        data-title="${movie.title}"
                        data-bg="${bgImg}"
                        data-bg-low="${bgImgLowRes}"
                        data-poster="${posterImg}"
                        data-description="${movie.overview}"
                        data-tags="${movie.release_date?.split('-')[0]}, Rating: ${movie.vote_average}, Popularity: ${Math.round(movie.popularity)}"
                    ><i class="fas fa-plus"></i> My List</button>
                    </div>
                </div>`;

                heroContainer.appendChild(slide);

                const dot = document.createElement("span");
                dot.classList.add("dot");
                if (i === 0) dot.classList.add("active-dot");
                dot.addEventListener("click", () => {
                    clearInterval(slideInterval);
                    showSlide(i);
                    slideInterval = setInterval(nextSlide, 5000);
                });
                dotsContainer.appendChild(dot);
            });

            slideElements = document.querySelectorAll(".hero-slide");
            dotElements = document.querySelectorAll(".dot");
            showSlide(0);

            document.querySelectorAll(".mylist-btn").forEach((btn) => {
                btn.addEventListener("click", () => {
                    console.log("My List button clicked!");
                    const movie = {
                        id: btn.dataset.id,
                        title: btn.dataset.title,
                        bgImg: btn.dataset.bg,
                        bgImgLowRes: btn.dataset.bgLow,
                        poster: btn.dataset.poster,
                        description: btn.dataset.description,
                        tags: btn.dataset.tags
                    };
                    addToMyListFirestore(movie);
                });
            });
        })
        .catch((err) => console.error("Failed to load hero slides", err));
}

loadHeroSlides();
slideInterval = setInterval(nextSlide, 5000);

// -------- Movie Rows --------
const endpoints = {
    trending: `https://api.themoviedb.org/3/trending/movie/week?api_key=${apiKey}`,
    topRated: `https://api.themoviedb.org/3/movie/top_rated?api_key=${apiKey}`,
    blockbuster: `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&sort_by=revenue.desc&region=US`,
    bollywood: `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_original_language=hi&region=IN&sort_by=popularity.desc`,
    koreanTV: `https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}&with_original_language=ko&sort_by=popularity.desc`,
    action: `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_genres=28&sort_by=popularity.desc&language=en-US`,
    horror: `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_genres=27&sort_by=popularity.desc`
};


createGlobalPopup();

fetchAndDisplayMovies(endpoints.trending, "trending");
fetchAndDisplayMovies(endpoints.topRated, "top-rated");
fetchAndDisplayMovies(endpoints.blockbuster, "blockbuster");
fetchAndDisplayMovies(endpoints.bollywood, "bollywood");
fetchAndDisplayMovies(endpoints.koreanTV, "koreanTV");
fetchAndDisplayMovies(endpoints.action, "action");
fetchAndDisplayMovies(endpoints.horror, "horror");

function createGlobalPopup() {
    const popup = document.createElement("div");
    popup.classList.add("popup-css");
    popup.id = "global-popup";
    popup.innerHTML = `
    <div class="popup-overlay"></div>
    <div class="popup-box">
        <span class="close-btn">&times;</span>
        <div class="poster-wrapper">
            <img src="" class="popup-movie-img" alt="Movie Poster" />
            <h1 class="popup-title-img"></h1>
            <div class="popup-gradient-overlay"></div>
        </div>
        <div class="popup-tags"></div>
        <p class="popup-description"></p>
        <div class="popup-actions">
            <button id="popup-mylist-btn" class="popup-mylist-btn"></button>
            <button id="like-btn" class="like-btn"><i class="fas fa-thumbs-up"></i><span id="like-count">0</span></button>
            <button id="dislike-btn" class="dislike-btn"><i class="fas fa-thumbs-down"></i><span id="dislike-count"> 0</span></button>
            <button id="share-btn" class="share-btn"><i class="fas fa-share"></i></button>
        </div>
        <div class="comment-section">
            <h3>Comments</h3>
            <div class="comment-input-box">
                <textarea id="comment-input" placeholder="Add a comment or type 'poll:' to create a poll..."></textarea>

                <!-- Poll UI (initially hidden) -->
                <div id="poll-ui" style="display: none; margin-top: 8px;">
                    <input type="text" class="poll-option" placeholder="Option 1">
                    <input type="text" class="poll-option" placeholder="Option 2">
                    <button id="add-poll-option">+ Add Option</button>
                </div>

                <button id="post-comment">Post</button>
            </div>

            <div id="comments-list"></div>
        </div>
    </div>`;
    document.body.appendChild(popup);
    addGlobalPopupListeners();
}

function fetchAndDisplayMovies(url, containerId) {
    const container = document.getElementById(containerId);

    fetch(url)
        .then((res) => res.json())
        .then((data) => {
            container.innerHTML = "";
            let rank = 1;

            data.results.forEach((movie) => {
                const card = document.createElement("div");
                card.classList.add("poster-card");

                card.innerHTML = `
                ${containerId === "trending" || containerId === "top-rated" ? `<span class="rank">${rank++}</span>` : ""}
                <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}"
                    alt="${movie.title}"
                    class="movie-poster"
                    data-id="${movie.id}"
                    data-title="${movie.title}"
                    data-short-poster="https://image.tmdb.org/t/p/w500${movie.poster_path}"
                    data-poster="https://image.tmdb.org/t/p/w500${movie.backdrop_path || movie.poster_path}"
                    data-highres-poster="https://image.tmdb.org/t/p/original${movie.backdrop_path || movie.poster_path}"
                    data-description="${movie.overview}"
                    data-tags="${movie.release_date?.split('-')[0]}, Rating: ${movie.vote_average}, Popularity: ${Math.round(movie.popularity)}"
                />`;
                container.appendChild(card);
            });

            addPosterListeners(container);
        })
        .catch((err) => {
            console.error("TMDB fetch failed", err);
            container.innerHTML = "<p>Failed to load movies. Please try again later.</p>";
        });
}

export function addPosterListeners(container) {
    const popup = document.getElementById("global-popup");
    const posterTitle = popup.querySelector(".popup-title-img");
    const posterImg = popup.querySelector(".popup-movie-img");
    const descElem = popup.querySelector(".popup-description");
    const tagsWrap = popup.querySelector(".popup-tags");
    const popupBtn = popup.querySelector("#popup-mylist-btn");

    container.querySelectorAll(".movie-poster").forEach((poster) => {
        poster.addEventListener("click", () => {
            const id = poster.dataset.id;
            const title = poster.dataset.title;
            const lowRes = poster.dataset.poster;
            const highRes = poster.dataset.highresPoster;
            const description = poster.dataset.description;
            const tags = poster.dataset.tags;
            const displayPoster = poster.dataset.shortPoster;

            popup.style.display = "flex";
            document.body.style.overflow = "hidden";
            posterTitle.textContent = title;
            posterImg.src = lowRes;
            descElem.textContent = description;

            tagsWrap.innerHTML = "";
            tags.split(",").forEach((tag) => {
                const span = document.createElement("span");
                span.textContent = tag.trim();
                tagsWrap.appendChild(span);
            });

            const movie = {
                id,
                title,
                bgImg: highRes,
                bgImgLowRes: lowRes,
                poster: displayPoster,
                description,
                tags
            };

            onAuthStateChanged(auth, async (user) => {
                if (!user) {
                    popupBtn.innerHTML = `<a href="3sign_In.html"><i class="fas fa-lock"></i> Sign In to Save</a>`;
                    popupBtn.disabled = true;
                    return;
                }

                const uid = user.uid;
                const movieRef = doc(db, "users", uid, "myList", movie.id);
                const docSnap = await getDoc(movieRef);
                const exists = docSnap.exists();

                popupBtn.innerHTML = exists
                    ? `<i class="fas fa-trash-alt"></i> Remove`
                    : `<i class="fas fa-plus"></i> My List`;

                popupBtn.disabled = false;

                popupBtn.onclick = async () => {
                    const uid = user.uid;
                    const movieRef = doc(db, "users", uid, "myList", movie.id);
                    const docSnap = await getDoc(movieRef);
                    const exists = docSnap.exists();
                    if (exists) {
                        await deleteDoc(movieRef);
                        popupBtn.innerHTML = `<i class="fas fa-plus"></i> My List`;
                        showToast("Removed from My List", "red")
                    } else {
                        await setDoc(movieRef, {
                            id,
                            title,
                            bgImg: highRes,
                            bgImgLowRes: lowRes,
                            poster: displayPoster,
                            description,
                            tags,
                            addedAt: new Date()
                        });
                        popupBtn.innerHTML = `<i class="fas fa-check"></i> Added`;
                        showToast("Added to My List!", "green");
                    }
                };

                //LIKE/DISLIKE and SHARE BUTTONS
                const likeBtn = popup.querySelector("#like-btn");
                const dislikeBtn = popup.querySelector("#dislike-btn");
                const shareBtn = popup.querySelector("#share-btn");

                likeBtn.classList.remove("active");
                dislikeBtn.classList.remove("active");


                const movieId = id; // use safe movie ID
                const userRef = doc(db, "users", user.uid);
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

                // LIKE
                likeBtn.onclick = async () => {
                    const userDocSnap = await getDoc(userRef);
                    const userData = userDocSnap.exists() ? userDocSnap.data() : {};
                    const likedArray = userData.liked || [];
                    const dislikedArray = userData.disliked || [];

                    const isLiked = likedArray.includes(movieId);

                    if (!isLiked) {
                        // Add to liked, remove from disliked
                        await updateDoc(userRef, {
                            liked: arrayUnion(movieId),
                            disliked: arrayRemove(movieId)
                        });

                        await setDoc(mmovieRef, {
                            likedBy: arrayUnion(user.uid),
                            dislikedBy: arrayRemove(user.uid)
                        }, { merge: true });

                        likeBtn.classList.add("active");
                        dislikeBtn.classList.remove("active");
                        showToast("You liked this movie!", "#1db954");
                    } else {
                        // Remove like
                        await updateDoc(userRef, {
                            liked: arrayRemove(movieId)
                        });

                        await updateDoc(mmovieRef, {
                            likedBy: arrayRemove(user.uid)
                        });

                        likeBtn.classList.remove("active");
                        showToast("Like removed", "gray");
                    }

                    // Clean up if arrays are now empty
                    const updatedUser = (await getDoc(userRef)).data();
                    const cleanUp = {};
                    if (!(updatedUser.liked || []).length) cleanUp.liked = deleteField();
                    if (!(updatedUser.disliked || []).length) cleanUp.disliked = deleteField();
                    if (Object.keys(cleanUp).length) await updateDoc(userRef, cleanUp);

                    // Update counts
                    const updatedMovieSnap = await getDoc(mmovieRef);
                    const updatedMovieData = updatedMovieSnap.exists() ? updatedMovieSnap.data() : {};
                    popup.querySelector("#like-count").textContent = (updatedMovieData.likedBy || []).length;
                    popup.querySelector("#dislike-count").textContent = (updatedMovieData.dislikedBy || []).length;
                };

                // DISLIKE
                dislikeBtn.onclick = async () => {
                    const userDocSnap = await getDoc(userRef);
                    const userData = userDocSnap.exists() ? userDocSnap.data() : {};
                    const likedArray = userData.liked || [];
                    const dislikedArray = userData.disliked || [];

                    const isDisliked = dislikedArray.includes(movieId);

                    if (!isDisliked) {
                        // Add to disliked, remove from liked
                        await updateDoc(userRef, {
                            disliked: arrayUnion(movieId),
                            liked: arrayRemove(movieId)
                        });

                        await setDoc(mmovieRef, {
                            dislikedBy: arrayUnion(user.uid),
                            likedBy: arrayRemove(user.uid)
                        }, { merge: true });

                        dislikeBtn.classList.add("active");
                        likeBtn.classList.remove("active");
                        showToast("You disliked this movie!", "#e74c3c");
                    } else {
                        // Remove dislike
                        await updateDoc(userRef, {
                            disliked: arrayRemove(movieId)
                        });

                        await updateDoc(mmovieRef, {
                            dislikedBy: arrayRemove(user.uid)
                        });

                        dislikeBtn.classList.remove("active");
                        showToast("Dislike removed", "gray");
                    }

                    // Clean up if arrays are now empty
                    const updatedUser = (await getDoc(userRef)).data();
                    const cleanUp = {};
                    if (!(updatedUser.liked || []).length) cleanUp.liked = deleteField();
                    if (!(updatedUser.disliked || []).length) cleanUp.disliked = deleteField();
                    if (Object.keys(cleanUp).length) await updateDoc(userRef, cleanUp);

                    // Update counts
                    const updatedMovieSnap = await getDoc(mmovieRef);
                    const updatedMovieData = updatedMovieSnap.exists() ? updatedMovieSnap.data() : {};
                    popup.querySelector("#like-count").textContent = (updatedMovieData.likedBy || []).length;
                    popup.querySelector("#dislike-count").textContent = (updatedMovieData.dislikedBy || []).length;
                };


                shareBtn.onclick = () => {
                    const shareUrl = window.location.href + `#${movieId}`;
                    navigator.clipboard.writeText(shareUrl).then(() => {
                        showToast("Movie link copied to clipboard!", "#3498db");
                    });
                };

                //Comment Section
                const commentInput = popup.querySelector("#comment-input");
                const postCommentBtn = popup.querySelector("#post-comment");
                const commentsList = popup.querySelector("#comments-list");

                postCommentBtn.onclick = async () => {
                    const commentText = commentInput.value.trim();
                    const isPoll = commentText.toLowerCase().startsWith("poll:");
                    const pollOptions = Array.from(document.querySelectorAll(".poll-option"))
                        .map(opt => opt.value.trim())
                        .filter(opt => opt);

                    if (!commentText) return;

                    const commentRef = doc(collection(mmovieRef, "comments"));

                    if (isPoll && pollOptions.length >= 2) {
                        await setDoc(commentRef, {
                            username: user.email || user.displayName,
                            isPoll: true,
                            question: commentText.slice(5).trim(),
                            options: pollOptions,
                            votes: Array(pollOptions.length).fill(0),
                            voters: {}, // 🆕 ADD THIS LINE
                            timestamp: new Date()
                        });
                    } else {
                        await setDoc(commentRef, {
                            username: user.email || user.displayName,
                            comment: commentText,
                            isPoll: false,
                            timestamp: new Date()
                        });
                    }

                    commentInput.value = "";
                    document.querySelector("#poll-ui").style.display = "none";
                    showToast("Posted!", "#1db954");
                    loadComments();
                };


                async function loadComments() {
                    commentsList.innerHTML = "";
                    const commentsQuery = query(collection(mmovieRef, "comments"), orderBy("timestamp", "desc"));
                    const commentsSnapshot = await getDocs(commentsQuery);
                    if (commentsSnapshot.empty) {
                        commentsList.innerHTML = `<p style="font-size:14px; color:#777; text-align:center; ">No comments yet.</p>`;
                        return;
                    }
                    commentsSnapshot.forEach(async (docSnap) => {
                        const data = docSnap.data();
                        const commentId = docSnap.id;

                        const div = document.createElement("div");
                        div.classList.add("comment-card");
                        div.innerHTML = `
                            <p>${data.username}</p>
                            ${data.isPoll
                                ? `<h4>🗳️ ${data.question}</h4>
                                    <ul class="poll-options">
                                    ${data.options.map((opt, idx) => {
                                    const count = data.votes?.[idx] || 0;
                                    const totalVotes = data.votes?.reduce((a, b) => a + b, 0) || 0;
                                    const percent = totalVotes ? Math.round((count / totalVotes) * 100) : 0;

                                    return `
                                    <li data-idx="${idx}" data-id="${commentId}" class="poll-vote-option">
                                        <div class="poll-label">${opt}</div>
                                        <div class="poll-bar-container">
                                        <div class="poll-bar" style="width: ${percent}%;"></div>
                                        </div>
                                        <div class="poll-meta">${count} votes • ${percent}%</div>
                                    </li>`;
                                }).join("")}
                                    </ul>`
                                : `<h4>${data.comment}</h4>`}

                            <div class="comment-meta">${new Date(data.timestamp?.toDate?.() || data.timestamp).toLocaleString()}</div>
                            <div class="reply-btn" data-id="${commentId}">Reply</div>
                            <div class="reply-box" id="reply-${commentId}" style="display:none;">
                                <textarea placeholder="Write a reply..."></textarea>
                                <button>Post Reply</button>
                            </div>
                            <button class="toggle-replies-btn" data-id="${commentId}">💬 View Replies</button>
                            <div class="replies-container" id="replies-${commentId}" style="display:none;"></div>
                        `;
                        // Fetch reply count for this comment
                        const repliesSnap = await getDocs(collection(mmovieRef, "comments", commentId, "replies"));
                        const replyCount = repliesSnap.size;
                        div.querySelector(".toggle-replies-btn").textContent = `💬 View ${replyCount} repl${replyCount === 1 ? 'y' : 'ies'}`;


                        // Highlight the voted option for this user (if any)
                        if (data.isPoll && data.voters && data.voters[user.uid] !== undefined) {
                            const votedIdx = data.voters[user.uid];
                            const votedOption = div.querySelector(`.poll-vote-option[data-idx="${votedIdx}"]`);
                            if (votedOption) votedOption.classList.add("voted");
                        }

                        commentsList.appendChild(div);

                        div.querySelectorAll(".poll-vote-option").forEach(option => {
                            option.addEventListener("click", async () => {
                                const selectedIdx = parseInt(option.dataset.idx);
                                const commentId = option.dataset.id;
                                const commentDocRef = doc(mmovieRef, "comments", commentId);
                                const docSnap = await getDoc(commentDocRef);
                                if (!docSnap.exists()) return;

                                const data = docSnap.data();
                                const votes = data.votes || Array(data.options.length).fill(0);
                                const voters = data.voters || {};

                                const prevVote = voters[user.uid];

                                if (prevVote === selectedIdx) {
                                    // 🗑️ User clicked again on same option → remove vote
                                    votes[selectedIdx] = Math.max(0, votes[selectedIdx] - 1);
                                    delete voters[user.uid];

                                    await updateDoc(commentDocRef, {
                                        votes: votes,
                                        voters: voters
                                    });

                                    showToast("Vote removed!", "#e67e22");
                                } else {
                                    // 🔁 Change vote (if voted before)
                                    if (prevVote !== undefined) {
                                        votes[prevVote] = Math.max(0, votes[prevVote] - 1);
                                    }

                                    votes[selectedIdx]++;
                                    voters[user.uid] = selectedIdx;

                                    await updateDoc(commentDocRef, {
                                        votes: votes,
                                        voters: voters
                                    });

                                    showToast(prevVote !== undefined ? "Vote changed!" : "Vote recorded!", "#3498db");
                                }

                                loadComments(); // 🔁 refresh UI
                            });
                        });


                        // Reply button toggle
                        div.querySelector(".reply-btn").addEventListener("click", () => {
                            const box = div.querySelector(`#reply-${commentId}`);
                            box.style.display = box.style.display === "none" ? "block" : "none";
                        });

                        // Reply post
                        div.querySelector(`#reply-${commentId} button`).addEventListener("click", async () => {
                            const replyText = div.querySelector(`#reply-${commentId} textarea`).value.trim();
                            if (!replyText) return;
                            const replyRef = doc(collection(doc(mmovieRef, "comments", commentId), "replies"));
                            await setDoc(replyRef, {
                                username: user.email || user.displayName,
                                comment: replyText,
                                timestamp: new Date()
                            });

                            showToast("Reply posted!", "gray");

                            const replyContainer = div.querySelector(`#replies-${commentId}`);
                            const toggleBtn = div.querySelector(".toggle-replies-btn");

                            // Refresh replies
                            await loadReplies(commentId, replyContainer, toggleBtn);
                            replyContainer.style.display = "block";

                            // Reset input
                            div.querySelector(`#reply-${commentId} textarea`).value = "";
                            div.querySelector(`#reply-${commentId}`).style.display = "block";

                        });

                        // Toggle showing replies
                        div.querySelector(".toggle-replies-btn").addEventListener("click", async (e) => {
                            const replyContainer = div.querySelector(`#replies-${commentId}`);
                            const toggleBtn = e.target;

                            if (replyContainer.style.display === "block") {
                                replyContainer.style.display = "none";
                                const count = Array.from(replyContainer.children).filter(child => child.tagName === "DIV").length;
                                toggleBtn.textContent = `💬 View ${count} repl${count === 1 ? 'y' : 'ies'}`;
                            } else {
                                // Call reusable reply loader
                                await loadReplies(commentId, replyContainer, toggleBtn);
                                replyContainer.style.display = "block";
                            }
                        });
                    });
                }
                async function loadReplies(commentId, replyContainer, toggleBtn) {
                    replyContainer.innerHTML = ""; // Clear old replies

                    const repliesSnap = await getDocs(
                        query(
                            collection(mmovieRef, "comments", commentId, "replies"),
                            orderBy("timestamp", "desc")
                        )
                    );

                    if (repliesSnap.empty) {
                        replyContainer.innerHTML = `<p style="font-size:14px;color:#777;">No replies yet.</p>`;
                    } else {
                        repliesSnap.forEach((replyDoc) => {
                            const reply = replyDoc.data();
                            const replyDiv = document.createElement("div");
                            replyDiv.classList.add("reply-card");
                            replyDiv.innerHTML = `
                                <p>${reply.username}</p>
                                <h4>${reply.comment}</h4>
                                <div class="comment-meta">${new Date(reply.timestamp?.toDate?.() || reply.timestamp).toLocaleString()}</div>
                            `;
                            replyContainer.appendChild(replyDiv);
                        });
                    }

                    const count = Array.from(replyContainer.children).filter(child => child.tagName === "DIV").length;
                    toggleBtn.textContent = `💬 Hide ${count} repl${count === 1 ? 'y' : 'ies'}`;
                }
                loadComments();

                commentInput.addEventListener("input", () => {
                    const isPoll = commentInput.value.trim().toLowerCase().startsWith("poll:");
                    document.querySelector("#poll-ui").style.display = isPoll ? "block" : "none";
                });

                document.getElementById("add-poll-option").onclick = () => {
                    pollOptionCount++;

                    const input = document.createElement("input");
                    input.type = "text";
                    input.classList.add("poll-option");
                    input.placeholder = `Option ${pollOptionCount}`;
                    document.getElementById("poll-ui").insertBefore(input, document.getElementById("add-poll-option"));
                };

            });

            const tempImg = new Image();
            tempImg.src = highRes;
            tempImg.onload = () => {
                posterImg.src = highRes;
            };
        });
    });
}


function addGlobalPopupListeners() {
    const popup = document.getElementById("global-popup");
    const closeBtn = popup.querySelector(".close-btn");
    const overlay = popup.querySelector(".popup-overlay");

    function resetPollInputs() {
        pollOptionCount = 2; // 👈 reset count when popup is closed
        const pollUI = document.getElementById("poll-ui");

        // Remove all except first 2
        const allInputs = [...pollUI.querySelectorAll(".poll-option")];
        allInputs.slice(2).forEach(input => input.remove());

        // Reset first two inputs
        allInputs.slice(0, 2).forEach((input, i) => {
            input.value = "";
            input.placeholder = `Option ${i + 1}`;
        });

        pollUI.style.display = "none"; // hide poll UI
    }


    function closePopup() {
        popup.style.display = "none";
        document.body.style.overflow = "auto";

        // Reset comment box
        document.getElementById("comment-input").value = "";

        resetPollInputs();
    }

    closeBtn.addEventListener("click", closePopup);
    overlay.addEventListener("click", closePopup);
}


createGlobalPopup();

Object.entries(endpoints).forEach(([key, url]) =>
    fetchAndDisplayMovies(url, key)
);

// -------- Navbar Dropdown --------
const profileIcon = document.getElementById("profileIcon");
const profileDropdown = document.getElementById("profileDropdown");

profileIcon.addEventListener("click", () => {
    profileDropdown.style.display =
        profileDropdown.style.display === "block" ? "none" : "block";
});

document.addEventListener("click", (e) => {
    if (
        !profileDropdown.contains(e.target) &&
        !profileIcon.contains(e.target)
    ) {
        profileDropdown.style.display = "none";
    }
});

document.querySelectorAll("#profileDropdown li").forEach((item) => {
    item.addEventListener("click", () => {
        profileDropdown.style.display = "none";
    });
});

//sign-out button
const signOutBtn = document.getElementById("signOut");

onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is logged in
        const userRef = doc(db, "users", user.uid);
        getDoc(userRef).then((docSnap) => {
            const profileIcon = document.getElementById("profileIcon");
            if (docSnap.exists()) {
                const data = docSnap.data();
                const profilePicPath = data.profilePic || "Images/profileIcons/1.jpg"; // fallback
                profileIcon.src = profilePicPath;
            } else {
                profileIcon.src = "Images/profileIcons/1.jpg";
            }
        }).catch((error) => {
            console.error("Error fetching profilePic:", error);
            document.getElementById("profileIcon").src = "Images/profileIcons/1.jpg";
        });

        //sign out btn
        signOutBtn.innerHTML = `<i class="fas fa-sign-out-alt"></i> Sign Out`;
        signOutBtn.onclick = () => {
            signOut(auth)
                .then(() => {
                    window.location.replace("3sign_In.html");
                })
                .catch((error) => {
                    console.error("Error during sign out:", error);
                });
        };
    } else {
        // User is not logged in — show "Sign In" instead
        signOutBtn.innerHTML = `<i class="fas fa-sign-in-alt"></i> Sign In`;
        signOutBtn.onclick = () => {
            window.location.replace("3sign_In.html");
        };
    }
});

document.getElementById("accountBtn").addEventListener("click", () => {
    window.location.href = "account.html";
});

document.getElementById("settingsBtn")?.addEventListener("click", () => {
    window.location.href = "settings.html";
});