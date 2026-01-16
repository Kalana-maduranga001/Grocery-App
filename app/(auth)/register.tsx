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

    // Validation
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
    showLoader();
    
    try {
      console.log("Calling registerUser...");
      await registerUser(fullName, email, password);
      console.log("Registration SUCCESS - Now showing success screen");
      
      // DON'T hide loader yet - keep it showing
      // hideLoader(); // REMOVED THIS
      
      // Show success screen
      setShowSuccess(true);

      // Show toast
      Toast.show({
        type: "success",
        text1: "Registration Successful! 🎉",
        text2: "Redirecting to login...",
        position: "top",
        visibilityTime: 2500,
      });

      // Redirect after 2.5 seconds with cleanup reference
      console.log("Setting timeout for redirect...");
      timeoutRef.current = setTimeout(() => {
        console.log("NOW REDIRECTING TO LOGIN PAGE");
        hideLoader(); // Hide loader just before redirect
        router.replace("/(auth)/login");
      }, 2500);

    } catch (err: any) {
      console.error("Registration error:", err);
      hideLoader();
      
      Toast.show({
        type: "error",
        text1: "Registration Failed",
        text2: err.message || "Something went wrong",
        position: "top",
        visibilityTime: 4000,
      });
    }
  };

  // Success Screen - Blocks all interaction
  if (showSuccess) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 p-6" pointerEvents="none">
        <View className="w-full bg-white/90 rounded-2xl p-8 shadow-lg items-center">
          <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-6">
            <Text className="text-5xl">✓</Text>
          </View>
          
          <Text className="text-3xl font-bold mb-4 text-center text-gray-900">
            Registration Successful!
          </Text>
          
          <Text className="text-lg text-gray-600 text-center mb-8">
            Your account has been created successfully.{"\n"}
            Redirecting to login page...
          </Text>
          
          <ActivityIndicator size="large" color="#10b981" />
          
          <Text className="text-sm text-gray-500 mt-4">
            Please wait...
          </Text>
        </View>
      </View>
    );
  }

  // Registration Form
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View className="flex-1 justify-center items-center bg-gray-50 p-6">
        <View className="w-full bg-white/90 rounded-2xl p-8 shadow-lg">
          <Text className="text-3xl font-bold mb-6 text-center text-gray-900">
            Register
          </Text>

          <TextInput
            placeholder="Full Name"
            value={fullName}
            onChangeText={setFullName}
            placeholderTextColor="#6B7280"
            autoCapitalize="words"
            editable={!isLoading && !showSuccess}
            className="border border-gray-300 p-3 mb-4 rounded-xl bg-white"
          />

          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            placeholderTextColor="#6B7280"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading && !showSuccess}
            className="border border-gray-300 p-3 mb-4 rounded-xl bg-white"
          />

          <PasswordInput 
            password={password} 
            setPassword={setPassword} 
            placeholder="Password"
            editable={!isLoading && !showSuccess}
          />
          
          <PasswordInput
            password={confirmPassword}
            setPassword={setConfirmPassword}
            placeholder="Confirm Password"
            editable={!isLoading && !showSuccess}
          />

          <GlassButton
            title={isLoading ? "Creating Account..." : "Register"}
            onPress={handleRegister}
            loading={isLoading}
            bgColor="bg-green-600/80"
            disabled={isLoading || showSuccess}
          />

          <View className="flex-row justify-center mt-4">
            <Text className="text-gray-700 text-base">Already have an account? </Text>
            <TouchableOpacity 
              onPress={() => router.replace("/(auth)/login")}
              disabled={isLoading || showSuccess}
              style={{ opacity: (isLoading || showSuccess) ? 0.5 : 1 }}
            >
              <Text className="text-blue-600 font-semibold text-base">Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}