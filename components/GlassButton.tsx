import { Pressable, View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native'

interface GlassButtonProps {
  title: string
  onPress: () => void
  className?: string
  loading?: boolean
  bgColor?: string
  disabled?: boolean
}

// Common font style helper (matching home page)
const fontStyles = {
  heavy: Platform.select({
    ios: { fontFamily: "System", fontWeight: "900" as const },
    android: { fontFamily: "sans-serif-black", fontWeight: "bold" as const },
    default: { fontFamily: "System", fontWeight: "900" as const },
  }),
};

export default function GlassButton({
  title,
  onPress,
  loading = false,
  className = '',
  bgColor = 'bg-black/30',
  disabled = false
}: GlassButtonProps) {
  const isDisabled = loading || disabled

  // Convert bgColor className to actual color - Updated to match home page theme
  const getBackgroundColor = (bgClass: string) => {
    const colorMap: Record<string, string> = {
      'bg-black/30': 'rgba(0, 0, 0, 0.3)',
      'bg-blue-600/80': '#FF6B00', // Changed to primary orange
      'bg-orange-600/80': '#FF6B00',
      'bg-green-600/80': 'rgba(22, 163, 74, 0.8)',
      'bg-red-600/80': 'rgba(220, 38, 38, 0.8)',
      'bg-purple-600/80': 'rgba(147, 51, 234, 0.8)',
    }
    return colorMap[bgClass] || 'rgba(0, 0, 0, 0.3)'
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.pressable,
        {
          transform: [{ scale: pressed ? 0.97 : 1 }],
          opacity: isDisabled ? 0.6 : pressed ? 0.9 : 1
        }
      ]}
    >
      <View style={[
        styles.button,
        { backgroundColor: getBackgroundColor(bgColor) }
      ]}>
        {loading ? (
          <ActivityIndicator size='small' color='#fff' />
        ) : (
          <Text style={styles.buttonText}>
            {title}
          </Text>
        )}
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  pressable: {
    width: '100%',
    marginTop: 8,
  },
  button: {
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 16,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    ...fontStyles.heavy,
  },
})