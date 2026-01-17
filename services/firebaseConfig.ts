// services/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCXY2O9rNoGwGmt2j3OKJq4wVgWYUXKh94",
  authDomain: "amd-groceary-app.firebaseapp.com",
  projectId: "amd-groceary-app",
  storageBucket: "amd-groceary-app.appspot.com",
  messagingSenderId: "399443299214",
  appId: "1:399443299214:web:96f30344b1ba951ff532df",
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth (default LOCAL persistence)
export const auth = initializeAuth(app);

// Initialize Firestore
export const db = getFirestore(app);
