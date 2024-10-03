import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  uploadBytesResumable,
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-storage.js";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyB1jmMeWclknWulKUJLTu894mY5L3IHexw",
  authDomain: "iskcondeepostava-d89e2.firebaseapp.com",
  projectId: "iskcondeepostava-d89e2",
  storageBucket: "iskcondeepostava-d89e2.appspot.com",
  messagingSenderId: "599506324462",
  appId: "1:599506324462:web:7997c5dde1549d26365cff",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

let userId;

// Handle authentication state
onAuthStateChanged(auth, async (user) => {
  if (user) {
    userId = user.uid;
    await loadImages(); // Load images after user is authenticated
  } else {
    window.location.href = "index.html"; // Redirect if not logged in
  }
});

document.getElementById("dropZone").addEventListener("click", () => {
  document.getElementById("fileInput").click();
});

document.getElementById("dropZone").addEventListener("dragover", (e) => {
  e.preventDefault();
  document.getElementById("dropZone").style.backgroundColor = "#e8f0ff";
});

document.getElementById("dropZone").addEventListener("dragleave", () => {
  document.getElementById("dropZone").style.backgroundColor = "";
});

document.getElementById("dropZone").addEventListener("drop", (e) => {
  e.preventDefault();
  document.getElementById("dropZone").style.backgroundColor = "";
  handleFiles(e.dataTransfer.files);
});

document.getElementById("fileInput").addEventListener("change", (e) => {
  handleFiles(e.target.files);
});

async function handleFiles(files) {
  for (let file of files) {
    if (!file.type.startsWith("image/")) {
      continue;
    }

    // Create a more meaningful filename
    const originalName = file.name.split(".")[0]; // Get original name without extension
    const extension = file.name.split(".").pop(); // Get file extension
    const newFileName = `${originalName}_${Date.now()}.${extension}`; // Append timestamp

    const storageRef = ref(storage, `${userId}/${newFileName}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    // Show the progress container
    const progressContainer = document.getElementById("progressContainer");
    const progressBar = document.getElementById("progressBar");
    const progressText = document.getElementById("progressText");
    progressContainer.style.display = "block";

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        progressBar.style.width = `${progress}%`;
        progressText.innerText = `${Math.floor(progress)}%`; // Update the percentage text

        if (progress < 100) {
          progressBar.style.backgroundColor = "blue"; // Intermediate color
        }
      },
      (error) => {
        document.getElementById("status").innerText =
          "Upload failed: " + error.message;
        progressContainer.style.display = "none"; // Hide progress bar on error
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        document.getElementById("status").innerText = "Upload successful!";
        progressBar.style.backgroundColor = "green"; // Change color to green on completion
        progressText.innerText = "100%"; // Set text to 100%

        const imageObject = { url: downloadURL, name: newFileName }; // Use new filename

        const userDocRef = doc(db, "users", userId);
        await updateDoc(userDocRef, {
          images: arrayUnion(imageObject),
        });

        displayImage(imageObject);
        progressContainer.style.display = "none"; // Hide progress bar after upload
      }
    );
  }
}

async function loadImages() {
  const userDocRef = doc(db, "users", userId);
  const userDoc = await getDoc(userDocRef);

  if (userDoc.exists()) {
    const images = userDoc.data().images || [];
    images.forEach((image) => {
      displayImage(image);
    });
  }
}

function displayImage(image) {
  const imageGrid = document.getElementById("imageGrid");

  const imageContainer = document.createElement("div");
  imageContainer.classList.add("imageContainer");

  const img = document.createElement("img");
  img.src = image.url;
  img.alt = image.name;

  const deleteButton = document.createElement("button");
  deleteButton.innerText = "Delete";
  deleteButton.classList.add("deleteButton");

  deleteButton.addEventListener("click", async () => {
    const storageRef = ref(storage, `${userId}/${image.name}`);
    try {
      await deleteObject(storageRef);

      const userDocRef = doc(db, "users", userId);
      await updateDoc(userDocRef, {
        images: arrayRemove(image),
      });

      imageGrid.removeChild(imageContainer);
    } catch (error) {
      alert("Error deleting image: " + error.message);
    }
  });

  imageContainer.appendChild(img);
  imageContainer.appendChild(deleteButton);
  imageGrid.appendChild(imageContainer);
}
