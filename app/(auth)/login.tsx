import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useRouter } from "expo-router";
import { useLoader } from "@/hooks/useLoader";
import { showToast } from "@/utils/notifications";
import { loginUser } from "@/services/authService";
import GlassButton from "@/components/GlassButton";
import PasswordInput from "@/components/PasswordInput";

export default function Login() {
  const router = useRouter();
  const { showLoader, hideLoader, isLoading } = useLoader();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      return showToast("error", "Validation Error", "Please fill all fields");
    }

    showLoader();
    try {
      await loginUser(email, password);
      showToast("success", "Login Successful", "Welcome back!");

      setTimeout(() => {
        router.replace("/(dashboard)/home");
      }, 500);
    } catch (err: any) {
      showToast("error", "Login Error", err.message);
    } finally {
      hideLoader();
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={{ flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#f9fafb" }}>
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 16,
            padding: 24,
            shadowColor: "#000",
            shadowOpacity: 0.1,
            shadowRadius: 10,
          }}
        >
          <Text
            style={{
              fontSize: 28,
              fontWeight: "bold",
              marginBottom: 16,
              textAlign: "center",
              color: "#111827",
            }}
          >
            Login
          </Text>

          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            placeholderTextColor="#6B7280"
            keyboardType="email-address"
            autoCapitalize="none"
            style={{
              borderWidth: 1,
              borderColor: "#d1d5db",
              padding: 12,
              borderRadius: 12,
              marginBottom: 12,
              backgroundColor: "#fff",
            }}
          />

          <PasswordInput password={password} setPassword={setPassword} placeholder="Password" />

          <GlassButton
            title={isLoading ? "Please wait..." : "Login"}
            onPress={handleLogin}
            loading={isLoading}
            bgColor="bg-blue-600/80"
          />

          <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 16 }}>
            <Text style={{ color: "#374151", fontSize: 16 }}>Don't have an account? </Text>
            <TouchableOpacity
              onPress={() => router.replace("/(auth)/register")}
              style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: "#e0f2fe" }}
            >
              <Text style={{ color: "#2563eb", fontWeight: "bold", fontSize: 16 }}>Register</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}
