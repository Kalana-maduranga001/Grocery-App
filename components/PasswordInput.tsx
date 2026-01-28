import { useState } from 'react'
import { View, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface PasswordInputProps {
  password: string
  setPassword: (text: string) => void
  placeholder?: string
  editable?: boolean
}

// Common font style helper (matching home page)
const fontStyles = {
  medium: Platform.select({
    ios: { fontFamily: "System", fontWeight: "600" as const },
    android: { fontFamily: "sans-serif-medium" as const },
    default: { fontFamily: "System", fontWeight: "600" as const },
  }),
};

export default function PasswordInput({
  password,
  setPassword,
  placeholder,
  editable = true
}: PasswordInputProps) {
  const [secure, setSecure] = useState(true)

  return (
    <View style={styles.container}>
      <TextInput
        placeholder={placeholder ? placeholder : 'Password'}
        value={password}
        onChangeText={setPassword}
        secureTextEntry={secure}
        placeholderTextColor='rgba(255, 228, 204, 0.4)'
        editable={editable}
        style={[
          styles.input,
          { opacity: editable ? 1 : 0.6 }
        ]}
      />
      <TouchableOpacity
        onPress={() => setSecure(!secure)}
        disabled={!editable}
        style={[
          styles.iconButton,
          { opacity: editable ? 1 : 0.5 }
        ]}
      >
        <Ionicons name={secure ? 'eye-off' : 'eye'} size={24} color='#FFE4CC' />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
    marginBottom: 16,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    padding: 16,
    borderRadius: 16,
    paddingRight: 52,
    color: '#FFFFFF',
    fontSize: 16,
    ...fontStyles.medium,
  },
  iconButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 4,
  },
})