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
    <View style={{ flex: 1, backgroundColor: "#F1EFF9" }}>
      {/* Header */}
      <View style={{ paddingTop: 64, paddingHorizontal: 24, paddingBottom: 8 }}>
        <Text
          style={{
            fontFamily: "Newsreader_600SemiBold",
            fontSize: 28,
            color: "#1D1B26",
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
            borderColor: "#E7E5EF",
          }}
        >
          <Ionicons name={icon as any} size={32} color="#5B53C6" />
        </View>

        <Text
          style={{
            fontFamily: "Newsreader_500Medium",
            fontSize: 22,
            color: "#1D1B26",
            textAlign: "center",
            marginBottom: 10,
          }}
        >
          {feature} is Premium
        </Text>

        <Text
          style={{
            fontFamily: "HankenGrotesk_400Regular",
            fontSize: 15,
            color: "#5A5666",
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
            backgroundColor: "#5B53C6",
            borderRadius: 100,
            paddingVertical: 16,
            paddingHorizontal: 32,
            marginBottom: 14,
          }}
          activeOpacity={0.85}
        >
          <Text
            style={{
              fontFamily: "HankenGrotesk_600SemiBold",
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
              fontFamily: "HankenGrotesk_400Regular",
              fontSize: 13,
              color: "#9794A4",
            }}
          >
            $14.99 / year after trial. Cancel anytime.
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
