// firebase-auth.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { fetchSignInMethodsForEmail } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAmyFBiAahRlD8j15Am3UclG1-YJOmS5yQ",
  authDomain: "netflix-web-project.firebaseapp.com",
  projectId: "netflix-web-project",
  storageBucket: "netflix-web-project.firebasestorage.app",
  messagingSenderId: "616557096999",
  appId: "1:616557096999:web:027b9189b6f5b283115e02"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Register function
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("signup-form");
  form.addEventListener("submit", register);
});

window.register = function (event) {
  event.preventDefault(); // prevent form reload

  const fullName = document.getElementById("fullName").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (password !== confirmPassword) {
    alert("Passwords do not match!");
    return;
  }

  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      alert("User registered successfully!");
      console.log("Full Name:", fullName); // You can optionally store this in Firestore later
      // Redirect or reset form if needed
    })
    .catch((error) => {
      alert("Error: " + error.message);
    });
};

// Login function
window.login = function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      alert("Login successful!");
    })
    .catch((error) => {
      alert("Error: " + error.message);
    });
};
 //GET STARTED EMAIL 
 window.checkEmailAndRedirect = function (event) {
  event.preventDefault();
  const emailInput = document.querySelector('.email-form input[type="email"]');
  const email = emailInput.value.trim();

  if (!email) {
    alert("Please enter an email.");
    return;
  }

  fetchSignInMethodsForEmail(auth, email)
    .then((methods) => {
      console.log("Sign-in methods for email:", methods); 
      if (methods.length > 0) {
        // Email exists: redirect to Sign In
        window.location.href = `3sign_In.html?email=${encodeURIComponent(email)}`;
      } else {
        // Email does not exist: redirect to Sign Up
        window.location.href = `2sign_Up.html?email=${encodeURIComponent(email)}`;
      }
    })
    .catch((error) => {
      alert("Error checking email: " + error.message);
    });
};