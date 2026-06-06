/**
 * Purchases stub — react-native-purchases removed temporarily.
 * Replace with real RevenueCat integration before App Store submission.
 * See LAUNCH.md for RevenueCat setup instructions.
 */

export const ENTITLEMENT_ID = "premium";

export async function initializePurchases(_userId: string): Promise<void> {
  // No-op until RevenueCat is configured
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
