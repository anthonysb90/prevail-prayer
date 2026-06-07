import "../global.css";
import { useEffect, useRef } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Newsreader_400Regular, Newsreader_500Medium, Newsreader_600SemiBold } from "@expo-google-fonts/newsreader";
import { HankenGrotesk_400Regular, HankenGrotesk_500Medium, HankenGrotesk_600SemiBold, HankenGrotesk_700Bold } from "@expo-google-fonts/hanken-grotesk";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from "expo-notifications";
import { StatusBar } from "expo-status-bar";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { initializePurchases, getSubscriptionStatus } from "@/lib/purchases";
import { useSubscriptionStore } from "@/stores/subscriptionStore";
import { PaywallScreen } from "@/components/ui/PaywallScreen";
import { registerPushToken } from "@/lib/notifications";
import { SupportPromptModal } from "@/components/ui/SupportPromptModal";

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
  const notificationListener = useRef<ReturnType<typeof Notifications.addNotificationReceivedListener> | undefined>(undefined);
  const responseListener = useRef<ReturnType<typeof Notifications.addNotificationResponseReceivedListener> | undefined>(undefined);

  useEffect(() => {
    // Handle foreground notifications
    notificationListener.current = Notifications.addNotificationReceivedListener(() => {
      // Badge or in-app banner could go here
    });

    // Handle notification tap — deep link to notifications inbox
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const screen = response.notification.request.content.data?.screen as string | undefined;
        if (screen) {
          router.push(screen as any);
        } else {
          router.push("/notifications");
        }
      }
    );

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session?.user) {
          await fetchProfile(session.user.id);
          // Initialize RevenueCat
          await initializePurchases(session.user.id);
          const premium = await getSubscriptionStatus();
          setIsPremium(premium);
          // Register push token — saves to Supabase so admin panel can send notifications
          await registerPushToken(session.user.id);
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
        await registerPushToken(session.user.id);
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
  const [fontsLoaded, fontError] = useFonts({
    // New design system — Newsreader (serif) + Hanken Grotesk (UI)
    Newsreader_400Regular,
    Newsreader_500Medium,
    Newsreader_600SemiBold,
    HankenGrotesk_400Regular,
    HankenGrotesk_500Medium,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  // Render once fonts load OR if they error out — never hang on a blank screen
  if (!fontsLoaded && !fontError) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <AuthGuard />
      <PaywallScreen />
      <SupportPromptModal />
    </QueryClientProvider>
  );
}
