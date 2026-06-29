import * as Notifications from "expo-notifications";
import * as Application from "expo-application";
import { Platform } from "react-native";
import { supabase } from "@/lib/supabase";
import { analytics } from "@/lib/analytics";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request permission and save Expo Push Token to Supabase.
 * Call once after the user authenticates.
 */
export async function registerPushToken(userId: string): Promise<void> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      // Record that this person has notifications off, so we can segment on it.
      analytics.setPersonProperties({ push_enabled: false, platform: Platform.OS });
      return;
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;

    await supabase.from("user_push_tokens").upsert({
      user_id: userId,
      expo_push_token: token,
      platform: Platform.OS as "ios" | "android",
      app_version: Application.nativeApplicationVersion ?? null,
      app_build: Application.nativeBuildVersion ?? null,
      updated_at: new Date().toISOString(),
    });
    analytics.setPersonProperties({ push_enabled: true, platform: Platform.OS });
  } catch (e) {
    console.warn("Push token registration failed:", e);
  }
}

/**
 * Schedule a local notification for a prayer request reminder.
 */
export async function scheduleLocalReminder(opts: {
  title: string;
  body: string;
  trigger: Notifications.NotificationTriggerInput;
  identifier?: string;
}): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: { title: opts.title, body: opts.body, sound: true },
    trigger: opts.trigger,
    identifier: opts.identifier,
  });
}

/**
 * Cancel a scheduled local notification by its identifier.
 */
export async function cancelReminder(identifier: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(identifier);
}
