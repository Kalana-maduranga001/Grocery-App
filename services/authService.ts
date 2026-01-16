import { auth, db } from "./firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut,
  User,
} from "firebase/auth";
import { doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";

// LOGIN
export const loginUser = async (email: string, password: string) => {
  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error: any) {
    console.error("Login error:", error);
    throw new Error(error.message || "Failed to login");
  }
};

// REGISTER
export const registerUser = async (
  fullName: string,
  email: string,
  password: string
) => {
  try {
    console.log("registerUser called with:", { fullName, email });

    // Validation
    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }
    if (!email.includes("@")) {
      throw new Error("Invalid email address");
    }
    if (!fullName.trim()) {
      throw new Error("Full name is required");
    }

    console.log("Creating user in Firebase Auth...");
    
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log("User created:", user.uid);

    // Update display name
    console.log("Updating profile...");
    await updateProfile(user, { displayName: fullName });

    // Save user to Firestore
    console.log("Saving to Firestore...");
    try {
      await setDoc(doc(db, "users", user.uid), {
        fullName: fullName.trim(),
        email: email.toLowerCase(),
        createdAt: serverTimestamp(),
      });
      console.log("Firestore save successful");
    } catch (firestoreError) {
      console.warn("Firestore save failed, but continuing:", firestoreError);
      // Continue even if Firestore fails - user is created in Auth
    }

    console.log("Signing out user...");
    // Sign out after registration so they can login
    await signOut(auth);
    console.log("Sign out successful");

    console.log("Registration completed successfully");
    return true;

  } catch (error: any) {
    console.error("Registration error:", error);
    
    // Handle Firebase-specific errors
    if (error.code === "auth/email-already-in-use") {
      throw new Error("This email is already registered");
    } else if (error.code === "auth/invalid-email") {
      throw new Error("Invalid email address");
    } else if (error.code === "auth/weak-password") {
      throw new Error("Password is too weak");
    } else if (error.code === "auth/network-request-failed") {
      throw new Error("Network error. Please check your connection");
    } else {
      throw new Error(error.message || "Failed to create account");
    }
  }
};

// LOGOUT
export const logoutUser = async () => {
  try {
    return await signOut(auth);
  } catch (error: any) {
    console.error("Logout error:", error);
    throw new Error(error.message || "Failed to logout");
  }
};

// UPDATE PROFILE
export const updateUserProfile = async (user: User, displayName: string) => {
  try {
    await updateProfile(user, { displayName });
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, { fullName: displayName });
  } catch (error: any) {
    console.error("Update profile error:", error);
    throw new Error(error.message || "Failed to update profile");
  }
};