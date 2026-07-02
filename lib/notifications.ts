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
 * Register the Expo push token IF the user has already granted notification
 * permission. This does NOT prompt — it's safe to call at launch. iOS only
 * shows the system prompt once, and a cold prompt right after login gets
 * denied and is near-permanent, so we defer the ask to a contextual moment
 * (see requestPushPermission, called when the user enables reminders).
 */
export async function registerPushToken(userId: string): Promise<void> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      analytics.setPersonProperties({ push_enabled: false, platform: Platform.OS });
      return;
    }
    await saveExpoPushToken(userId);
  } catch (e) {
    console.warn("Push token registration failed:", e);
  }
}

/** Fetch and upsert the Expo push token. Caller must ensure permission first. */
async function saveExpoPushToken(userId: string): Promise<void> {
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
}

/**
 * Prompt for notification permission at a contextual moment (e.g. when the user
 * enables a reminder). Registers the push token if granted. Returns whether
 * notifications are usable afterward. Safe to call repeatedly — the OS only
 * shows the system prompt the first time.
 */
export async function requestPushPermission(userId: string): Promise<boolean> {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;
    if (existing !== "granted") {
      status = (await Notifications.requestPermissionsAsync()).status;
    }
    if (status !== "granted") {
      analytics.setPersonProperties({ push_enabled: false, platform: Platform.OS });
      return false;
    }
    await saveExpoPushToken(userId);
    return true;
  } catch (e) {
    console.warn("Push permission request failed:", e);
    return false;
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
