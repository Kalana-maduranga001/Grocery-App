import { auth , db } from "./firebaseConfig"
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile,
    signOut,
    User
} from "firebase/auth"
import { doc ,setDoc , updateDoc } from "firebase/firestore"

export const loginUser = async (email: string , password: string) => {
    return signInWithEmailAndPassword(auth , email , password)
}

export const registerUser = async (
    fullName: string,
    email: string,
    password: string
)=>{
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      )

}
