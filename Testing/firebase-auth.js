// firebase-auth.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { fetchSignInMethodsForEmail } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import { firebaseConfig } from "./config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export { app };

const auth = getAuth(app);
const db = getFirestore(app);


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
        Toastify({
            text: "Passwords do not match!",
            duration: 5000,
            gravity: "bottom",
            position: "left",
            backgroundColor: "#ff4d4d",
        }).showToast();
        return;
    }

    createUserWithEmailAndPassword(auth, email, password)
        .then(async (userCredential) => {
            const user = userCredential.user;

            // Store fullName in Firestore
            await setDoc(doc(db, "users", user.uid), {
                fullName: fullName,
                email: email,
                createdAt: new Date()
            });

            alert("User registered successfully!");
            window.location.href = `4index.html`;
        })
        .catch((error) => {
            Toastify({
                text: `Error: ${error.message}`,
                duration: 5000,
                gravity: "bottom",
                position: "left",
                backgroundColor: "#ff4d4d",
            }).showToast();
        });
};

// Login function
window.login = function () {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            alert("Login successful!");
            window.location.href = `4index.html`;
        })
        .catch((error) => {
            Toastify({
                text: `Error: ${error.message}`,
                duration: 5000,
                gravity: "bottom",
                position: "left",
                backgroundColor: "#ff4d4d",
            }).showToast();
        });
};

//GET STARTED EMAIL
window.checkEmailAndRedirect = function (event) {
    event.preventDefault();
    const emailInput = document.querySelector('.email-form input[type="email"]');
    const email = emailInput.value.trim();

    if (!email) {
        Toastify({
            text: `Error: ${error.message}`,
            duration: 5000,
            gravity: "bottom",
            position: "left",
            backgroundColor: "#FFFACD",
        }).showToast();
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
            Toastify({
                text: `Error: ${error.message}`,
                duration: 5000,
                gravity: "bottom",
                position: "left",
                backgroundColor: "#ff4d4d",
            }).showToast();
        });
};