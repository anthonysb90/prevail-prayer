import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSubscriptionStore } from "@/stores/subscriptionStore";

interface PremiumGateProps {
  feature: string;
  description: string;
  icon: string;
  children: React.ReactNode;
}

/**
 * Wraps a premium screen. If the user isn't subscribed, shows a
 * locked placeholder and opens the paywall on tap.
 */
export function PremiumGate({
  feature,
  description,
  icon,
  children,
}: PremiumGateProps) {
  const { isPremium, showPaywall } = useSubscriptionStore();

  if (isPremium) return <>{children}</>;

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F0E8" }}>
      {/* Header */}
      <View style={{ paddingTop: 64, paddingHorizontal: 24, paddingBottom: 8 }}>
        <Text
          style={{
            fontFamily: "PlayfairDisplay-Bold",
            fontSize: 28,
            color: "#1A1A1A",
          }}
        >
          {feature}
        </Text>
      </View>

      {/* Locked state */}
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 36,
        }}
      >
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 20,
            backgroundColor: "#FFFFFF",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
            borderWidth: 1,
            borderColor: "#EDE5D8",
          }}
        >
          <Ionicons name={icon as any} size={32} color="#F5B942" />
        </View>

        <Text
          style={{
            fontFamily: "PlayfairDisplay-SemiBold",
            fontSize: 22,
            color: "#1A1A1A",
            textAlign: "center",
            marginBottom: 10,
          }}
        >
          {feature} is Premium
        </Text>

        <Text
          style={{
            fontFamily: "DMSans-Regular",
            fontSize: 15,
            color: "#4A4A4A",
            textAlign: "center",
            lineHeight: 22,
            marginBottom: 32,
          }}
        >
          {description}
        </Text>

        <TouchableOpacity
          onPress={showPaywall}
          style={{
            backgroundColor: "#F5B942",
            borderRadius: 100,
            paddingVertical: 16,
            paddingHorizontal: 32,
            marginBottom: 14,
          }}
          activeOpacity={0.85}
        >
          <Text
            style={{
              fontFamily: "DMSans-SemiBold",
              fontSize: 15,
              color: "#FFFFFF",
            }}
          >
            Start 14-Day Free Trial
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={showPaywall}>
          <Text
            style={{
              fontFamily: "DMSans-Regular",
              fontSize: 13,
              color: "#8A8A8A",
            }}
          >
            $14.99 / year after trial. Cancel anytime.
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
