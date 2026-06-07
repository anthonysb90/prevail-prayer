import {
  View, Text, TouchableOpacity, Modal,
  Share, Linking, Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSupportStore } from "@/stores/supportStore";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";

const DONATION_URL = "https://prevailprayer.com/support"; // update with real link
const APP_STORE_URL = "https://apps.apple.com/app/prevail-prayer/idYOUR_APP_ID"; // update after submission

const OPTIONS = [
  {
    id: "supported",
    icon: "heart-outline" as const,
    label: "Support with a Donation",
    subtitle: "Help keep Prevail Prayer free & growing",
    color: "#E53E3E",
    bg: "#FFF5F5",
  },
  {
    id: "rated",
    icon: "star-outline" as const,
    label: "Rate the App",
    subtitle: "Leave a review on the App Store",
    color: "#F5B942",
    bg: "#FFF8E8",
  },
  {
    id: "shared",
    icon: "share-social-outline" as const,
    label: "Share with a Friend",
    subtitle: "Invite someone to pray with Prevail",
    color: "#4CAF50",
    bg: "#F0FFF4",
  },
] as const;

type ActionId = typeof OPTIONS[number]["id"];

export function SupportPromptModal() {
  const { visible, hide, interactionId } = useSupportStore();
  const { user } = useAuthStore();

  const handleAction = async (actionId: ActionId) => {
    if (user && interactionId) {
      await supabase
        .from("support_interactions")
        .update({ action: actionId })
        .eq("id", interactionId);
    }

    hide();

    if (actionId === "supported") {
      Linking.openURL(DONATION_URL).catch(() =>
        Alert.alert("Could not open link", "Visit prevailprayer.com/support")
      );
    } else if (actionId === "rated") {
      Linking.openURL(APP_STORE_URL).catch(() =>
        Alert.alert("Could not open App Store")
      );
    } else if (actionId === "shared") {
      Share.share({
        message:
          "I've been using Prevail Prayer to track my prayer requests and grow in prayer. Check it out: https://prevailprayer.com",
      });
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={hide}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: "rgba(0,0,0,0.4)",
        }}
      >
        <View
          style={{
            backgroundColor: "#F5F0E8",
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            padding: 28,
            paddingBottom: 44,
          }}
        >
          {/* Header */}
          <View style={{ alignItems: "center", marginBottom: 24 }}>
            <View
              style={{
                width: 56, height: 56,
                borderRadius: 18,
                backgroundColor: "#F5B942",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 14,
              }}
            >
              <Text style={{ fontSize: 26 }}>🙏</Text>
            </View>
            <Text
              style={{
                fontFamily: "PlayfairDisplay-Bold",
                fontSize: 22,
                color: "#1A1A1A",
                textAlign: "center",
                marginBottom: 6,
              }}
            >
              Support Prevail Prayer
            </Text>
            <Text
              style={{
                fontFamily: "DMSans-Regular",
                fontSize: 14,
                color: "#4A4A4A",
                textAlign: "center",
                lineHeight: 20,
              }}
            >
              You're making prayer a priority. Help us reach more people.
            </Text>
          </View>

          {/* Options */}
          <View style={{ gap: 10, marginBottom: 16 }}>
            {OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.id}
                onPress={() => handleAction(opt.id)}
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: 16,
                  padding: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 14,
                }}
                activeOpacity={0.8}
              >
                <View
                  style={{
                    width: 42, height: 42,
                    borderRadius: 13,
                    backgroundColor: opt.bg,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name={opt.icon} size={22} color={opt.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: "DMSans-SemiBold",
                      fontSize: 15,
                      color: "#1A1A1A",
                    }}
                  >
                    {opt.label}
                  </Text>
                  <Text
                    style={{
                      fontFamily: "DMSans-Regular",
                      fontSize: 12,
                      color: "#8A8A8A",
                      marginTop: 1,
                    }}
                  >
                    {opt.subtitle}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#8A8A8A" />
              </TouchableOpacity>
            ))}
          </View>

          {/* Dismiss */}
          <TouchableOpacity onPress={hide} style={{ alignItems: "center", paddingVertical: 8 }}>
            <Text
              style={{
                fontFamily: "DMSans-Regular",
                fontSize: 14,
                color: "#8A8A8A",
              }}
            >
              Not now
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
