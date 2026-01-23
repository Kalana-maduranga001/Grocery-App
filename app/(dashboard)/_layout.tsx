import { Stack } from "expo-router";

export default function DashboardLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="home" />
      <Stack.Screen name="lists" />
      <Stack.Screen name="create-list" />
      <Stack.Screen name="stock" />
      <Stack.Screen name="add-stock" />
      <Stack.Screen name="stock-goods" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="list-details/[id]" />
    </Stack>
  );
}
