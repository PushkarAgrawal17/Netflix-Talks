import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    sendPasswordResetEmail,
    signOut,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import {
    getFirestore,
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc,
    updateDoc,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

import { firebaseConfig } from "./config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const usernameInput = document.getElementById("username");
const emailInput = document.getElementById("email");
const editUsernameIcon = document.getElementById("editUsername");
const signOutBtn = document.getElementById("signOutBtn");
const editIcon = document.getElementById("editIcon");
const profileModal = document.getElementById("profileModal");
const mainProfilePic = document.getElementById("mainProfilePic");

if (localStorage.getItem("skipAnimation") === "true") {
    document.body.classList.add("no-animation");
    localStorage.removeItem("skipAnimation");
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        const userRef = doc(db, "users", user.uid);

        // Fetch existing data
        getDoc(userRef).then((docSnap) => {
            const data = docSnap.data();
            usernameInput.value = data.fullName || "Netflix User";
            emailInput.value = data.email || user.email;

            // Set profilePic
            if (data.profilePic) {
                mainProfilePic.src = data.profilePic;
            } else {
                const defaultPic = "Images/profileIcons/1.jpg";
                mainProfilePic.src = defaultPic;
                updateDoc(userRef, { profilePic: defaultPic });
            }
        });

        const ghostToggle = document.getElementById("ghostToggle");

        getDoc(userRef).then((docSnap) => {
            const data = docSnap.data();

            if (data?.anonymity) {
                ghostToggle.checked = true;
            }

            ghostToggle.addEventListener("change", async () => {
                try {
                    await updateDoc(userRef, { anonymity: ghostToggle.checked });

                    Toastify({
                        text: `Ghost Mode ${ghostToggle.checked ? "enabled 👻" : "disabled 😶"
                            }`,
                        duration: 3000,
                        gravity: "bottom",
                        position: "left",
                        backgroundColor: ghostToggle.checked ? "#6e00ff" : "#444",
                    }).showToast();
                } catch (error) {
                    console.error("Failed to update ghost mode:", error);
                    Toastify({
                        text: "Failed to update ghost mode!",
                        duration: 3000,
                        gravity: "bottom",
                        position: "left",
                        backgroundColor: "#ff4d4d",
                    }).showToast();
                }
            });
        });
        // Username edit
        editUsernameIcon.addEventListener("click", () => {
            usernameInput.removeAttribute("readonly");
            usernameInput.focus();

            const originalName = usernameInput.value.trim();  // ✅ Store the current username here

            usernameInput.addEventListener(
                "blur",
                async () => {
                    const newName = usernameInput.value.trim();

                    if (!newName) {
                        Toastify({
                            text: "Username cannot be empty.",
                            duration: 3000,
                            gravity: "bottom",
                            position: "left",
                            backgroundColor: "#ff4d4d",
                        }).showToast();
                        usernameInput.value = originalName; // Optional
                        usernameInput.setAttribute("readonly", true);
                        return;
                    }

                    // 🔍 STEP 1: Check uniqueness before updating
                    const q = query(
                        collection(db, "users"),
                        where("fullName", "==", newName)
                    );

                    const querySnapshot = await getDocs(q);

                    // If username already exists and it's not user's current name
                    if (!querySnapshot.empty && newName !== originalName) {
                        Toastify({
                            text: "Username already taken! Choose another.",
                            duration: 3000,
                            gravity: "bottom",
                            position: "left",
                            backgroundColor: "#ff4d4d",
                        }).showToast();
                        usernameInput.value = originalName;  // Revert
                        usernameInput.setAttribute("readonly", true);
                        return;
                    }

                    // ✅ STEP 2: Update in Firestore (safe)
                    await updateDoc(userRef, { fullName: newName });

                    usernameInput.setAttribute("readonly", true);
                    Toastify({
                        text: "Username updated successfully!",
                        duration: 3000,
                        gravity: "bottom",
                        position: "left",
                        backgroundColor: "#00b09b",
                    }).showToast();
                },
                { once: true }
            );
        });

        // Change Password
        document
            .getElementById("changePasswordBtn")
            .addEventListener("click", async () => {
                try {
                    await sendPasswordResetEmail(auth, user.email);
                    Toastify({
                        text: "Password reset email sent.",
                        duration: 3000,
                        gravity: "bottom",
                        position: "left",
                        backgroundColor: "#00b09b",
                    }).showToast();
                } catch (error) {
                    Toastify({
                        text: "Error: " + error.message,
                        duration: 3000,
                        gravity: "bottom",
                        position: "left",
                        backgroundColor: "#ff4d4d",
                    }).showToast();
                }
            });

        // Sign Out
        signOutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            signOut(auth).then(() => {
                window.location.href = "3sign_In.html";
            });
        });

        // Pic selection + Firestore update
        document.querySelectorAll(".option-pic").forEach((pic) => {
            pic.addEventListener("click", async () => {
                const selectedPic = pic.src.substring(pic.src.indexOf("Images/"));
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
                        text: "Error updating pic: " + err.message,
                        duration: 3000,
                        gravity: "bottom",
                        position: "left",
                        backgroundColor: "#ff4d4d",
                    }).showToast();
                }

                profileModal.style.display = "none";
            });
        });

        // Toggle modal
        editIcon.addEventListener("click", () => {
            profileModal.style.display =
                profileModal.style.display === "block" ? "none" : "block";
        });

        // Hide modal on outside click
        window.addEventListener("click", (e) => {
            if (
                e.target !== profileModal &&
                !profileModal.contains(e.target) &&
                e.target !== editIcon
            ) {
                profileModal.style.display = "none";
            }
        });
    } else {
        window.location.href = "3sign_In.html";
    }
});

// ================= TELL US MORE LOGIC =================

const moreInfoBtn = document.getElementById("moreInfoBtn");
const moreInfoModal = document.getElementById("moreInfoModal");
const modalOverlay = document.getElementById("modalOverlay");
const closeModalBtn = document.getElementById("closeModalBtn");
const saveMoreInfo = document.getElementById("saveMoreInfo");

const fields = {
    pronouns: document.getElementById("pronouns"),
    bio: document.getElementById("bio"),
    intrest: document.getElementById("intrest"),
    hobbies: document.getElementById("hobbies"),
    instagram: document.getElementById("insta"),
    facebook: document.getElementById("facebook"),
    otherLink: document.getElementById("otherLink"),
};

let userRef;
let originalData = {};

function floatifyInput(input) {
    const check = () => {
        if (input.value.trim()) {
            input.classList.add("filled");
        } else {
            input.classList.remove("filled");
        }
    };
    input.addEventListener("input", check);
    check(); // Initial state
}

Object.values(fields).forEach(floatifyInput);

function fillFields(data = {}) {
    Object.entries(fields).forEach(([key, input]) => {
        input.value = data[key] || "";
        input.classList.toggle("filled", !!data[key]);
    });
}

function hasUnsavedChanges() {
    return Object.keys(fields).some(
        (key) => fields[key].value.trim() !== (originalData[key] || "")
    );
}

// Create confirmation popup for unsaved changes
const confirmPopup = document.createElement("div");
confirmPopup.innerHTML = `
  <div style="position:fixed; top:50%; left:50%; transform:translate(-50%,-50%);
              background:#111; color:white; padding:20px; border-radius:10px;
              z-index:1001; text-align:center;">
    <p>You have unsaved changes. Do you want to save them?</p>
    <button id="confirmSaveYes" style="margin:10px; padding:8px 12px; background:#e50914; color:white;">Yes</button>
    <button id="confirmSaveNo" style="margin:10px; padding:8px 12px; background:gray; color:white;">No</button>
  </div>
`;
confirmPopup.style.display = "none";
confirmPopup.style.zIndex = 1001;
document.body.appendChild(confirmPopup);

function openModalWithData(data = {}) {
    Object.keys(fields).forEach((key) => {
        originalData[key] = data[key] || "";
    });

    fillFields(originalData);
    moreInfoModal.style.display = "flex";
    modalOverlay.style.display = "block";
}

function closeModalSafely() {
    if (hasUnsavedChanges()) {
        confirmPopup.style.display = "block";

        document.getElementById("confirmSaveYes").onclick = async () => {
            const updatedData = {};
            Object.entries(fields).forEach(([key, input]) => {
                updatedData[key] = input.value.trim();
            });

            await updateDoc(userRef, updatedData);

            Toastify({
                text: "Changes saved!",
                duration: 3000,
                gravity: "bottom",
                position: "left",
                backgroundColor: "#00b09b",
            }).showToast();
            confirmPopup.style.display = "none";
            moreInfoModal.style.display = "none";
            modalOverlay.style.display = "none";
            localStorage.setItem("skipAnimation", "true");
            location.reload();
        };

        document.getElementById("confirmSaveNo").onclick = () => {
            confirmPopup.style.display = "none";
            moreInfoModal.style.display = "none";
            modalOverlay.style.display = "none";
        };
    } else {
        moreInfoModal.style.display = "none";
        modalOverlay.style.display = "none";
    }
}

// Save button logic
saveMoreInfo.addEventListener("click", async () => {
    const updatedData = {};
    Object.entries(fields).forEach(([key, input]) => {
        updatedData[key] = input.value.trim();
    });

    await updateDoc(userRef, updatedData);

    Toastify({
        text: "Changes saved!",
        duration: 3000,
        gravity: "bottom",
        position: "left",
        backgroundColor: "#00b09b",
    }).showToast();
    localStorage.setItem("skipAnimation", "true");
    location.reload();

    moreInfoModal.style.display = "none";
    modalOverlay.style.display = "none";
    confirmPopup.style.display = "none";
});

// Modal close events
closeModalBtn.addEventListener("click", closeModalSafely);
modalOverlay.addEventListener("click", closeModalSafely);

// Firebase: Get & Show Info
onAuthStateChanged(auth, async (user) => {
    if (!user) return (window.location.href = "3sign_In.html");

    userRef = doc(db, "users", user.uid);

    const docSnap = await getDoc(userRef);
    const data = docSnap.data() || {};

    usernameInput.value = data.fullName || "Netflix User";
    emailInput.value = data.email || user.email;

    moreInfoBtn.addEventListener("click", () => openModalWithData(data));
});
