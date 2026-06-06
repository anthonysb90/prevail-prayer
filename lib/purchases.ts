import Purchases, {
  LOG_LEVEL,
  PurchasesPackage,
} from "react-native-purchases";
import { Platform } from "react-native";

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
  if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);

  const apiKey = Platform.OS === "ios" ? API_KEYS.ios : API_KEYS.android;

  Purchases.configure({
    apiKey,
    appUserID: userId,
  });
}

/**
 * Returns true if the user has an active premium entitlement
 * (includes active trial period).
 */
export async function getSubscriptionStatus(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
  } catch {
    return false;
  }
}

/**
 * Returns the current offerings from RevenueCat.
 */
export async function getOfferings() {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch {
    return null;
  }
}

/**
 * Initiates a purchase for the given package.
 * Returns true if the entitlement is now active.
 */
export async function purchasePackage(pkg: PurchasesPackage): Promise<boolean> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
  } catch (e: any) {
    if (e.userCancelled) return false;
    throw e;
  }
}

/**
 * Restores prior purchases. Returns true if premium is now active.
 */
export async function restorePurchases(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.restorePurchases();
    return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
  } catch {
    return false;
  }
}
