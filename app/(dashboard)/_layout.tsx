import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useRef } from "react";
import { Text, TouchableOpacity, View, StyleSheet, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function DashboardLayout() {
  const router = useRouter();
  const segments = useSegments();
  const active = segments[segments.length - 1];
  const insets = useSafeAreaInsets();

  // Animation values for bubbles
  const bubble1 = useRef(new Animated.Value(0)).current;
  const bubble2 = useRef(new Animated.Value(0)).current;
  const bubble3 = useRef(new Animated.Value(0)).current;
  const bubble4 = useRef(new Animated.Value(0)).current;
  const bubble5 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Create floating bubble animations
    const createBubbleAnimation = (animValue: Animated.Value, duration: number, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: 1,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: duration,
            useNativeDriver: true,
          }),
        ])
      );
    };

    // Start all bubble animations with different timings
    Animated.parallel([
      createBubbleAnimation(bubble1, 3000, 0),
      createBubbleAnimation(bubble2, 4000, 500),
      createBubbleAnimation(bubble3, 3500, 1000),
      createBubbleAnimation(bubble4, 4500, 200),
      createBubbleAnimation(bubble5, 3800, 800),
    ]).start();
  }, []);

  const navItems = [
    { label: "Home", route: "/(dashboard)/home", icon: "home" },
    { label: "Lists", route: "/(dashboard)/lists", icon: "list" },
    { label: "Stock", route: "/(dashboard)/stock", icon: "cube" },
    {
      label: "Reminders",
      route: "/(dashboard)/notifications",
      icon: "notifications",
    },
  ] as const;

  return (
    <View style={styles.container}>
      {/* Beautiful animated header with bubbles */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top, height: insets.top + 8 }
        ]}
      >
        {/* Animated Bubbles in Header */}
        <Animated.View style={[
          styles.headerBubble1,
          {
            transform: [{
              translateY: bubble1.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -10]
              })
            }, {
              scale: bubble1.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [1, 1.1, 1]
              })
            }]
          }
        ]} />
        
        <Animated.View style={[
          styles.headerBubble2,
          {
            transform: [{
              translateY: bubble2.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 8]
              })
            }]
          }
        ]} />

        {/* Gradient overlay effect */}
        <View style={styles.headerGradientTop} />
        <View style={styles.headerGradientBottom} />
      </View>

      {/* Screens */}
      <View style={styles.screenContainer}>
        <Stack initialRouteName="home" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="home" />
          <Stack.Screen name="lists" />
          <Stack.Screen name="create-list" />
          <Stack.Screen name="stock" />
          <Stack.Screen name="add-stock" />
          <Stack.Screen name="stock-goods" />
          <Stack.Screen name="notifications" />
          <Stack.Screen name="list-details/[id]" />
        </Stack>
      </View>

      {/* Beautiful bottom navigation bar with animated bubbles */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        {/* Animated Bubbles in Footer */}
        <Animated.View style={[
          styles.footerBubble1,
          {
            transform: [{
              translateX: bubble3.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 15]
              })
            }, {
              scale: bubble3.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [1, 1.15, 1]
              })
            }],
            opacity: bubble3.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0.6, 1, 0.6]
            })
          }
        ]} />
        
        <Animated.View style={[
          styles.footerBubble2,
          {
            transform: [{
              translateY: bubble4.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -12]
              })
            }],
            opacity: bubble4.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0.5, 0.9, 0.5]
            })
          }
        ]} />
        
        <Animated.View style={[
          styles.footerBubble3,
          {
            transform: [{
              translateX: bubble5.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -10]
              })
            }, {
              scale: bubble5.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [1, 1.2, 1]
              })
            }]
          }
        ]} />

        {/* Gradient top border */}
        <View style={styles.footerGradientTop} />
        
        {/* Navigation items */}
        <View style={styles.navContainer}>
          {navItems.map((item, index) => {
            const isActive = active === item.route.split("/").pop();
            return (
              <TouchableOpacity
                key={item.route}
                style={styles.navButton}
                onPress={() =>
                  router.replace({
                    pathname: item.route as (typeof navItems)[number]["route"],
                  })
                }
                activeOpacity={0.7}
              >
                {/* Active top indicator bar */}
                {isActive && <View style={styles.activeTopBar} />}
                
                {/* Icon with glow effect when active */}
                <View style={[
                  styles.iconWrapper,
                  isActive && styles.iconWrapperActive
                ]}>
                  <Ionicons
                    name={`${item.icon}${isActive ? "" : "-outline"}` as any}
                    size={26}
                    color={isActive ? "#FF6B00" : "#B8865F"}
                  />
                </View>
                
                {/* Label with dynamic styling */}
                <Text style={[
                  styles.navLabel,
                  isActive && styles.navLabelActive
                ]}>
                  {item.label}
                </Text>
                
                {/* Active dot indicator */}
                {isActive && <View style={styles.activeDot} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3D2417',
  },
  
  // ============ HEADER STYLES ============
  header: {
    backgroundColor: '#3D2417',
    position: 'relative',
    overflow: 'hidden',
  },
  
  // Header Animated Bubbles
  headerBubble1: {
    position: 'absolute',
    top: -30,
    left: -30,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 107, 0, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.12)',
  },
  headerBubble2: {
    position: 'absolute',
    top: -10,
    right: -20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 107, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.15)',
  },
  
  headerGradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255, 107, 0, 0.03)',
  },
  headerGradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#FF6B00',
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  
  // ============ SCREEN CONTAINER ============
  screenContainer: {
    flex: 1,
  },
  
  // ============ FOOTER STYLES ============
  footer: {
    backgroundColor: '#3D2417',
    paddingTop: 4,
    position: 'relative',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 107, 0, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 20,
    overflow: 'hidden',
  },
  
  // Footer Animated Bubbles
  footerBubble1: {
    position: 'absolute',
    bottom: -40,
    left: -40,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 107, 0, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.12)',
  },
  footerBubble2: {
    position: 'absolute',
    bottom: 10,
    right: 30,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 107, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.15)',
  },
  footerBubble3: {
    position: 'absolute',
    bottom: -20,
    right: -30,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 107, 0, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.1)',
  },
  
  footerGradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#FF6B00',
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  
  // ============ NAVIGATION ITEMS ============
  navContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 4,
    zIndex: 10,
  },
  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    position: 'relative',
    flex: 1,
    minHeight: 62,
  },
  
  // ============ ACTIVE INDICATORS ============
  activeTopBar: {
    position: 'absolute',
    top: -4,
    left: '25%',
    right: '25%',
    height: 3,
    backgroundColor: '#FF6B00',
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FF8C42',
    marginTop: 2,
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.6,
    shadowRadius: 2,
  },
  
  // ============ ICON STYLES ============
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    marginBottom: 2,
  },
  iconWrapperActive: {
    backgroundColor: 'rgba(255, 107, 0, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 107, 0, 0.3)',
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  
  // ============ LABEL STYLES ============
  navLabel: {
    fontSize: 11,
    marginTop: 3,
    color: '#9B7256',
    fontWeight: '600',
    fontFamily: 'System',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  navLabelActive: {
    color: '#FF8C42',
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});