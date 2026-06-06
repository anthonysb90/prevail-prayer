import { useEffect } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { initializePurchases, getSubscriptionStatus } from "@/lib/purchases";
import { useSubscriptionStore } from "@/stores/subscriptionStore";
import { PaywallScreen } from "@/components/ui/PaywallScreen";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5 },
  },
});

function AuthGuard() {
  const { session, isLoading, setSession, fetchProfile } = useAuthStore();
  const { setIsPremium, setIsLoading } = useSubscriptionStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session?.user) {
          await fetchProfile(session.user.id);
          // Initialize RevenueCat with the authenticated user's ID
          await initializePurchases(session.user.id);
          const premium = await getSubscriptionStatus();
          setIsPremium(premium);
          setIsLoading(false);
        } else {
          setIsLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        await fetchProfile(session.user.id);
        await initializePurchases(session.user.id);
        const premium = await getSubscriptionStatus();
        setIsPremium(premium);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === "(auth)";
    if (!session && !inAuthGroup) {
      router.replace("/(auth)/welcome");
    } else if (session && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [session, isLoading, segments]);

  return <Slot />;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "PlayfairDisplay-Bold": require("@/assets/fonts/PlayfairDisplay-Bold.ttf"),
    "PlayfairDisplay-SemiBold": require("@/assets/fonts/PlayfairDisplay-SemiBold.ttf"),
    "DMSans-Regular": require("@/assets/fonts/DMSans-Regular.ttf"),
    "DMSans-Medium": require("@/assets/fonts/DMSans-Medium.ttf"),
    "DMSans-SemiBold": require("@/assets/fonts/DMSans-SemiBold.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <AuthGuard />
      {/* Global paywall modal — accessible from anywhere in the app */}
      <PaywallScreen />
    </QueryClientProvider>
  );
}
