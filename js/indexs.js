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
    await loadReadings(); // Load Readings after the user is authenticated
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

//---------------------------------- for book reading ------------------------------

let readingsArray = []; // Array to hold the readings

async function loadReadings() {
  try {
    const userDocRef = doc(db, "users", userId);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      const readings = docSnap.data().readings || [];
      console.log("Readings loaded:", readings);
      const bookEntriesDiv = document.getElementById("bookEntries");
      bookEntriesDiv.innerHTML = ""; // Clear previous entries

      readings.forEach((entry, index) => {
        createEntry(
          bookEntriesDiv,
          entry.name,
          entry.description,
          entry.timestamp,
          index
        );
        readingsArray.push(entry); // Populate the readingsArray
      });
    } else {
      console.log("No readings found for this user.");
    }
  } catch (error) {
    console.error("Error loading readings:", error);
  }
}

// Function to create or update a book entry
function createEntry(container, name, description, timestamp, index) {
  const entryDiv = document.createElement("div");
  entryDiv.className = "entry";
  entryDiv.id = `entry-${index}`; // Assign a unique ID for each entry
  const formattedDescription = description.replace(/\n/g, "<br>");

  // Set inner HTML with updated or new content
  entryDiv.innerHTML = `
        <strong>${name}</strong>: <br/>
        <span class="short-description">"${formattedDescription.substring(
          0,
          100
        )}..."</span>
        <span class="full-description" style="display:none;">"${formattedDescription}"</span>
        <span class="read-more">Read More</span>
        <button class="edit-btn">Edit</button>
        <button class="delete-btn">Delete</button>
    `;

  // Toggle functionality for Read More
  const readMoreBtn = entryDiv.querySelector(".read-more");
  readMoreBtn.addEventListener("click", function () {
    const fullDescription = entryDiv.querySelector(".full-description");
    const shortDescription = entryDiv.querySelector(".short-description");
    if (fullDescription.style.display === "none") {
      fullDescription.style.display = "block";
      shortDescription.style.display = "none";
      readMoreBtn.textContent = "Read Less";
    } else {
      fullDescription.style.display = "none";
      shortDescription.style.display = "inline";
      readMoreBtn.textContent = "Read More";
    }
  });

  // Edit functionality
  const editBtn = entryDiv.querySelector(".edit-btn");
  editBtn.addEventListener("click", function () {
    const bookNameInput = document.getElementById("bookInput");
    const bookDescriptionInput = document.getElementById("bookDescription");

    bookNameInput.value = name; // Pre-fill the input fields
    bookDescriptionInput.value = description; // Pre-fill the description

    // Set a flag to indicate editing mode
    container.dataset.editing = "true";
    container.dataset.editingIndex = index; // Store the index of the entry being edited
  });

  // Delete functionality
  const deleteBtn = entryDiv.querySelector(".delete-btn");
  deleteBtn.addEventListener("click", async function () {
    if (confirm("Are you sure you want to delete this entry?")) {
      try {
        const userDocRef = doc(db, "users", userId);
        const entryToDelete = readingsArray[index]; // Get the specific entry to delete

        if (entryToDelete) {
          // Ensure entry is defined
          await setDoc(
            userDocRef,
            {
              readings: arrayRemove(entryToDelete), // Remove the specific entry
            },
            { merge: true }
          );

          entryDiv.remove(); // Remove entry from the DOM
          readingsArray.splice(index, 1); // Remove from the array
          alert("Book reading deleted successfully!");
        } else {
          alert("Error: Entry to delete is undefined.");
        }
      } catch (error) {
        alert("Error deleting book reading: " + error.message);
      }
    }
  });

  container.appendChild(entryDiv);
}

// Submit button event
document
  .getElementById("submitBtn")
  .addEventListener("click", async function () {
    const selectedBook = document.getElementById("bookSelect").value;
    const inputBook = document.getElementById("bookInput").value.trim();
    const bookDescription = document
      .getElementById("bookDescription")
      .value.trim();

    let bookName = selectedBook || inputBook;
    const bookInfoDiv = document.getElementById("bookInfo");
    const bookEntriesDiv = document.getElementById("bookEntries");

    const formattedDescription = bookDescription.replace(/\n/g, "<br>");

    if (bookName && bookDescription) {
      bookInfoDiv.innerHTML = `<strong>${bookName}</strong>: <br/> ${formattedDescription}`;

      // Check if we're in editing mode
      if (bookEntriesDiv.dataset.editing === "true") {
        const editingIndex = bookEntriesDiv.dataset.editingIndex; // Get the index of the entry being edited

        // Update the readings array directly
        const oldEntry = readingsArray[editingIndex];

        // Update the entry with the new values
        readingsArray[editingIndex] = {
          name: bookName,
          description: bookDescription,
          timestamp: new Date(),
        };

        // Update Firestore
        try {
          const userDocRef = doc(db, "users", userId);

          // Update Firestore by removing the old entry and adding the updated one
          await setDoc(
            userDocRef,
            {
              readings: arrayRemove(oldEntry), // Remove the old entry
            },
            { merge: true }
          );

          await setDoc(
            userDocRef,
            {
              readings: arrayUnion(readingsArray[editingIndex]), // Add the updated entry
            },
            { merge: true }
          );

          alert("Book reading updated successfully!");

          // Update the entry in the DOM
          const currentEntryDiv = document.getElementById(
            `entry-${editingIndex}`
          );
          currentEntryDiv.remove(); // Remove the old entry from the DOM
          createEntry(
            bookEntriesDiv,
            bookName,
            bookDescription,
            new Date(),
            editingIndex
          ); // Create the updated entry
        } catch (error) {
          alert("Error updating book reading: " + error.message);
        }

        // Reset editing mode
        bookEntriesDiv.dataset.editing = "false";
        delete bookEntriesDiv.dataset.editingIndex;
      } else {
        // Create a new entry
        const entryIndex = readingsArray.length; // Use the length for a new index
        readingsArray.push({
          name: bookName,
          description: bookDescription,
          timestamp: new Date(),
        }); // Add to the array
        createEntry(
          bookEntriesDiv,
          bookName,
          bookDescription,
          new Date(),
          entryIndex
        ); // Create a new entry

        // Save book reading information to Firestore
        try {
          const userDocRef = doc(db, "users", userId);
          await setDoc(
            userDocRef,
            {
              readings: arrayUnion(readingsArray[entryIndex]), // Add the new entry
            },
            { merge: true }
          );
          alert("Book reading saved successfully!");
        } catch (error) {
          alert("Error saving book reading: " + error.message);
        }
      }
    } else {
      bookInfoDiv.innerHTML =
        "Please select a book or enter a book name, and provide some information about it.";
    }
  });

// Reset dropdown when clicking on book input
document.getElementById("bookInput").addEventListener("focus", function () {
  document.getElementById("bookSelect").value = "";
});

// Load readings when the script runs
loadReadings();
