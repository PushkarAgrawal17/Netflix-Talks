// Pixel Hover Script(0.8s)
window.addEventListener("DOMContentLoaded", () => {
    const grid = document.getElementById("pixelGrid");

    const pixelSize = 64;
    const columns = Math.ceil(window.innerWidth / pixelSize);
    const rows = Math.ceil(window.innerHeight / pixelSize);
    const pixelCount = columns * rows;

    for (let i = 0; i < pixelCount; i++) {
        const pixel = document.createElement("div");
        pixel.classList.add("pixel");

        pixel.addEventListener("mouseenter", () => {
            pixel.style.backgroundColor = "red";
            setTimeout(() => {
                pixel.style.backgroundColor = "#0a0a0a";
            }, 800);
        });

        grid.appendChild(pixel);
    }
});

// Forgot Password Script
import { getAuth, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { app } from "./firebase-auth.js";

const auth = getAuth(app);

document.querySelector(".forgot-password").addEventListener("click", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    if (!email) {
        alert("Please enter your email address first!");
        return;
    }

    try {
        await sendPasswordResetEmail(auth, email);
        alert(`Password reset email sent to ${email}`);
    } catch (error) {
        console.error(error);
        alert(`Error: ${error.message}`);
    }
});

// Email Prefill
window.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const email = params.get("email");
    if (email) {
        const emailInput = document.querySelector('input[type="email"]');
        if (emailInput) emailInput.value = email;
    }
});

// Eye button for password
function togglePassword(id, icon) {
    const input = document.getElementById(id);
    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";
    icon.classList.toggle("fa-eye");
    icon.classList.toggle("fa-eye-slash");
}
