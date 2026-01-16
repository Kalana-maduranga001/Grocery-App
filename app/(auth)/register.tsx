import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
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

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleRegister = async () => {
    console.log("Register button clicked"); // Debug log

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

    console.log("Starting registration..."); // Debug log
    showLoader();
    
    try {
      console.log("Calling registerUser..."); // Debug log
      const result = await registerUser(fullName, email, password);
      console.log("Registration result:", result); // Debug log
      
      hideLoader();

      // Show success toast
      Toast.show({
        type: "success",
        text1: "Registration Successful! 🎉",
        text2: "Redirecting to login...",
        position: "top",
        visibilityTime: 2000,
      });

      // Wait for toast to show, then navigate
      setTimeout(() => {
        console.log("Navigating to login..."); // Debug log
        router.replace("/(auth)/login");
      }, 2000);

    } catch (err: any) {
      console.error("Registration error:", err); // Debug log
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
            className="border border-gray-300 p-3 mb-4 rounded-xl bg-white"
          />

          <PasswordInput 
            password={password} 
            setPassword={setPassword} 
            placeholder="Password" 
          />
          
          <PasswordInput
            password={confirmPassword}
            setPassword={setConfirmPassword}
            placeholder="Confirm Password"
          />

          <GlassButton
            title={isLoading ? "Creating Account..." : "Register"}
            onPress={handleRegister}
            loading={isLoading}
            bgColor="bg-green-600/80"
          />

          <View className="flex-row justify-center mt-4">
            <Text className="text-gray-700 text-base">Already have an account? </Text>
            <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
              <Text className="text-blue-600 font-semibold text-base">Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}