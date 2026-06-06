import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSubscriptionStore } from "@/stores/subscriptionStore";
import {
  getOfferings,
  purchasePackage,
  restorePurchases,
} from "@/lib/purchases";
import { PurchasesPackage } from "react-native-purchases";

const PREMIUM_FEATURES = [
  {
    icon: "book-outline",
    title: "Prayer Journal",
    description: "Reflect and record what God is doing",
  },
  {
    icon: "timer-outline",
    title: "Prayer Timer",
    description: "Focused prayer with peaceful music",
  },
  {
    icon: "library-outline",
    title: "Scripture Library",
    description: "60+ KJV verses organized by topic",
  },
  {
    icon: "notifications-outline",
    title: "Prayer Reminders",
    description: "Never miss your time with God",
  },
];

export function PaywallScreen() {
  const { paywallVisible, hidePaywall, setIsPremium } = useSubscriptionStore();
  const [pkg, setPkg] = useState<PurchasesPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    if (!paywallVisible) return;

    async function load() {
      setLoading(true);
      const offering = await getOfferings();
      if (offering?.availablePackages.length) {
        setPkg(offering.availablePackages[0]);
      }
      setLoading(false);
    }

    load();
  }, [paywallVisible]);

  const handlePurchase = async () => {
    if (!pkg) return;
    setPurchasing(true);
    try {
      const success = await purchasePackage(pkg);
      if (success) {
        setIsPremium(true);
        hidePaywall();
      }
    } catch {
      Alert.alert("Purchase failed", "Please try again.");
    }
    setPurchasing(false);
  };

  const handleRestore = async () => {
    setRestoring(true);
    const success = await restorePurchases();
    if (success) {
      setIsPremium(true);
      hidePaywall();
      Alert.alert("Restored", "Your purchase has been restored.");
    } else {
      Alert.alert("Nothing to restore", "No previous purchase found for this account.");
    }
    setRestoring(false);
  };

  return (
    <Modal
      visible={paywallVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={hidePaywall}
    >
      <View style={{ flex: 1, backgroundColor: "#F5F0E8" }}>
        {/* Dismiss */}
        <TouchableOpacity
          onPress={hidePaywall}
          style={{ alignSelf: "flex-end", padding: 20, paddingBottom: 0 }}
        >
          <Ionicons name="close" size={24} color="#8A8A8A" />
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 28, paddingBottom: 48 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Icon */}
          <View style={{ alignItems: "center", marginTop: 8, marginBottom: 24 }}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 24,
                backgroundColor: "#F5B942",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
              }}
            >
              <Text style={{ fontSize: 36 }}>🙏</Text>
            </View>

            <Text
              style={{
                fontFamily: "PlayfairDisplay-Bold",
                fontSize: 30,
                color: "#1A1A1A",
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              Prevail Prayer{"\n"}Premium
            </Text>

            <Text
              style={{
                fontFamily: "DMSans-Regular",
                fontSize: 15,
                color: "#4A4A4A",
                textAlign: "center",
                lineHeight: 22,
              }}
            >
              Everything you need for a{"\n"}deeper, more consistent prayer life.
            </Text>
          </View>

          {/* Feature list */}
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 20,
              padding: 8,
              marginBottom: 28,
            }}
          >
            {PREMIUM_FEATURES.map((feature, i) => (
              <View
                key={feature.title}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 16,
                  borderBottomWidth: i < PREMIUM_FEATURES.length - 1 ? 1 : 0,
                  borderBottomColor: "#EDE5D8",
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: "#FFF8E8",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 14,
                  }}
                >
                  <Ionicons name={feature.icon as any} size={20} color="#F5B942" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: "DMSans-SemiBold",
                      fontSize: 15,
                      color: "#1A1A1A",
                    }}
                  >
                    {feature.title}
                  </Text>
                  <Text
                    style={{
                      fontFamily: "DMSans-Regular",
                      fontSize: 13,
                      color: "#8A8A8A",
                      marginTop: 1,
                    }}
                  >
                    {feature.description}
                  </Text>
                </View>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              </View>
            ))}
          </View>

          {/* Pricing */}
          <View style={{ alignItems: "center", marginBottom: 20 }}>
            {loading ? (
              <ActivityIndicator color="#F5B942" />
            ) : (
              <>
                <Text
                  style={{
                    fontFamily: "PlayfairDisplay-Bold",
                    fontSize: 36,
                    color: "#1A1A1A",
                  }}
                >
                  $14.99
                </Text>
                <Text
                  style={{
                    fontFamily: "DMSans-Regular",
                    fontSize: 14,
                    color: "#8A8A8A",
                    marginTop: 2,
                  }}
                >
                  per year — that's $1.25 / month
                </Text>
              </>
            )}
          </View>

          {/* CTA */}
          <TouchableOpacity
            onPress={handlePurchase}
            disabled={purchasing || loading || !pkg}
            style={{
              backgroundColor: "#F5B942",
              borderRadius: 100,
              paddingVertical: 18,
              alignItems: "center",
              marginBottom: 14,
              opacity: purchasing || loading ? 0.7 : 1,
            }}
            activeOpacity={0.85}
          >
            {purchasing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text
                style={{
                  fontFamily: "DMSans-SemiBold",
                  fontSize: 16,
                  color: "#FFFFFF",
                }}
              >
                Start 14-Day Free Trial
              </Text>
            )}
          </TouchableOpacity>

          <Text
            style={{
              fontFamily: "DMSans-Regular",
              fontSize: 12,
              color: "#8A8A8A",
              textAlign: "center",
              marginBottom: 20,
            }}
          >
            Free for 14 days. Then $14.99/year. Cancel anytime.
          </Text>

          {/* Restore */}
          <TouchableOpacity
            onPress={handleRestore}
            disabled={restoring}
            style={{ alignItems: "center" }}
          >
            <Text
              style={{
                fontFamily: "DMSans-Medium",
                fontSize: 13,
                color: "#8A8A8A",
              }}
            >
              {restoring ? "Restoring..." : "Restore Purchase"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}
