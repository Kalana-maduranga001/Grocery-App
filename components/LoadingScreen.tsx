import { useEffect, useRef } from "react";
import { ActivityIndicator, Animated, Image, Text, View } from "react-native";

export default function LoadingScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Fade in and scale up animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View className="flex-1 bg-gradient-to-b from-green-500 to-green-600 justify-center items-center">
      {/* Gradient background simulation */}
      <View className="absolute inset-0 bg-green-600" />

      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }}
        className="items-center"
      >
        {/* Logo Image */}
        <Image
          source={require("@/assets/logos/loading_screan_image.png")}
          className="w-64 h-64 mb-8"
          resizeMode="contain"
        />

        {/* App Name */}
        <Text className="text-white text-3xl font-bold mb-2">SmartGrocer</Text>
        <Text className="text-green-100 text-base mb-8">
          Your Smart Shopping Assistant
        </Text>

        {/* Loading Spinner */}
        <ActivityIndicator size="large" color="#ffffff" />

        <Text className="text-green-100 text-sm mt-4">Loading...</Text>
      </Animated.View>

      {/* Footer */}
      <View className="absolute bottom-10">
        <Text className="text-green-100 text-xs">
          Powered by SmartGrocer © 2026
        </Text>
      </View>
    </View>
  );
}
