import { useEffect, useState, useCallback } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { useAppLockStore } from "@/stores/appLockStore";
import { useAuthStore } from "@/stores/authStore";
import { authenticate, getBiometricLabel } from "@/lib/biometrics";
import { Icon } from "@/components/ui/Icon";

export function LockScreen() {
  const Theme = useTheme();
  const { setUnlocked } = useAppLockStore();
  const { signOut } = useAuthStore();
  const [label, setLabel] = useState("Face ID");
  const [busy, setBusy] = useState(false);

  const tryUnlock = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    const ok = await authenticate("Unlock Prevail Prayer");
    setBusy(false);
    if (ok) setUnlocked(true);
  }, [busy, setUnlocked]);

  useEffect(() => {
    getBiometricLabel().then(setLabel);
    // Auto-prompt once when the lock screen appears.
    tryUnlock();
  }, []);

  return (
    <View
      style={{
        position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: Theme.bg, alignItems: "center", justifyContent: "center",
        paddingHorizontal: 32, zIndex: 9999,
      }}
    >
      <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: Theme.primarySoft, alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
        <Icon name="lock" size={38} color={Theme.primary} />
      </View>
      <Text style={{ fontFamily: Theme.font.serif, fontSize: 26, color: Theme.text, marginBottom: 8 }}>
        Prevail Prayer is locked
      </Text>
      <Text style={{ fontFamily: Theme.font.sans, fontSize: 15, color: Theme.textMuted, textAlign: "center", lineHeight: 22, marginBottom: 32 }}>
        Use {label} to unlock your prayers and journal.
      </Text>
      <TouchableOpacity onPress={tryUnlock} disabled={busy} activeOpacity={0.88} style={{ backgroundColor: Theme.primary, borderRadius: Theme.radius.pill, paddingVertical: 16, paddingHorizontal: 44, alignItems: "center" }}>
        <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 16, color: "#FFFFFF" }}>
          {busy ? "Verifying..." : `Unlock with ${label}`}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={signOut} style={{ marginTop: 22 }}>
        <Text style={{ fontFamily: Theme.font.sansMed, fontSize: 14, color: Theme.textFaint }}>Sign out instead</Text>
      </TouchableOpacity>
    </View>
  );
}
