import { useEffect, useRef } from "react";
import { ActivityIndicator, Animated, Text, View, StyleSheet, Dimensions } from "react-native";

const { width, height } = Dimensions.get('window');

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
    <View style={styles.container}>
      {/* Gradient layers */}
      <View style={styles.gradientTop} />
      <View style={styles.gradientBottom} />
      
      {/* Decorative circles - Top Left */}
      <View style={[styles.circle, styles.circleTopLeft1]} />
      <View style={[styles.circle, styles.circleTopLeft2]} />
      <View style={[styles.circle, styles.circleTopLeft3]} />
      
      {/* Decorative circles - Top Right */}
      <View style={[styles.circle, styles.circleTopRight1]} />
      <View style={[styles.circle, styles.circleTopRight2]} />
      
      {/* Decorative circles - Bottom Left */}
      <View style={[styles.circle, styles.circleBottomLeft1]} />
      <View style={[styles.circle, styles.circleBottomLeft2]} />
      
      {/* Decorative circles - Bottom Right */}
      <View style={[styles.circle, styles.circleBottomRight1]} />
      <View style={[styles.circle, styles.circleBottomRight2]} />
      <View style={[styles.circle, styles.circleBottomRight3]} />

      <Animated.View
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          }
        ]}
      >
        {/* Glass Card Container */}
        <View style={styles.glassCard}>
          {/* Icon Container with Glass Effect */}
          <View style={styles.iconContainer}>
            <View style={styles.iconGlass}>
              <Text style={styles.iconText}>🛒</Text>
            </View>
          </View>

          {/* App Name */}
          <Text style={styles.appName}>SmartGrocer</Text>
          <Text style={styles.tagline}>
            Your Smart Shopping Assistant
          </Text>

          {/* Loading Spinner in Glass Container */}
          <View style={styles.loadingGlass}>
            <ActivityIndicator size="large" color="#FF6B00" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </View>
      </Animated.View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Powered by SmartGrocer © 2026
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4A2C1A',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.5,
    backgroundColor: '#8B4513',
    opacity: 0.3,
  },
  gradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.5,
    backgroundColor: '#2C1810',
    opacity: 0.4,
  },
  circle: {
    position: 'absolute',
    borderRadius: 9999,
    backgroundColor: 'rgba(255, 107, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.15)',
  },
  // Top Left circles
  circleTopLeft1: {
    top: -80,
    left: -80,
    width: 200,
    height: 200,
  },
  circleTopLeft2: {
    top: -40,
    left: -40,
    width: 120,
    height: 120,
    backgroundColor: 'rgba(255, 107, 0, 0.05)',
  },
  circleTopLeft3: {
    top: 20,
    left: 20,
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255, 107, 0, 0.06)',
  },
  // Top Right circles
  circleTopRight1: {
    top: -60,
    right: -60,
    width: 180,
    height: 180,
  },
  circleTopRight2: {
    top: 40,
    right: 10,
    width: 100,
    height: 100,
    backgroundColor: 'rgba(255, 107, 0, 0.07)',
  },
  // Bottom Left circles
  circleBottomLeft1: {
    bottom: -70,
    left: -70,
    width: 190,
    height: 190,
  },
  circleBottomLeft2: {
    bottom: 50,
    left: 30,
    width: 90,
    height: 90,
    backgroundColor: 'rgba(255, 107, 0, 0.06)',
  },
  // Bottom Right circles
  circleBottomRight1: {
    bottom: -90,
    right: -90,
    width: 220,
    height: 220,
  },
  circleBottomRight2: {
    bottom: -30,
    right: -30,
    width: 140,
    height: 140,
    backgroundColor: 'rgba(255, 107, 0, 0.05)',
  },
  circleBottomRight3: {
    bottom: 80,
    right: 40,
    width: 70,
    height: 70,
    backgroundColor: 'rgba(255, 107, 0, 0.08)',
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    width: width * 0.85,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 30,
    padding: 40,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
  },
  iconContainer: {
    marginBottom: 30,
  },
  iconGlass: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 107, 0, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  iconText: {
    fontSize: 60,
  },
  appName: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: 1.2,
    fontFamily: 'System',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 8,
  },
  tagline: {
    color: '#FFE4CC',
    fontSize: 16,
    marginBottom: 35,
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 0.8,
    fontFamily: 'System',
    opacity: 0.95,
  },
  loadingGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    padding: 25,
    paddingHorizontal: 40,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    marginTop: 10,
  },
  loadingText: {
    color: '#FFE4CC',
    fontSize: 16,
    marginTop: 15,
    fontWeight: '600',
    letterSpacing: 1,
    fontFamily: 'System',
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    zIndex: 10,
  },
  footerText: {
    color: 'rgba(255, 228, 204, 0.7)',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 0.5,
    fontFamily: 'System',
  },
});