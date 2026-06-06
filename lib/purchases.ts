/**
 * Purchases stub — react-native-purchases configured but not yet live.
 * Replace API keys via EXPO_PUBLIC_RC_IOS_KEY / EXPO_PUBLIC_RC_ANDROID_KEY
 * before App Store submission. See LAUNCH.md for RevenueCat setup instructions.
 */

import { Platform } from "react-native";
import Purchases, { LOG_LEVEL } from "react-native-purchases";

export const ENTITLEMENT_ID = "premium";

const API_KEYS = {
  ios: process.env.EXPO_PUBLIC_RC_IOS_KEY ?? "",
  android: process.env.EXPO_PUBLIC_RC_ANDROID_KEY ?? "",
};

/**
 * Call this once after the user is authenticated.
 * Pass the Supabase user ID so RevenueCat links the customer.
 */
export async function initializePurchases(userId: string): Promise<void> {
  try {
    const apiKey = Platform.OS === "ios" ? API_KEYS.ios : API_KEYS.android;
    if (!apiKey) return; // Skip if RC keys not yet configured

    if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);

    Purchases.configure({
      apiKey,
      appUserID: userId,
    });
  } catch (e) {
    console.warn("RevenueCat init skipped:", e);
  }
}

export async function getSubscriptionStatus(): Promise<boolean> {
  // Returns false until RevenueCat is configured.
  // To test premium features during development, temporarily return true here.
  return false;
}

export async function getOfferings(): Promise<null> {
  return null;
}

export async function purchasePackage(_pkg: any): Promise<boolean> {
  return false;
}

export async function restorePurchases(): Promise<boolean> {
  return false;
}
