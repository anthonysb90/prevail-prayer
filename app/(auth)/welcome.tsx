import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Theme } from "@/constants/theme";
import { Icon } from "@/components/ui/Icon";

export default function WelcomeScreen() {
  const router = useRouter();
  return (
    <View style={{ flex: 1, backgroundColor: Theme.bg }}>
      <StatusBar style="dark" />
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, paddingTop: 80 }}>
        <View style={{ width: 88, height: 88, borderRadius: 26, backgroundColor: Theme.primary, alignItems: "center", justifyContent: "center", marginBottom: 28, shadowColor: Theme.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.35, shadowRadius: 24, elevation: 8 }}>
          <Icon name="cross" size={38} color="#FFFFFF" />
        </View>
        <Text style={{ fontFamily: Theme.font.serif, fontSize: 42, color: Theme.text, textAlign: "center", marginBottom: 14 }}>Prevail Prayer</Text>
        <Text style={{ fontFamily: Theme.font.serifReg, fontSize: 17, color: Theme.textMuted, textAlign: "center", lineHeight: 26, paddingHorizontal: 8 }}>
          "The effectual fervent prayer of a righteous man availeth much."
        </Text>
        <Text style={{ fontFamily: Theme.font.sansMed, fontSize: 13, color: Theme.textFaint, marginTop: 10 }}>— James 5:16</Text>
      </View>
      <View style={{ paddingHorizontal: 24, paddingBottom: 48, gap: 12 }}>
        <TouchableOpacity onPress={() => router.push("/(auth)/signup")} activeOpacity={0.88} style={{ backgroundColor: Theme.primary, borderRadius: Theme.radius.pill, paddingVertical: 16, alignItems: "center" }}>
          <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 16, color: "#FFFFFF" }}>Get Started</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/(auth)/login")} activeOpacity={0.88} style={{ backgroundColor: Theme.card, borderWidth: 1, borderColor: Theme.cardBorder, borderRadius: Theme.radius.pill, paddingVertical: 16, alignItems: "center" }}>
          <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 16, color: Theme.text }}>I Already Have an Account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
