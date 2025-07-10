import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signOut,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAmyFBiAahRlD8j15Am3UclG1-YJOmS5yQ",
  authDomain: "netflix-web-project.firebaseapp.com",
  projectId: "netflix-web-project",
  storageBucket: "netflix-web-project.appspot.com",
  messagingSenderId: "616557096999",
  appId: "1:616557096999:web:027b9189b6f5b283115e02",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const usernameInput = document.getElementById("username");
const emailInput = document.getElementById("email");
const moreInfoBtn = document.getElementById("moreInfoBtn");
const moreInfoModal = document.getElementById("moreInfoModal");
const modalOverlay = document.getElementById("modalOverlay");
const closeModalBtn = document.getElementById("closeModalBtn");
const saveMoreInfo = document.getElementById("saveMoreInfo");

const inputs = {
  pronouns: document.getElementById("pronouns"),
  bio: document.getElementById("bio"),
  instagram: document.getElementById("insta"),
  facebook: document.getElementById("facebook"),
  otherLink: document.getElementById("otherLink")
};

let userRef;

onAuthStateChanged(auth, async (user) => {
  if (!user) return window.location.href = "3sign_In.html";

  userRef = doc(db, "users", user.uid);

  const docSnap = await getDoc(userRef);
  const data = docSnap.data() || {};

  usernameInput.value = data.fullName || "Netflix User";
  emailInput.value = data.email || user.email;

  // Open modal with pre-filled values
  moreInfoBtn.addEventListener("click", () => {
    for (let key in inputs) {
      inputs[key].value = data[key] || "";
    }
    moreInfoModal.style.display = "block";
    modalOverlay.style.display = "block";
  });

  // Close modal logic
  const closeModal = () => {
    moreInfoModal.style.display = "none";
    modalOverlay.style.display = "none";
  };
  closeModalBtn.addEventListener("click", closeModal);
  modalOverlay.addEventListener("click", closeModal);

  // Save changes
  saveMoreInfo.addEventListener("click", async () => {
    const updatedData = {};
    for (let key in inputs) {
      updatedData[key] = inputs[key].value.trim();
    }

    try {
      await updateDoc(userRef, updatedData);
    } catch (err) {
      await setDoc(userRef, updatedData, { merge: true });
    }

    Toastify({
      text: "Info saved!",
      duration: 3000,
      gravity: "bottom",
      position: "left",
      backgroundColor: "#00b09b"
    }).showToast();
    closeModal();
  });
});

// Profile option click logic
document.querySelectorAll(".option-pic").forEach((pic) => {
  pic.addEventListener("click", async () => {
    const selectedPic = pic.getAttribute("src");

    mainProfilePic.src = selectedPic;

    try {
      await updateDoc(userRef, { profilePic: selectedPic });

      Toastify({
        text: "Profile picture updated!",
        duration: 3000,
        gravity: "bottom",
        position: "left",
        backgroundColor: "#00b09b",
      }).showToast();
    } catch (err) {
      Toastify({
        text: "Error updating profile picture!",
        duration: 3000,
        gravity: "bottom",
        position: "left",
        backgroundColor: "#ff4d4d",
      }).showToast();
    }

    profileModal.style.display = "none";
  });
});
