import * as LocalAuthentication from "expo-local-authentication";

export async function isBiometricAvailable(): Promise<boolean> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && enrolled;
  } catch {
    return false;
  }
}

export async function getBiometricLabel(): Promise<string> {
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) return "Face ID";
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) return "Touch ID";
    return "Biometric Unlock";
  } catch {
    return "Biometric Unlock";
  }
}

export async function authenticate(reason = "Unlock Prevail Prayer"): Promise<boolean> {
  try {
    const res = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      fallbackLabel: "Use Passcode",
      disableDeviceFallback: false,
    });
    return res.success;
  } catch {
    return false;
  }
}
