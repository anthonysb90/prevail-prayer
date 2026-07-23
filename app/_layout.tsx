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
import { useAuthDeepLink } from "@/hooks/useAuthDeepLink";
import { initializePurchases, getSubscriptionStatus, onCustomerInfoUpdate } from "@/lib/purchases";
import { isTrialActive, isComped } from "@/lib/trial";
import { useSubscriptionStore } from "@/stores/subscriptionStore";
import { PaywallScreen } from "@/components/ui/PaywallScreen";
import { registerPushToken } from "@/lib/notifications";
import { rescheduleAllReminders } from "@/lib/prayerReminders";
import { SupportPromptModal } from "@/components/ui/SupportPromptModal";
import { TrialWelcomeModal } from "@/components/ui/TrialWelcomeModal";
import { PhonePromptModal } from "@/components/ui/PhonePromptModal";
import { BirthdayPromptModal } from "@/components/ui/BirthdayPromptModal";
import { BirthdayNotificationHandler } from "@/components/ui/BirthdayNotificationHandler";
import { GiftCelebrationModal } from "@/components/ui/GiftCelebrationModal";
import { PrayerMiniPlayer } from "@/components/ui/PrayerMiniPlayer";
import { WhatsNewModal } from "@/components/ui/WhatsNewModal";

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
  // Subscribe to the profile so premium recomputes whenever it loads/changes.
  const profile = useAuthStore((s) => s.profile);
  const { setIsPremium, setIsLoading } = useSubscriptionStore();
  const segments = useSegments();
  const router = useRouter();
  const notificationListener = useRef<ReturnType<typeof Notifications.addNotificationReceivedListener> | undefined>(undefined);
  const responseListener = useRef<ReturnType<typeof Notifications.addNotificationResponseReceivedListener> | undefined>(undefined);
  const rcUnsub = useRef<null | (() => void)>(null);
  // Last known RevenueCat entitlement, so recomputing from the profile never
  // clobbers a real paid subscription.
  const rcPremiumRef = useRef(false);

  // Completes sign-in when the user taps a Supabase confirmation/recovery
  // email that deep-links back into the app via prevailprayer://.
  useAuthDeepLink();

  const recomputePremium = (p = useAuthStore.getState().profile) => {
    setIsPremium(rcPremiumRef.current || isTrialActive(p) || isComped(p));
  };

  // RevenueCat loads customer info a beat after launch; without this listener the
  // app would keep its initial (not-premium) guess until the user left and re-entered.
  const ensurePremiumListener = () => {
    if (rcUnsub.current) return;
    rcUnsub.current = onCustomerInfoUpdate((rc) => {
      rcPremiumRef.current = rc;
      recomputePremium();
    });
  };

  // Recompute premium whenever the profile becomes available or changes. This is
  // what fixes "open the app and it doesn't recognize my trial/Pro": the profile
  // can load (or be refetched) after the initial check, and premium must follow it.
  useEffect(() => {
    recomputePremium(profile);
  }, [profile]);

  useEffect(() => {
    // Handle foreground notifications
    notificationListener.current = Notifications.addNotificationReceivedListener(() => {
      // Badge or in-app banner could go here
    });

    // Handle notification tap — deep link to notifications inbox
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const screen = response.notification.request.content.data?.screen as string | undefined;
        if (screen === "upgrade") {
          // Campaign deep link: open the paywall instead of a route.
          useSubscriptionStore.getState().showPaywall();
        } else if (screen) {
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
    // Single source of truth for session state. onAuthStateChange fires an
    // INITIAL_SESSION event on subscribe carrying the current session, so we no
    // longer need a separate getSession() call doing the same work twice.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        if (event === "PASSWORD_RECOVERY") {
          router.replace("/(auth)/reset");
          setIsLoading(false);
          return;
        }
        if (!session?.user) {
          setIsLoading(false);
          return;
        }
        // Defer the async work outside the callback. Awaiting Supabase calls
        // directly inside onAuthStateChange can deadlock token refresh, so we
        // hop out with setTimeout(0) before touching the network.
        const userId = session.user.id;
        setTimeout(() => {
          void (async () => {
            try {
              // Independent work runs in parallel instead of serially.
              await Promise.all([
                fetchProfile(userId),
                initializePurchases(userId),
              ]);
              await useThemeStore.getState().hydrate(useAuthStore.getState().profile?.theme_pref);
              rcPremiumRef.current = await getSubscriptionStatus();
              recomputePremium();
              ensurePremiumListener();
              // Fire-and-forget — never block readiness on push or reminders.
              void registerPushToken(userId);
              if (event === "INITIAL_SESSION") rescheduleAllReminders(userId);
            } finally {
              setIsLoading(false);
            }
          })();
        }, 0);
      }
    );

    return () => {
      subscription.unsubscribe();
      rcUnsub.current?.();
      rcUnsub.current = null;
    };
  }, []);

  // Re-sync subscription + profile whenever the app returns to the foreground.
  // Without this, after a long background the app keeps a stale "not premium"
  // guess and a stale profile (generic greeting) until a full quit-and-reopen.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      const s = useAuthStore.getState().session;
      if (!s?.user) return;
      (async () => {
        try {
          ensurePremiumListener();
          await fetchProfile(s.user.id);
          rcPremiumRef.current = await getSubscriptionStatus();
          recomputePremium();
          queryClient.invalidateQueries();
        } catch {
          /* best-effort refresh */
        }
      })();
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === "(auth)";
    const onResetScreen = segments[0] === "(auth)" && (segments as string[])[1] === "reset";
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
      <GiftCelebrationModal />
      <PrayerMiniPlayer />
      <WhatsNewModal />
      <LockGate />
    </PersistQueryClientProvider>
  );
}
