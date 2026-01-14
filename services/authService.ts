import { auth, db } from "./firebaseConfig"
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  User
} from "firebase/auth"
import { doc, setDoc, updateDoc } from "firebase/firestore"

export const loginUser = async (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password)
}

export const registerUser = async (
  fullName: string,
  email: string,
  password: string
) => {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  )
  await updateProfile(userCredential.user, { displayName: fullName })
  await setDoc(doc(db, "users", userCredential.user.uid), {
    fullName,
    email,
    createdAt: new Date()
  })
  return userCredential.user
}

export const logoutUser = async () => {
  return signOut(auth)
}

export const updateUserProfile = async (user: User, displayName: string) => {
  await updateProfile(user, { displayName })

  const userRef = doc(db, "users", user.uid)
  await updateDoc(userRef, { fullName: displayName })
}