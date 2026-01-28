import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useLoader } from "@/hooks/useLoader";
import Toast from "react-native-toast-message";
import { registerUser } from "@/services/authService";
import GlassButton from "@/components/GlassButton";
import PasswordInput from "@/components/PasswordInput";

// Common font style helper (matching home page)
const fontStyles = {
  heavy: Platform.select({
    ios: { fontFamily: "System", fontWeight: "900" as const },
    android: { fontFamily: "sans-serif-black", fontWeight: "bold" as const },
    default: { fontFamily: "System", fontWeight: "900" as const },
  }),
  bold: Platform.select({
    ios: { fontFamily: "System", fontWeight: "800" as const },
    android: { fontFamily: "sans-serif-black", fontWeight: "bold" as const },
    default: { fontFamily: "System", fontWeight: "800" as const },
  }),
  semibold: Platform.select({
    ios: { fontFamily: "System", fontWeight: "700" as const },
    android: { fontFamily: "sans-serif-medium", fontWeight: "bold" as const },
    default: { fontFamily: "System", fontWeight: "700" as const },
  }),
  medium: Platform.select({
    ios: { fontFamily: "System", fontWeight: "600" as const },
    android: { fontFamily: "sans-serif-medium" as const },
    default: { fontFamily: "System", fontWeight: "600" as const },
  }),
  regular: Platform.select({
    ios: { fontFamily: "System", fontWeight: "500" as const },
    android: { fontFamily: "sans-serif" as const },
    default: { fontFamily: "System", fontWeight: "500" as const },
  }),
};

export default function Register() {
  const router = useRouter();
  const { showLoader, hideLoader, isLoading } = useLoader();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleRegister = async () => {
    console.log("Register button clicked");

    // Validation - Check if all fields are filled
    if (!fullName || !email || !password || !confirmPassword) {
      console.log("Validation failed: Empty fields");
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: "Please fill all fields",
        position: "top",
        visibilityTime: 3000,
      });
      return;
    }

    // Validation - Check if passwords match
    if (password !== confirmPassword) {
      console.log("Validation failed: Passwords don't match");
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: "Passwords do not match",
        position: "top",
        visibilityTime: 3000,
      });
      return;
    }

    console.log("Starting registration...");
    setIsProcessing(true);
    showLoader();
    
    try {
      console.log("Calling registerUser service...");
      await registerUser(fullName, email, password);
      console.log("✅ Registration SUCCESS");
      
      // Show success screen immediately
      setShowSuccess(true);

      // Display success message to user
      Toast.show({
        type: "success",
        text1: "Registration Successful! 🎉",
        text2: "Welcome to SmartGrocer! Redirecting to login...",
        position: "top",
        visibilityTime: 3000,
      });

      // Redirect to login page after 3 seconds
      console.log("Setting timeout for redirect to login...");
      timeoutRef.current = setTimeout(() => {
        console.log("✅ Redirecting to Login page");
        hideLoader();
        router.replace("/(auth)/login");
      }, 3000);

    } catch (err: any) {
      // Registration failed - Show error to user
      console.error("❌ Registration error:", err);
      
      // Reset states to allow user to try again
      setIsProcessing(false);
      setShowSuccess(false);
      hideLoader();
      
      // Display error message
      Toast.show({
        type: "error",
        text1: "Registration Failed",
        text2: err.message || "Unable to create account. Please try again.",
        position: "top",
        visibilityTime: 4000,
      });
    }
  };

  // Success Screen - Display success message before redirect
  if (showSuccess) {
    return (
      <View style={styles.successContainer} pointerEvents="none">
        {/* Background Decorations */}
        <View style={styles.backgroundDecor}>
          <View style={[styles.circle, styles.circleTopLeft1]} />
          <View style={[styles.circle, styles.circleTopLeft2]} />
          <View style={[styles.circle, styles.circleTopRight1]} />
          <View style={[styles.circle, styles.circleBottomLeft1]} />
          <View style={[styles.circle, styles.circleBottomRight1]} />
          <View style={[styles.circle, styles.circleBottomRight2]} />
        </View>

        <View style={styles.successCard}>
          {/* Success Icon */}
          <View style={styles.successIcon}>
            <Text style={styles.successIconText}>✓</Text>
          </View>
          
          {/* Success Title */}
          <Text style={styles.successTitle}>
            Registration Successful!
          </Text>
          
          {/* Welcome Message */}
          <Text style={styles.welcomeMessage}>
            Welcome to SmartGrocer! 🛒
          </Text>
          
          {/* Success Description */}
          <Text style={styles.successDescription}>
            Your account has been created successfully.{"\n"}
            You can now manage your grocery lists and stock inventory.{"\n\n"}
            Redirecting to login page...
          </Text>
          
          {/* Loading Indicator */}
          <ActivityIndicator size="large" color="#FF6B00" />
          
          <Text style={styles.waitText}>
            Please wait a moment...
          </Text>
        </View>
      </View>
    );
  }

  // Check if form should be disabled
  const isFormDisabled = isLoading || isProcessing || showSuccess;

  // Registration Form
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        {/* Background Decorations */}
        <View style={styles.backgroundDecor}>
          <View style={[styles.circle, styles.circleTopLeft1]} />
          <View style={[styles.circle, styles.circleTopLeft2]} />
          <View style={[styles.circle, styles.circleTopRight1]} />
          <View style={[styles.circle, styles.circleBottomLeft1]} />
          <View style={[styles.circle, styles.circleBottomRight1]} />
          <View style={[styles.circle, styles.circleBottomRight2]} />
        </View>

        <View 
          style={styles.card}
          pointerEvents={isFormDisabled ? "none" : "auto"}
        >
          {/* App Title */}
          <Text style={styles.appTitle}>SmartGrocer 🛒</Text>
          
          <Text style={styles.title}>Register</Text>
          
          <Text style={styles.subtitle}>Create your account to get started</Text>

          {/* Full Name Input */}
          <TextInput
            placeholder="Full Name"
            value={fullName}
            onChangeText={setFullName}
            placeholderTextColor="rgba(255, 228, 204, 0.4)"
            autoCapitalize="words"
            editable={!isFormDisabled}
            style={[styles.input, { opacity: isFormDisabled ? 0.5 : 1 }]}
          />

          {/* Email Input */}
          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            placeholderTextColor="rgba(255, 228, 204, 0.4)"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isFormDisabled}
            style={[styles.input, { opacity: isFormDisabled ? 0.5 : 1 }]}
          />

          {/* Password Input */}
          <PasswordInput 
            password={password} 
            setPassword={setPassword} 
            placeholder="Password"
            editable={!isFormDisabled}
          />
          
          {/* Confirm Password Input */}
          <PasswordInput
            password={confirmPassword}
            setPassword={setConfirmPassword}
            placeholder="Confirm Password"
            editable={!isFormDisabled}
          />

          {/* Register Button */}
          <GlassButton
            title={isLoading ? "Creating Account..." : "Register"}
            onPress={handleRegister}
            loading={isLoading}
            bgColor="bg-green-600/80"
            disabled={isFormDisabled}
          />

          {/* Login Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity 
              onPress={() => router.replace("/(auth)/login")}
              disabled={isFormDisabled}
              style={[styles.loginButton, { opacity: isFormDisabled ? 0.5 : 1 }]}
            >
              <Text style={styles.loginButtonText}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#3D2417",
  },
  successContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#3D2417",
    padding: 24,
  },
  backgroundDecor: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  circle: {
    position: "absolute",
    borderRadius: 9999,
    backgroundColor: "rgba(255, 107, 0, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(255, 107, 0, 0.12)",
  },
  circleTopLeft1: {
    top: -60,
    left: -60,
    width: 180,
    height: 180,
  },
  circleTopLeft2: {
    top: 40,
    left: 30,
    width: 100,
    height: 100,
  },
  circleTopRight1: {
    top: -40,
    right: -40,
    width: 150,
    height: 150,
  },
  circleBottomLeft1: {
    bottom: -50,
    left: -50,
    width: 160,
    height: 160,
  },
  circleBottomRight1: {
    bottom: -70,
    right: -70,
    width: 200,
    height: 200,
  },
  circleBottomRight2: {
    bottom: 100,
    right: 50,
    width: 80,
    height: 80,
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.18)",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  appTitle: {
    color: "#FFFFFF",
    fontSize: 32,
    letterSpacing: 0.8,
    ...fontStyles.heavy,
    textShadowColor: "rgba(255, 107, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    textAlign: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    ...fontStyles.bold,
    marginBottom: 8,
    textAlign: "center",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  subtitle: {
    color: "#FFE4CC",
    fontSize: 14,
    letterSpacing: 0.3,
    ...fontStyles.regular,
    opacity: 0.8,
    textAlign: "center",
    marginBottom: 24,
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    color: "#FFFFFF",
    fontSize: 16,
    ...fontStyles.medium,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  footerText: {
    color: "#FFE4CC",
    fontSize: 15,
    ...fontStyles.regular,
  },
  loginButton: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: "rgba(255, 140, 66, 0.2)",
  },
  loginButtonText: {
    color: "#FF8C42",
    ...fontStyles.bold,
    fontSize: 15,
    letterSpacing: 0.3,
  },
  // Success Screen Styles
  successCard: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.18)",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  successIcon: {
    width: 96,
    height: 96,
    backgroundColor: "rgba(76, 175, 80, 0.2)",
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "rgba(76, 175, 80, 0.4)",
  },
  successIconText: {
    fontSize: 48,
    color: "#4CAF50",
    ...fontStyles.bold,
  },
  successTitle: {
    fontSize: 28,
    ...fontStyles.bold,
    marginBottom: 16,
    textAlign: "center",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  welcomeMessage: {
    fontSize: 20,
    ...fontStyles.semibold,
    color: "#4CAF50",
    textAlign: "center",
    marginBottom: 16,
  },
  successDescription: {
    fontSize: 15,
    color: "#FFE4CC",
    textAlign: "center",
    marginBottom: 32,
    paddingHorizontal: 16,
    lineHeight: 22,
    ...fontStyles.regular,
  },
  waitText: {
    fontSize: 14,
    color: "#FFE4CC",
    marginTop: 16,
    opacity: 0.7,
    ...fontStyles.regular,
  },
});