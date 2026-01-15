import { Alert } from "react-native"
import Toast from "react-native-toast-message"

export const showToast = (
  type: "success" | "error" | "info",
  text1: string,
  text2?: string
) => {
  Toast.show({
    type,
    text1,
    text2,
    position: "top",
    visibilityTime: 3000,
    autoHide: true,
    topOffset: 50
  })
}

export const showConfirmation = (
  title: string,
  message: string,
  onConfirm: () => void
) => {
  Alert.alert(
    title,
    message,
    [
      { text: "Cancel", style: "cancel" },
      { text: "OK", onPress: onConfirm }
    ],
    { cancelable: true }
  )
}
