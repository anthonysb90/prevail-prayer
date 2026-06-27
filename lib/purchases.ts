/**
 * RevenueCat purchases layer (live).
 *
 * The entitlement identifier MUST match the identifier configured in the
 * RevenueCat dashboard exactly. In this project it is "Prevail Prayer Pro"
 * (NOT "premium" — that mismatch would leave paying users locked out).
 *
 * API keys come from env:
 *   EXPO_PUBLIC_RC_IOS_KEY      (appl_...)
 *   EXPO_PUBLIC_RC_ANDROID_KEY  (goog_...) — set when Android ships
 *
 * Every call is guarded so the app still runs if the native module is
 * unavailable (Expo Go) or keys are unset — it simply behaves as a free,
 * non-premium user instead of crashing.
 */

import { Platform } from "react-native";
import Purchases, {
  LOG_LEVEL,
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
} from "react-native-purchases";

export const ENTITLEMENT_ID = "Prevail Prayer Pro";

const API_KEYS = {
  ios: process.env.EXPO_PUBLIC_RC_IOS_KEY ?? "",
  android: process.env.EXPO_PUBLIC_RC_ANDROID_KEY ?? "",
};

// True once Purchases.configure() has succeeded this session. Until then,
// every call below short-circuits to a safe "not premium" result.
let configured = false;

function currentKey(): string {
  return Platform.OS === "ios" ? API_KEYS.ios : API_KEYS.android;
}

/**
 * Call once after the user is authenticated. Passing the Supabase user ID as
 * the RevenueCat App User ID lets the server-side webhook map a purchase back
 * to the correct profile row, and enables cross-device restore.
 */
export async function initializePurchases(userId: string): Promise<void> {
  if (configured) {
    try {
      await Purchases.logIn(userId);
    } catch (e) {
      console.warn("RevenueCat logIn skipped:", e);
    }
    return;
  }

  const apiKey = currentKey();
  if (!apiKey) return; // No key yet → stay in free mode.

  try {
    if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    Purchases.configure({ apiKey, appUserID: userId });
    configured = true;
  } catch (e) {
    console.warn("RevenueCat init skipped:", e);
  }
}

/** True if the active entitlements include the premium entitlement. */
export function isEntitled(info?: CustomerInfo | null): boolean {
  return !!info?.entitlements.active[ENTITLEMENT_ID];
}

/** Reads current customer info and returns whether the user is premium. */
export async function getSubscriptionStatus(): Promise<boolean> {
  if (!configured) return false;
  try {
    const info = await Purchases.getCustomerInfo();
    return isEntitled(info);
  } catch (e) {
    console.warn("getSubscriptionStatus failed:", e);
    return false;
  }
}

/** RevenueCat offering shown for the birthday upgrade deal. */
export const BIRTHDAY_OFFERING_ID = "birthday";

/**
 * Returns an offering whose availablePackages drive the paywall.
 * Pass an offeringId to request a specific offering (e.g. the birthday deal);
 * falls back to the current offering if that offering isn't configured.
 */
export async function getOfferings(offeringId?: string): Promise<PurchasesOffering | null> {
  if (!configured) return null;
  try {
    const offerings = await Purchases.getOfferings();
    if (offeringId && offerings.all?.[offeringId]) return offerings.all[offeringId];
    return offerings.current ?? null;
  } catch (e) {
    console.warn("getOfferings failed:", e);
    return null;
  }
}

/**
 * Purchases a package. Returns true if the premium entitlement is active
 * afterward. A user-cancelled purchase resolves to false quietly.
 */
export async function purchasePackage(pkg: PurchasesPackage): Promise<boolean> {
  if (!configured) return false;
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return isEntitled(customerInfo);
  } catch (e: any) {
    if (!e?.userCancelled) console.warn("purchasePackage failed:", e);
    return false;
  }
}

/** Restores prior purchases. Returns true if premium is active afterward. */
export async function restorePurchases(): Promise<boolean> {
  if (!configured) return false;
  try {
    const info = await Purchases.restorePurchases();
    return isEntitled(info);
  } catch (e) {
    console.warn("restorePurchases failed:", e);
    return false;
  }
}

/**
 * Subscribe to live entitlement changes (renewals, expirations, restores on
 * another device). Returns an unsubscribe function. No-op until configured.
 */
export function onCustomerInfoUpdate(
  cb: (isPremium: boolean) => void
): () => void {
  if (!configured) return () => {};
  const listener = (info: CustomerInfo) => cb(isEntitled(info));
  Purchases.addCustomerInfoUpdateListener(listener);
  return () => Purchases.removeCustomerInfoUpdateListener(listener);
}
