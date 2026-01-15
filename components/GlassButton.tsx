import { Pressable, View, Text, ActivityIndicator } from 'react-native'

interface GlassButtonProps {
  title: string
  onPress: () => void
  className?: string
  loading?: boolean
  bgColor?: string
}

export default function GlassButton ({
  title,
  onPress,
  loading = false,
  className = '',
  bgColor = 'bg-black/30'
}: GlassButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => ({
        transform: [{ scale: pressed ? 0.97 : 1 }],
        opacity: pressed ? 0.9 : 1
      })}
      className={className}
    >
      <View className={`rounded-2xl ${bgColor} backdrop-blur-md px-6 py-3 border border-white/20`}>
        {loading ? (
          <ActivityIndicator size='small' color='#fff' />
        ) : (
          <Text className='text-white text-center font-semibold text-lg'>
            {title}
          </Text>
        )}
      </View>
    </Pressable>
  )
}
