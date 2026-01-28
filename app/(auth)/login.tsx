import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useLoader } from "@/hooks/useLoader";
import { showToast } from "@/utils/notifications";
import { loginUser } from "@/services/authService";
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

        <View style={styles.card}>
          {/* App Title */}
          <Text style={styles.appTitle}>SmartGrocer 🛒</Text>
          
          <Text style={styles.title}>Login</Text>
          
          <Text style={styles.subtitle}>Welcome back! Login to continue</Text>

          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            placeholderTextColor="rgba(255, 228, 204, 0.4)"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />

          <PasswordInput password={password} setPassword={setPassword} placeholder="Password" />

          <GlassButton
            title={isLoading ? "Please wait..." : "Login"}
            onPress={handleLogin}
            loading={isLoading}
            bgColor="bg-blue-600/80"
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity
              onPress={() => router.replace("/(auth)/register")}
              style={styles.registerButton}
            >
              <Text style={styles.registerButtonText}>Register</Text>
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
  registerButton: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: "rgba(255, 140, 66, 0.2)",
  },
  registerButtonText: {
    color: "#FF8C42",
    ...fontStyles.bold,
    fontSize: 15,
    letterSpacing: 0.3,
  },
});