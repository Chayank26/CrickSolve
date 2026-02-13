import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js"
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js"

const firebaseConfig = {
  apiKey: "AIzaSyCMttyi12Yhk0mCEStJRrEn8OwDq5DUJqQ",
  authDomain: "cricksolve.firebaseapp.com",
  projectId: "cricksolve",
  storageBucket: "cricksolve.firebasestorage.app",
  messagingSenderId: "83387760884",
  appId: "1:83387760884:web:b4faf86d6cba6893bd5ea1"
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

window.db = db
