// For profile section

import { getAuth, onAuthStateChanged, updateProfile, sendPasswordResetEmail, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { app } from "./firebaseConfig.js"; // Your initialized Firebase app

const auth = getAuth(app);
const db = getFirestore(app);

const editIcon = document.getElementById("editIcon");
const profileModal = document.getElementById("profileModal");
const mainProfilePic = document.getElementById("mainProfilePic");
const uploadInput = document.getElementById("uploadInput");
const signOutBtn = document.getElementById("signOutBtn");
const goBack = document.querySelector('.back-btn');
const settingsBtn = document.querySelector('.settings-btn');
const usernameInput = document.getElementById("username");
const emailInput = document.getElementById("email");
const changePasswordBtn = document.getElementById("changePassword");
const usernameEdit = document.getElementById("usernameEdit");

// Open and close profile modal
editIcon.addEventListener("click", () => {
  profileModal.style.display =
    profileModal.style.display === "block" ? "none" : "block";
});

window.addEventListener("click", (e) => {
  if (e.target === profileModal) {
    profileModal.style.display = "none";
  }
});

// Set saved profile pic
window.addEventListener("DOMContentLoaded", () => {
  const savedPic = localStorage.getItem("profilePic");
  if (savedPic) {
    mainProfilePic.src = savedPic;
  }
});

// Change profile pic from options
const profileOptions = document.querySelectorAll(".option-pic");
profileOptions.forEach((pic) => {
  pic.addEventListener("click", () => {
    mainProfilePic.src = pic.src;
    localStorage.setItem("profilePic", pic.src);
    profileModal.style.display = "none";
  });
});

// Upload custom pic
uploadInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (event) {
      mainProfilePic.src = event.target.result;
      localStorage.setItem("profilePic", event.target.result);
      profileModal.style.display = "none";
    };
    reader.readAsDataURL(file);
  }
});

// Sign out
signOutBtn.addEventListener("click", () => {
  signOut(auth).then(() => {
    window.location.href = "1getStarted.html";
  });
});

goBack.addEventListener("click", () => {
  window.history.back();
});

settingsBtn?.addEventListener("click", () => {
  window.location.href = "settings.html";
});

// Auth state
onAuthStateChanged(auth, async (user) => {
  if (user) {
    emailInput.value = user.email;
    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      usernameInput.value = data.fullName || "";
    }
  } else {
    window.location.href = "1getStarted.html";
  }
});

// Change password
changePasswordBtn.addEventListener("click", () => {
  const user = auth.currentUser;
  if (user) {
    sendPasswordResetEmail(auth, user.email).then(() => {
      alert("Reset link sent to your email");
    });
  }
});

// Enable username editing
usernameEdit.addEventListener("click", () => {
  usernameInput.disabled = false;
  usernameInput.focus();
});

usernameInput.addEventListener("blur", async () => {
  const user = auth.currentUser;
  if (user) {
    const docRef = doc(db, "users", user.uid);
    await updateDoc(docRef, { fullName: usernameInput.value });
    usernameInput.disabled = true;
  }
});

import { getAuth, onAuthStateChanged, signOut, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// Initialize Firebase Auth and Firestore
auth = getAuth();
db = getFirestore();

// Load user info when page is ready
window.addEventListener('DOMContentLoaded', () => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      // Set email field
      document.getElementById("email").value = user.email;

      // Fetch username from Firestore
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          document.getElementById("username").value = userData.username || "";
        } else {
          console.warn("Username not found.");
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
      }
    } else {
      // Redirect to login if not signed in
      window.location.href = "login.html";
    }
  });
});

// Sign Out
document.getElementById("signOutBtn").addEventListener("click", () => {
  signOut(auth).then(() => {
    window.location.href = "login.html";
  }).catch((error) => {
    console.error("Error signing out:", error);
  });
});

// Change Password
document.getElementById("changePasswordBtn").addEventListener("click", () => {
  const user = auth.currentUser;
  if (user && user.email) {
    sendPasswordResetEmail(auth, user.email)
      .then(() => {
        alert(`Password reset email sent to ${user.email}`);
      })
      .catch((error) => {
        console.error("Password reset error:", error);
        alert("Failed to send reset email.");
      });
  } else {
    alert("User not authenticated.");
  }
});

