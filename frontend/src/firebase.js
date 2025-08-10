import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "aquaride-daa69.firebaseapp.com",
  projectId: "aquaride-daa69",
  storageBucket: "aquaride-daa69.appspot.com",
  messagingSenderId: "196750425234",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
