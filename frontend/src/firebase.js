import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, disableNetwork, enableNetwork } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCHrL2iDhySpBRfId145kIUPkQrGznHyRk",
  authDomain: "aquaride-daa69.firebaseapp.com",
  projectId: "aquaride-daa69",
  storageBucket: "aquaride-daa69.firebasestorage.app",
  messagingSenderId: "196750425234",
  appId: "1:196750425234:web:c7cb78542498050513fa4b",
  measurementId: "G-TFWD5FS964"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Force enable network to avoid Write channel issues
enableNetwork(db).catch(console.error);

export { auth, db };
