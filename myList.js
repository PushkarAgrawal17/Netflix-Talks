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

import { firebaseConfig } from "./config.js";

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

let pollOptionCount = 2;

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

                console.log(`Clicked poster ID:${poster.dataset.id}`);

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
                    showToast("Item Removed!", "red")
                    await deleteDoc(doc(db, "users", uid, "myList", poster.dataset.id));
                    popup.style.display = "none";
                    document.body.style.overflow = "auto";
                    location.reload();
                };

                // Like/Dislike/Share logic
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

                    // UPDATE COUNTS
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

                    // UPDATE COUNTS
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
                // Example (do this after login/signup is complete):
                let currentUserName = "";

                const userDocSnapComm = await getDoc(doc(db, "users", user.uid));
                if (userDocSnapComm.exists()) {
                    currentUserName = userDocSnapComm.data().fullName;
                }

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
                            username: currentUserName || user.email,
                            isPoll: true,
                            question: commentText.slice(5).trim(),
                            options: pollOptions,
                            votes: Array(pollOptions.length).fill(0),
                            voters: {}, // ADD THIS LINE
                            timestamp: new Date()
                        });
                    } else {
                        await setDoc(commentRef, {
                            username: currentUserName || user.email,
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
                                    // User clicked again on same option → remove vote
                                    votes[selectedIdx] = Math.max(0, votes[selectedIdx] - 1);
                                    delete voters[user.uid];

                                    await updateDoc(commentDocRef, {
                                        votes: votes,
                                        voters: voters
                                    });

                                    showToast("Vote removed!", "#e67e22");
                                } else {
                                    // Change vote (if voted before)
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

                                loadComments(); // refresh UI
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
                                username: currentUserName || user.email,
                                comment: replyText,
                                timestamp: new Date()
                            });

                            showToast("Reply posted!", "gray");

                            const replyContainer = div.querySelector(`#replies-${commentId}`);
                            const toggleBtn = div.querySelector(".toggle-replies-btn");

                            // ✅ Refresh replies
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
        });

        // Close pop up
        document.querySelector(".popup-overlay")?.addEventListener("click", closePopup);
        document.querySelector(".close-btn")?.addEventListener("click", closePopup);

        function resetPollInputs() {
            pollOptionCount = 2; // reset count when popup is closed
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
            const popup = document.getElementById("mylist-popup");
            if (popup) {
                popup.style.display = "none";
                document.body.style.overflow = "auto";
                // Reset comment box
                document.getElementById("comment-input").value = "";

                resetPollInputs();
            }
        }
    });
});