import { AuthProvider } from "@/context/AuthContext";
import { LoaderProvider } from "@/context/LoaderContext";
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import "../global.css";

export default function RootLayout() {
  return (
    <LoaderProvider>
      <AuthProvider>
        <>
          {/* Status bar with light content for dark background */}
          <StatusBar style="light" translucent backgroundColor="transparent" />

          {/* SafeArea with app theme colors */}
          <SafeAreaView
            edges={["top", "left", "right", "bottom"]}
            style={styles.safeArea}
          >
            <Slot />
          </SafeAreaView>

          {/* Toast notifications - Must be outside SafeAreaView */}
          <Toast />
        </>
      </AuthProvider>
    </LoaderProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#3D2417', // Main app brown background
  },
});