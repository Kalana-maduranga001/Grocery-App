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
  console.log("=== STARTING REGISTRATION ===");
  console.log("registerUser called with:", { fullName, email });

  // Validation
  if (password.length < 6) {8
    throw new Error("Password must be at least 6 characters");
  }
  if (!email.includes("@")) {
    throw new Error("Invalid email address");
  }
  if (!fullName.trim()) {
    throw new Error("Full name is required");
  }

  try {
    console.log("Step 1: Creating user in Firebase Auth...");
    
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log("Step 2: User created with UID:", user.uid);

    // Update display name
    console.log("Step 3: Updating profile...");
    await updateProfile(user, { displayName: fullName });
    console.log("Step 4: Profile updated successfully");

    // Try to save to Firestore with timeout
    console.log("Step 5: Attempting to save to Firestore...");
    try {
      const savePromise = setDoc(doc(db, "users", user.uid), {
        fullName: fullName.trim(),
        email: email.toLowerCase(),
        createdAt: serverTimestamp(),
      });

      // Add a timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Firestore timeout")), 5000);
      });

      await Promise.race([savePromise, timeoutPromise]);
      console.log("Step 6: Firestore save successful");
    } catch (firestoreError: any) {
      console.warn("Step 6: Firestore save failed (continuing anyway):", firestoreError.message);
      // Continue even if Firestore fails - user is created in Auth
    }

    console.log("Step 7: Signing out user...");
    await signOut(auth);
    console.log("Step 8: Sign out successful");

    console.log("=== REGISTRATION COMPLETED SUCCESSFULLY ===");
    return true;

  } catch (error: any) {
    console.error("=== REGISTRATION FAILED ===");
    console.error("Error details:", error);
    
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