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
    doc
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
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        alert("Please sign in to access global chat.");
        window.location.href = "3sign_In.html";
        return;
    }

    let currentUserName = "(unknown user)";

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        currentUserName = userSnap.data().fullName || "(unknown user)";
    }


    const chatRef = collection(db, "global_chat");

    // Query: get last 100 messages ordered newest first
    const chatQuery = query(chatRef, orderBy("timestamp", "desc"), limit(100));

    onSnapshot(chatQuery, async (snapshot) => {
        console.log("Snapshot received:", snapshot.docs.length);

        const messages = snapshot.docs.reverse();
        await displayMessages(messages, currentUserName);

        // 🧹 Auto-delete old messages beyond the last 100
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
                username: currentUserName,   // ✅ Save username
                message: message,
                timestamp: serverTimestamp()
            })
                .then(() => console.log("addDoc success"))
                .catch(e => console.error("addDoc failed", e));

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


function displayMessages(docs, currentUserName) {
    messagesContainer.innerHTML = "";

    docs.forEach((doc) => {
        const data = doc.data();

        const time = data.timestamp?.toDate().toLocaleString() || "";
        const msg = document.createElement("div");
        msg.classList.add("message-box");

        // Add class if the message is from current user
        if (data.username === currentUserName) {
            msg.classList.add("self");
        }

        const emailTime = document.createElement("p");
        emailTime.classList.add("message-meta");
        emailTime.innerHTML = `<strong>${data.username || "unknown"}</strong><span class="time">${time}</span>`;

        const messageContent = document.createElement("p");
        messageContent.textContent = data.message || "[no message]";

        msg.appendChild(emailTime);
        msg.appendChild(messageContent);
        messagesContainer.appendChild(msg);
    });

    setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 100);
}
