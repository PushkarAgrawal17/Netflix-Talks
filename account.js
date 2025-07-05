// ✅ account.js

const editIcon = document.getElementById("editIcon");
const profileModal = document.getElementById("profileModal");
const mainProfilePic = document.getElementById("mainProfilePic");
const uploadInput = document.getElementById("uploadInput");
const signOutBtn = document.getElementById("signOutBtn");
const goBack = document.getElementById("goBack");

// Toggle profile modal
editIcon.addEventListener("click", () => {
  profileModal.style.display =
    profileModal.style.display === "block" ? "none" : "block";
});

// Close modal when clicking outside
window.addEventListener("click", (e) => {
  if (e.target === profileModal) {
    profileModal.style.display = "none";
  }
});

// Change profile image from predefined
const profileOptions = document.querySelectorAll(".option-pic");
profileOptions.forEach((pic) => {
  pic.addEventListener("click", () => {
    mainProfilePic.src = pic.src;
    profileModal.style.display = "none";
  });
});

// Upload custom profile image
uploadInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (event) {
      mainProfilePic.src = event.target.result;
      profileModal.style.display = "none";
    };
    reader.readAsDataURL(file);
  }
});

// Sign out and redirect
signOutBtn.addEventListener("click", () => {
  // In future: firebase.auth().signOut().then(() => ...)
  window.location.href = "1getStarted.html";
});

// Go back to previous page
goBack.addEventListener("click", () => {
  window.history.back();
});

/* Possword revealing */
const passwordField = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");
togglePassword.addEventListener("click", () => {
  const isHidden = passwordField.type === "password";
  passwordField.type = isHidden ? "text" : "password";
  togglePassword.classList.toggle("fa-eye");
  togglePassword.classList.toggle("fa-eye-slash");
});

/*Back botton redirecting last window*/

const backBtn = document.querySelector('.back-btn');

backBtn.addEventListener('click', () => {
  window.history.back();
});
