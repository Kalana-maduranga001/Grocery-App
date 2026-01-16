import { Stack } from "expo-router";

export default function DashboardLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="home" />
      <Stack.Screen name="lists" />
      <Stack.Screen name="list-details" />
      <Stack.Screen name="create-list" />
      <Stack.Screen name="stock" />
      <Stack.Screen name="add-stock" />
      <Stack.Screen name="shopping-mode" />
      <Stack.Screen name="notifications" />
    </Stack>
  );
}