import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Direct Firebase configuration for testing
const firebaseConfig = {
  apiKey: "AIzaSyCPxhZngNx58omkqXVGXx9CmU7monP3944",
  authDomain: "aquaride-daa69.firebaseapp.com",
  projectId: "aquaride-daa69",
  storageBucket: "aquaride-daa69.firebasestorage.app",
  messagingSenderId: "196750425234",
  appId: "1:196750425234:web:62b81f88e0c1914513fa4b",
  measurementId: "G-XRXVVVSE90"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };