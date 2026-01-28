import LoadingScreen from "@/components/LoadingScreen";
import { useAuth } from "@/hooks/useAuth";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";

export default function Index() {
  const { user, loading } = useAuth();
  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    // Force loading screen to show for minimum 10 seconds (enough time for data to load)
    const timer = setTimeout(() => {
      console.log("[INDEX] 10s timer finished");
      setShowLoading(false);
    }, 10000); // 10 seconds

    return () => clearTimeout(timer);
  }, []);

  // Still loading auth or showing splash screen
  if (loading || showLoading) {
    console.log(
      "[INDEX] Showing loading screen - loading:",
      loading,
      "showLoading:",
      showLoading,
    );
    return <LoadingScreen />;
  }

  // Auth resolved and loading done - redirect
  console.log("[INDEX] Redirecting - user exists:", !!user);

  if (user) {
    return <Redirect href="/(dashboard)/home" />;
  }

  return <Redirect href="/(auth)/login" />;
}
