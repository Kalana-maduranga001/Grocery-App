import { initializeApp } from "firebase/app"
// @ts-ignore
import { initializeAuth, getReactNativePersistence } from "firebase/auth"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { getFirestore } from "firebase/firestore"


const firebaseConfig = {
  apiKey: "AIzaSyCXY2O9rNoGwGmt2j3OKJq4wVgWYUXKh94",
  authDomain: "amd-groceary-app.firebaseapp.com",
  projectId: "amd-groceary-app",
  storageBucket: "amd-groceary-app.appspot.com",
  messagingSenderId: "399443299214",
  appId: "1:399443299214:web:96f30344b1ba951ff532df",
};

const app = initializeApp(firebaseConfig)

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
})

export const db = getFirestore(app)
