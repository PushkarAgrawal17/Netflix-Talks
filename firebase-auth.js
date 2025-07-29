// firebase-auth.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { fetchSignInMethodsForEmail } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { getFirestore, doc, setDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
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

window.register = async function (event) {
    event.preventDefault(); // Stop form submission

    const fullName = document.getElementById("fullName").value.trim();  // Username (must be unique)
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

    try {
        // STEP 1️⃣: Check if username already exists in Firestore
        const q = query(
            collection(db, "users"),
            where("fullName", "==", fullName)
        );

        const querySnapshot = await getDocs(q);
        console.log(querySnapshot);
        if (!querySnapshot.empty) {
            Toastify({
                text: "Username already taken. Try something else.",
                duration: 5000,
                gravity: "bottom",
                position: "left",
                backgroundColor: "#ff4d4d",
            }).showToast();
            return;  // Stop registration
        }

        // STEP 2️⃣: If username is unique, create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // STEP 3️⃣: Save user data in Firestore
        await setDoc(doc(db, "users", user.uid), {
            fullName: fullName,
            email: email,
            createdAt: new Date()
        });

        alert("User registered successfully!");
        window.location.href = `4index.html`;

    } catch (error) {
        Toastify({
            text: `Error: ${error.message}`,
            duration: 5000,
            gravity: "bottom",
            position: "left",
            backgroundColor: "#ff4d4d",
        }).showToast();
    }
}


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

    // Scope to the form that was submitted:
    const form = event.target;
    const emailInput = form.querySelector('input[type="email"]');
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