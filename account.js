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

const app = initializeApp({
  apiKey: "AIzaSyAmyFBiAahRlD8j15Am3UclG1-YJOmS5yQ",
  authDomain: "netflix-web-project.firebaseapp.com",
  projectId: "netflix-web-project",
  storageBucket: "netflix-web-project.appspot.com",
  messagingSenderId: "616557096999",
  appId: "1:616557096999:web:027b9189b6f5b283115e02",
});

const auth = getAuth(app);
const db = getFirestore(app);

const usernameInput = document.getElementById("username");
const emailInput = document.getElementById("email");
const moreInfoBtn = document.getElementById("moreInfoBtn");
const moreInfoModal = document.getElementById("moreInfoModal");
const modalOverlay = document.getElementById("modalOverlay");
const closeModalBtn = document.getElementById("closeModalBtn");
const saveMoreInfo = document.getElementById("saveMoreInfo");

let userRef;

onAuthStateChanged(auth, (user) => {
  if (user) {
    userRef = doc(db, "users", user.uid);
    getDoc(userRef).then((docSnap) => {
      const data = docSnap.data();
      usernameInput.value = data.fullName || "Netflix User";
      emailInput.value = data.email || user.email;
    });

    moreInfoBtn.addEventListener("click", () => {
      moreInfoModal.style.display = "block";
      modalOverlay.style.display = "block";
    });

    closeModalBtn.addEventListener("click", closeModal);
    modalOverlay.addEventListener("click", closeModal);

    function closeModal() {
      moreInfoModal.style.display = "none";
      modalOverlay.style.display = "none";
    }

    saveMoreInfo.addEventListener("click", async () => {
      const info = {
        pronouns: document.getElementById("pronouns").value,
        bio: document.getElementById("bio").value,
        instagram: document.getElementById("insta").value,
        facebook: document.getElementById("facebook").value,
        otherLink: document.getElementById("otherLink").value,
      };
      try {
        await updateDoc(userRef, info);
      } catch (e) {
        await setDoc(userRef, info, { merge: true });
      }
      Toastify({
        text: "Info saved!",
        duration: 3000,
        gravity: "bottom",
        position: "left",
        backgroundColor: "#00b09b",
      }).showToast();
      closeModal();
    });
  }
});
