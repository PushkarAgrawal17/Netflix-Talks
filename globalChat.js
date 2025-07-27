// ===== Firebase Setup =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  getDocs,
  deleteDoc,
  serverTimestamp,
  getDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

import { firebaseConfig } from "./config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const messagesContainer = document.getElementById("chat-messages");

// Redirect to sign-in page if not logged in
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("Please sign in to access global chat.");
    window.location.href = "3sign_In.html";
    return;
  }

  let currentUserName = "(unknown user)";
  let anonymity = false;

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const userData = userSnap.data();
    currentUserName = userData.fullName || "(unknown user)";
    anonymity = userData.anonymity === true; // defaults to false
  }

  const chatRef = collection(db, "global_chat");

  // Query: get last 100 messages ordered newest first
  const chatQuery = query(chatRef, orderBy("timestamp", "desc"), limit(100));

  onSnapshot(chatQuery, async (snapshot) => {
    console.log("Snapshot received:", snapshot.docs.length);

    const messages = snapshot.docs.reverse();
    await displayMessages(messages, currentUserName);

    // Auto-delete old messages beyond the last 100
    const oldestVisible = messages[0]?.data()?.timestamp;
    if (oldestVisible) {
      const oldMessagesQuery = query(
        collection(db, "global_chat"),
        orderBy("timestamp"),
        limit(50) // Scan up to 50 old messages
      );

      getDocs(oldMessagesQuery).then((oldSnap) => {
        oldSnap.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.timestamp?.toMillis() < oldestVisible.toMillis()) {
            // Delete message older than the 10th visible one
            deleteDoc(docSnap.ref);
          }
        });
      });
    }
  });

  // Send message on Send button click
  sendButton.addEventListener("click", () => {
    const message = messageInput.value.trim();
    if (!message) return;

    console.log("Sending message:", message);
    try {
      const email = user.email || user.uid || "(unknown)";
      console.log("Sending:", message, "from:", email);

      addDoc(collection(db, "global_chat"), {
        email: user.email,
        username: currentUserName,
        message: message,
        anonymity: anonymity, // ✅ Include this field
        timestamp: serverTimestamp(),
      })
        .then(() => console.log("addDoc success"))
        .catch((e) => console.error("addDoc failed", e));

      console.log("Message sent");
      messageInput.value = ""; // Clear input after sending
    } catch (error) {
      console.error("Error sending message:", error);
    }
  });

  // Send message on Enter key (without Shift)
  messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendButton.click();
    }
  });

  // ===== Emoji Picker Setup =====
  const emojiButton = document.getElementById("emoji-button");
  const emojiPicker = document.getElementById("emoji-picker");

  emojiButton.addEventListener("click", () => {
    emojiPicker.style.display =
      emojiPicker.style.display === "none" ? "block" : "none";
  });

  emojiPicker.addEventListener("emoji-click", (event) => {
    const emoji = event.detail.unicode;
    const input = messageInput;

    const start = input.selectionStart;
    const end = input.selectionEnd;
    const text = input.value;

    input.value = text.slice(0, start) + emoji + text.slice(end);
    input.selectionStart = input.selectionEnd = start + emoji.length;

    input.focus();

    emojiPicker.style.display = "none";
  });

  document.addEventListener("click", (event) => {
    const clickedInsideButton = event.target.closest("#emoji-button");
    const clickedInsidePicker = emojiPicker.contains(event.target);

    if (
      emojiPicker.style.display === "block" &&
      !clickedInsideButton &&
      !clickedInsidePicker
    ) {
      emojiPicker.style.display = "none";
    }
  });
});

async function displayMessages(docs, currentUserName) {
  messagesContainer.innerHTML = "";

  for (const docSnap of docs) {
    const data = docSnap.data();

    const time = data.timestamp?.toDate().toLocaleString() || "";
    const msg = document.createElement("div");
    msg.classList.add("message-box");

    if (data.username === currentUserName) {
      msg.classList.add("self");
    }

    // === Username Span for Interactivity ===
    const usernameSpan = document.createElement("span");
    usernameSpan.classList.add("username");
    usernameSpan.dataset.email = data.email;
    usernameSpan.textContent = data.username || "unknown";

    if (data.anonymity === true) {
      usernameSpan.dataset.anonymous = "true";
    }

    // === Time and Username Row ===
    const emailTime = document.createElement("p");
    emailTime.classList.add("message-meta");
    emailTime.innerHTML = ``;
    emailTime.appendChild(usernameSpan);

    const timeSpan = document.createElement("span");
    timeSpan.classList.add("time");
    timeSpan.textContent = ` ${time}`;
    emailTime.appendChild(timeSpan);

    // === Message Body ===
    const messageContent = document.createElement("p");
    messageContent.textContent = data.message || "[no message]";

    msg.appendChild(emailTime);
    msg.appendChild(messageContent);
    messagesContainer.appendChild(msg);
  }

  // Scroll to bottom
  setTimeout(() => {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }, 100);

  // Attach Events AFTER DOM is filled
  attachUsernameEvents();
}

// function attachUsernameEvents() {
//   const usernames = document.querySelectorAll(".username");
//   const popup = document.getElementById("user-popup");
//   const popupTitle = document.getElementById("popup-fullName");
//   const popupPronouns = document.getElementById("popup-pronouns");
//   const popupBio = document.getElementById("popup-bio");
//   const popupInsta = document.getElementById("popup-instagram");
//   const popupFb = document.getElementById("popup-facebook");
//   const popupOther = document.getElementById("popup-other");
//   const popupInterests = document.getElementById("popup-interests");
//   const popupHobbies = document.getElementById("popup-hobbies");

//   const closeBtn = document.querySelector(".close-btn");

//   usernames.forEach((usernameSpan) => {
//     const email = usernameSpan.dataset.email;
//     const isAnon = usernameSpan.dataset.anonymous === "true";

//     usernameSpan.addEventListener("click", async () => {
//       try {
//         const userQuery = query(collection(db, "users"));
//         const usersSnap = await getDocs(userQuery);

//         let matchedUser = null;
//         usersSnap.forEach((doc) => {
//           const user = doc.data();
//           if (user.email === email) matchedUser = user;
//         });

//         if (!matchedUser) return;

//         const showSocials = isAnon !== true;
        
//         //if user is ghost
//         popupTitle.textContent = matchedUser.fullName || "No name";
//         popupPronouns.textContent = `Pronouns: ${
//           matchedUser.pronouns || "Not specified"
//         }`;
//         popupBio.textContent = `Bio: ${matchedUser.bio || "No bio yet"}`;
//         popupInterests.textContent = `Interests: ${
//           matchedUser.interests || "Not listed"
//         }`;
//         popupHobbies.textContent = `Hobbies: ${
//           matchedUser.hobbies || "Not listed"
//         }`;

//         popupInsta.style.display =
//           showSocials && matchedUser.instagram ? "block" : "none";
//         popupFb.style.display =
//           showSocials && matchedUser.facebook ? "block" : "none";
//         popupOther.style.display =
//           showSocials && matchedUser.other ? "block" : "none";

//         if (matchedUser.instagram) {
//           popupInsta.querySelector(
//             "a"
//           ).href = `https://www.instagram.com/${matchedUser.instagram}`;
//           popupInsta.querySelector(
//             "a"
//           ).textContent = `@${matchedUser.instagram}`;
//         }

//         if (matchedUser.facebook) {
//           popupFb.querySelector(
//             "a"
//           ).href = `https://www.facebook.com/${matchedUser.facebook}`;
//           popupFb.querySelector("a").textContent = `@${matchedUser.facebook}`;
//         }

//         if (matchedUser.other) {
//           popupOther.querySelector("a").href = matchedUser.other;
//           popupOther.querySelector("a").textContent = matchedUser.other;
//         }

//         popup.classList.remove("hidden");
//       } catch (error) {
//         console.error("Error showing user popup:", error);
//       }
//     });

//     // Tooltip (ghost user)
//     if (isAnon) {
//       usernameSpan.setAttribute("title", "Ghost user 👻");
//     }
//   });

//   closeBtn.addEventListener("click", () => {
//     document.getElementById("user-popup").classList.add("hidden");
//   });
// }

function attachUsernameEvents() {
  const usernames = document.querySelectorAll(".username");

  usernames.forEach((usernameSpan) => {
    const email = usernameSpan.dataset.email;

    usernameSpan.addEventListener("mouseenter", async () => {
      try {
        const userDoc = await getUserDataByEmail(email);
        if (!userDoc) return;

        if (userDoc.anonymous) {
          showGhostTooltip(usernameSpan);
        }
      } catch (error) {
        console.error("Error during mouseenter:", error);
      }
    });

    usernameSpan.addEventListener("mouseleave", () => {
      hideGhostTooltip();
    });

    usernameSpan.addEventListener("click", async () => {
      try {
        const userDoc = await getUserDataByEmail(email);
        if (!userDoc) return;

        // Always open popup first, no matter anonymous or not
        openUserPopup(userDoc);
      } catch (error) {
        console.error("Error during click:", error);
      }
    });
  });
}
