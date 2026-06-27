import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { useSubscriptionStore } from "@/stores/subscriptionStore";

interface BirthdayData {
  type?: string;
  offer?: boolean;
}

/**
 * Opens the birthday paywall when a non-Pro user taps their birthday
 * notification (data.type === "birthday" && data.offer). Handles both a tap
 * while the app is running and a cold start from the notification.
 */
export function BirthdayNotificationHandler() {
  const showPaywall = useSubscriptionStore((s) => s.showPaywall);

  useEffect(() => {
    const handle = (data: BirthdayData | undefined) => {
      if (data?.type === "birthday" && data?.offer) showPaywall("birthday");
    };

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      handle(response.notification.request.content.data as BirthdayData | undefined);
    });

    // Cold start: the app was launched by tapping the notification.
    Notifications.getLastNotificationResponseAsync().then((response) => {
      handle(response?.notification.request.content.data as BirthdayData | undefined);
    });

    return () => sub.remove();
  }, [showPaywall]);

  return null;
}
