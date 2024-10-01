import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import {
  getFirestore,
  setDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

// const firebaseConfig = {
//     apiKey: "AIzaSyDno8QgblBD8lgW-UON2Au2EgCaWv8yFek",
//     authDomain: "login-form-3e9d9.firebaseapp.com",
//     projectId: "login-form-3e9d9",
//     storageBucket: "login-form-3e9d9.appspot.com",
//     messagingSenderId: "930056639787",
//     appId: "1:930056639787:web:a0b4e7ba5dc484452ea16e"
// };

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
const db = getFirestore();

function showMessage(message, divId) {
  var messageDiv = document.getElementById(divId);
  messageDiv.style.display = "block";
  messageDiv.innerHTML = message;
  messageDiv.style.opacity = 1;
  setTimeout(function () {
    messageDiv.style.opacity = 0;
  }, 5000);
}

// Sign Up Event Listener
const signUp = document.getElementById("submitSignUp");
signUp.addEventListener("click", (event) => {
  event.preventDefault();
  const email = document.getElementById("rEmail").value;
  const password = document.getElementById("rPassword").value;
  const firstName = document.getElementById("fName").value;
  const lastName = document.getElementById("lName").value;
  const phoneNo = document.getElementById("phoneNo").value;

  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      const userData = {
        email: email,
        firstName: firstName,
        lastName: lastName,
        phoneNo: phoneNo,
        isLoggedIn: true,
      };
      showMessage("Account Created Successfully", "signUpMessage");
      const docRef = doc(db, "users", user.uid);
      setDoc(docRef, userData)
        .then(() => {
          window.location.href = "login.html";
        })
        .catch((error) => {
          console.error("Error writing document: ", error);
        });
    })
    .catch((error) => {
      const errorCode = error.code;
      if (errorCode === "auth/email-already-in-use") {
        showMessage("Email Address Already Exists !!!", "signUpMessage");
      } else {
        showMessage("Unable to Create User", "signUpMessage");
      }
    });
});

// Sign In Event Listener
const signIn = document.getElementById("submitSignIn");
signIn.addEventListener("click", (event) => {
  event.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      showMessage("Login is Successful", "signInMessage");
      const user = userCredential.user;
      localStorage.setItem("loggedInUserId", user.uid);
      window.location.href = "indexs.html";
    })
    .catch((error) => {
      const errorCode = error.code;
      if (errorCode === "auth/invalid-credential") {
        showMessage("Incorrect Email or Password", "signInMessage");
      } else {
        showMessage("Account Does Not Exist", "signInMessage");
      }
    });
});

/* Sign Out Event Listener
const logoutButton = document.getElementById('logout');
logoutButton.addEventListener('click', () => {
    signOut(auth)
        .then(() => {
            localStorage.removeItem('loggedInUserId');
            showMessage('Successfully Logged Out', 'signInMessage');
            window.location.href = 'login.html'; // Redirect to login page or desired location
        })
        .catch((error) => {
            console.error('Error Signing Out: ', error);
        });
});
*/

//Password reset
const ForgotPassLabel = document.getElementById("reset");
let ForgotPassword = () => {
  sendPasswordResetEmail(auth, email.value)
    .then(() => {
      alert("A password Reset Link has been sent to your email");
    })
    .catch((error) => {
      console.log(error.code);
      console.log(error.message);
    });
};
ForgotPassLabel.addEventListener("click", ForgotPassword);
