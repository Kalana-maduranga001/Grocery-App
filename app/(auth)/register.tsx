import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useLoader } from "@/hooks/useLoader";
import Toast from "react-native-toast-message";
import { registerUser } from "@/services/authService";
import GlassButton from "@/components/GlassButton";
import PasswordInput from "@/components/PasswordInput";

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
      <View className="flex-1 justify-center items-center bg-gray-50 p-6" pointerEvents="none">
        <View className="w-full bg-white/90 rounded-2xl p-8 shadow-lg items-center">
          {/* Success Icon */}
          <View className="w-24 h-24 bg-green-100 rounded-full items-center justify-center mb-6">
            <Text className="text-6xl">✓</Text>
          </View>
          
          {/* Success Title */}
          <Text className="text-3xl font-bold mb-4 text-center text-gray-900">
            Registration Successful!
          </Text>
          
          {/* Welcome Message */}
          <Text className="text-xl font-semibold text-green-600 text-center mb-4">
            Welcome to SmartGrocer! 🛒
          </Text>
          
          {/* Success Description */}
          <Text className="text-lg text-gray-600 text-center mb-8 px-4">
            Your account has been created successfully.{"\n"}
            You can now manage your grocery lists and stock inventory.{"\n\n"}
            Redirecting to login page...
          </Text>
          
          {/* Loading Indicator */}
          <ActivityIndicator size="large" color="#10b981" />
          
          <Text className="text-sm text-gray-500 mt-4">
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
      <View className="flex-1 justify-center items-center bg-gray-50 p-6">
        <View 
          className="w-full bg-white/90 rounded-2xl p-8 shadow-lg"
          pointerEvents={isFormDisabled ? "none" : "auto"}
        >
          {/* App Title */}
          <Text className="text-3xl font-bold mb-2 text-center text-gray-900">
            SmartGrocer
          </Text>
          <Text className="text-base text-gray-600 mb-6 text-center">
            Create your account
          </Text>

          {/* Full Name Input */}
          <TextInput
            placeholder="Full Name"
            value={fullName}
            onChangeText={setFullName}
            placeholderTextColor="#6B7280"
            autoCapitalize="words"
            editable={!isFormDisabled}
            className="border border-gray-300 p-3 mb-4 rounded-xl bg-white"
            style={{ opacity: isFormDisabled ? 0.5 : 1 }}
          />

          {/* Email Input */}
          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            placeholderTextColor="#6B7280"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isFormDisabled}
            className="border border-gray-300 p-3 mb-4 rounded-xl bg-white"
            style={{ opacity: isFormDisabled ? 0.5 : 1 }}
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
          <View className="flex-row justify-center mt-4">
            <Text className="text-gray-700 text-base">Already have an account? </Text>
            <TouchableOpacity 
              onPress={() => router.replace("/(auth)/login")}
              disabled={isFormDisabled}
              style={{ opacity: isFormDisabled ? 0.5 : 1 }}
            >
              <Text className="text-blue-600 font-semibold text-base">Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}