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

import { firebaseConfig } from "./config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const messagesContainer = document.getElementById("chat-messages");

// Redirect to sign-in page if not logged in
onAuthStateChanged(auth, (user) => {
    if (!user) {
        alert("Please sign in to access global chat.");
        window.location.href = "3sign_In.html";
        return;
    }

    const chatRef = collection(db, "global_chat");

    // Query: get last 200 messages ordered newest first
    const chatQuery = query(chatRef, orderBy("timestamp", "desc"), limit(200));

    onSnapshot(chatQuery, (snapshot) => {
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
            e.preventDefault();
            sendButton.click();
        }
    });

    // ===== Emoji Picker Setup =====
    const emojiButton = document.getElementById("emoji-button");
    const emojiPicker = document.getElementById("emoji-picker");

    emojiButton.addEventListener("click", () => {
        emojiPicker.style.display = emojiPicker.style.display === "none" ? "block" : "none";
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
        if (
            emojiPicker.style.display === "block" &&
            !emojiPicker.contains(event.target) &&
            event.target !== emojiButton
        ) {
            emojiPicker.style.display = "none";
        }
    });
});


function displayMessages(docs) {
    messagesContainer.innerHTML = ""; // Clear previous messages

    docs.forEach((doc) => {
        const data = doc.data();

        const time = data.timestamp?.toDate().toLocaleString() || "";

        const msg = document.createElement("div");
        msg.classList.add("message-box");

        msg.innerHTML = `
        <p><strong>${data.email}</strong><span class="time">${time}</span></p>
        <p>${escapeHtml(data.message)}</p>
        `;

        messagesContainer.appendChild(msg);
    });

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}
