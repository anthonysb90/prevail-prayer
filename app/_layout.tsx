import { useEffect, useRef } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFonts } from "expo-font";
import { Newsreader_400Regular, Newsreader_500Medium, Newsreader_600SemiBold } from "@expo-google-fonts/newsreader";
import { HankenGrotesk_400Regular, HankenGrotesk_500Medium, HankenGrotesk_600SemiBold, HankenGrotesk_700Bold } from "@expo-google-fonts/hanken-grotesk";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from "expo-notifications";
import { StatusBar } from "expo-status-bar";
import { Appearance, AppState } from "react-native";
import { useThemeStore } from "@/stores/themeStore";
import { useAppLockStore } from "@/stores/appLockStore";
import { LockScreen } from "@/components/ui/LockScreen";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { initializePurchases, getSubscriptionStatus } from "@/lib/purchases";
import { isTrialActive } from "@/lib/trial";
import { useSubscriptionStore } from "@/stores/subscriptionStore";
import { PaywallScreen } from "@/components/ui/PaywallScreen";
import { registerPushToken } from "@/lib/notifications";
import { SupportPromptModal } from "@/components/ui/SupportPromptModal";
import { TrialWelcomeModal } from "@/components/ui/TrialWelcomeModal";
import { PhonePromptModal } from "@/components/ui/PhonePromptModal";
import { BirthdayPromptModal } from "@/components/ui/BirthdayPromptModal";
import { BirthdayNotificationHandler } from "@/components/ui/BirthdayNotificationHandler";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 60 * 24, // keep cached data 24h so reads work offline
      retry: 2,
    },
  },
});

// Persist the query cache to AsyncStorage for offline-first reads.
const asyncPersister = createAsyncStoragePersister({ storage: AsyncStorage });

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

  // Theme: hydrate from storage and follow OS appearance changes
  useEffect(() => {
    useThemeStore.getState().hydrate();
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      useThemeStore.getState().setSystemScheme(colorScheme === "dark" ? "dark" : "light");
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (_event === "PASSWORD_RECOVERY") {
          router.replace("/(auth)/reset");
          setIsLoading(false);
          return;
        }
        if (session?.user) {
          await fetchProfile(session.user.id);
          await useThemeStore.getState().hydrate(useAuthStore.getState().profile?.theme_pref);
          // Initialize RevenueCat
          await initializePurchases(session.user.id);
          const premium = await getSubscriptionStatus();
          setIsPremium(premium || isTrialActive(useAuthStore.getState().profile));
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
        await useThemeStore.getState().hydrate(useAuthStore.getState().profile?.theme_pref);
        await initializePurchases(session.user.id);
        const premium = await getSubscriptionStatus();
        setIsPremium(premium || isTrialActive(useAuthStore.getState().profile));
        await registerPushToken(session.user.id);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === "(auth)";
    const onResetScreen = segments[0] === "(auth)" && segments[1] === "reset";
    if (!session && !inAuthGroup) {
      router.replace("/(auth)/welcome");
    } else if (session && inAuthGroup && !onResetScreen) {
      router.replace("/(tabs)");
    }
  }, [session, isLoading, segments]);

  return <Slot />;
}

function LockGate() {
  const { session } = useAuthStore();
  const { enabled, unlocked, hydrated, hydrate, setUnlocked } = useAppLockStore();

  useEffect(() => { hydrate(); }, []);

  // Re-lock whenever the app goes to the background.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "background" && useAppLockStore.getState().enabled) {
        setUnlocked(false);
      }
    });
    return () => sub.remove();
  }, []);

  if (session && hydrated && enabled && !unlocked) return <LockScreen />;
  return null;
}

function ThemedStatusBar() {
  const isDark = useThemeStore((s) => s.isDark);
  return <StatusBar style={isDark ? "light" : "dark"} />;
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
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister: asyncPersister, maxAge: 1000 * 60 * 60 * 24 }}>
      <ThemedStatusBar />
      <AuthGuard />
      <PaywallScreen />
      <SupportPromptModal />
      <TrialWelcomeModal />
      <PhonePromptModal />
      <BirthdayPromptModal />
      <BirthdayNotificationHandler />
      <LockGate />
    </PersistQueryClientProvider>
  );
}
