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
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

// Import your Firebase config object
import { firebaseConfig } from "./config.js";

// Initialize Firebase app, Firestore, and Auth
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// === DOM Elements ===
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const messagesContainer = document.getElementById("chat-messages");

// Wait for user authentication state to be ready
onAuthStateChanged(auth, (user) => {
    if (!user) {
        alert("Please sign in to access global chat.");
        window.location.href = "3sign_In.html"; // Redirect to sign-in page if not logged in
        return;
    }

    // Reference to the global chat collection
    const chatRef = collection(db, "global_chat");

    // Query: get last 200 messages ordered newest first
    const chatQuery = query(chatRef, orderBy("timestamp", "desc"), limit(200));

    // Listen in real-time for new messages
    onSnapshot(chatQuery, (snapshot) => {
        // Reverse docs so oldest appear at top, newest at bottom
        const messages = snapshot.docs.reverse();
        displayMessages(messages);
    });

    // Send message on Send button click
    sendButton.addEventListener("click", async () => {
        const message = messageInput.value.trim();
        if (!message) return; // Don't send empty messages

        try {
            await addDoc(chatRef, {
                email: user.email,
                message,
                timestamp: serverTimestamp()
            });
            messageInput.value = ""; // Clear input after sending
        } catch (error) {
            console.error("Error sending message:", error);
        }
    });

    // Send message on Enter key (without Shift)
    messageInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault(); // Prevent newline
            sendButton.click(); // Trigger send button
        }
    });

    // ===== Emoji Picker Setup =====
    const emojiButton = document.getElementById("emoji-button");
    const emojiPicker = document.getElementById("emoji-picker");

    // Toggle emoji picker visibility on emoji button click
    emojiButton.addEventListener("click", () => {
        emojiPicker.style.display = emojiPicker.style.display === "none" ? "block" : "none";
    });

    // Insert selected emoji into message input at cursor position
    emojiPicker.addEventListener("emoji-click", (event) => {
        const emoji = event.detail.unicode;
        const input = messageInput;

        const start = input.selectionStart;
        const end = input.selectionEnd;
        const text = input.value;

        input.value = text.slice(0, start) + emoji + text.slice(end);
        input.selectionStart = input.selectionEnd = start + emoji.length;

        input.focus();

        // Optionally close the emoji picker after selection
        emojiPicker.style.display = "none";
    });

    // Close emoji picker if clicking outside of it or emoji button
    document.addEventListener("click", (event) => {
        if (
            emojiPicker.style.display === "block" &&
            !emojiPicker.contains(event.target) &&
            event.target !== emojiButton
        ) {
            emojiPicker.style.display = "none";
        }
    });
});


// === Function to display chat messages ===
function displayMessages(docs) {
    messagesContainer.innerHTML = ""; // Clear previous messages

    docs.forEach((doc) => {
        const data = doc.data();

        // Convert Firestore timestamp to JS Date and format to locale string
        const time = data.timestamp?.toDate().toLocaleString() || "";

        // Create message container
        const msg = document.createElement("div");
        msg.classList.add("message-box");

        // Message HTML: email + timestamp on top, message below
        msg.innerHTML = `
      <p><strong>${data.email}</strong><span class="time">${time}</span></p>
      <p>${escapeHtml(data.message)}</p>
    `;

        messagesContainer.appendChild(msg);
    });

    // Auto scroll to bottom so latest message is visible
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Optional: Simple escape function to prevent HTML injection in messages
function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}
