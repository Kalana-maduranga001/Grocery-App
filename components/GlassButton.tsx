import { Pressable , View , Text , ActivityIndicator } from "react-native";

interface GlassButtonProps{
    title: string
    onPress: () => void
    loading?: boolean
    bgColor?: string 
}