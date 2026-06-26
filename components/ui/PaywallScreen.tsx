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
import type { PurchasesPackage } from "react-native-purchases";
import { useSubscriptionStore } from "@/stores/subscriptionStore";
import { Icon } from "@/components/ui/Icon";
import { BrandMark } from "@/components/ui/BrandMark";
import { getOfferings, purchasePackage, restorePurchases } from "@/lib/purchases";

const PREMIUM_FEATURES = [
  { icon: "book-outline", title: "Prayer Journal", description: "Reflect and record what God is doing" },
  { icon: "timer-outline", title: "Prayer Timer", description: "Focused prayer with peaceful music" },
  { icon: "library-outline", title: "Scripture Library", description: "60+ KJV verses organized by topic" },
  { icon: "sparkles-outline", title: "Daily Devotions", description: "A new reading and reflection each day" },
  { icon: "notifications-outline", title: "Prayer Reminders", description: "Never miss your time with God" },
];

// Sort order for the tiers and a friendly label per package type.
const TIER_ORDER: Record<string, number> = { LIFETIME: 0, ANNUAL: 1, MONTHLY: 2 };

function tierMeta(pkg: PurchasesPackage) {
  const type = pkg.packageType;
  const price = pkg.product.priceString;
  const hasTrial = !!pkg.product.introPrice && pkg.product.introPrice.price === 0;

  if (type === "ANNUAL") {
    return {
      title: "Yearly",
      sub: hasTrial ? "14-day free trial, then billed yearly" : "Billed once a year",
      price,
      period: "/yr",
      badge: "Best value",
    };
  }
  if (type === "LIFETIME") {
    return { title: "Lifetime", sub: "Pay once. Yours forever.", price, period: "", badge: undefined };
  }
  if (type === "MONTHLY") {
    return { title: "Monthly", sub: "Billed every month", price, period: "/mo", badge: undefined };
  }
  return { title: pkg.identifier, sub: "", price, period: "", badge: undefined };
}

export function PaywallScreen() {
  const { paywallVisible, hidePaywall, setIsPremium } = useSubscriptionStore();
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [selected, setSelected] = useState<PurchasesPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    if (!paywallVisible) return;
    let active = true;

    async function load() {
      setLoading(true);
      const offering = await getOfferings();
      if (!active) return;
      const pkgs = (offering?.availablePackages ?? [])
        .slice()
        .sort((a, b) => (TIER_ORDER[a.packageType] ?? 9) - (TIER_ORDER[b.packageType] ?? 9));
      setPackages(pkgs);
      // Pre-select the yearly tier if present, otherwise the first package.
      const annual = pkgs.find((p) => p.packageType === "ANNUAL");
      setSelected(annual ?? pkgs[0] ?? null);
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [paywallVisible]);

  const ctaLabel = (() => {
    if (!selected) return "Continue";
    const hasTrial = !!selected.product.introPrice && selected.product.introPrice.price === 0;
    if (selected.packageType === "LIFETIME") return `Buy Lifetime — ${selected.product.priceString}`;
    if (hasTrial) return "Start 14-Day Free Trial";
    return `Subscribe — ${selected.product.priceString}`;
  })();

  const handlePurchase = async () => {
    if (!selected) return;
    setPurchasing(true);
    try {
      const success = await purchasePackage(selected);
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
      <View style={{ flex: 1, backgroundColor: "#F1EFF9" }}>
        <TouchableOpacity
          onPress={hidePaywall}
          style={{ alignSelf: "flex-end", padding: 20, paddingBottom: 0 }}
        >
          <Ionicons name="close" size={24} color="#9794A4" />
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 28, paddingBottom: 48 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={{ alignItems: "center", marginTop: 8, marginBottom: 24 }}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 24,
                backgroundColor: "#5B53C6",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
              }}
            >
              <BrandMark size={36} />
            </View>
            <Text
              style={{
                fontFamily: "Newsreader_600SemiBold",
                fontSize: 30,
                color: "#1D1B26",
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              Prevail Prayer{"\n"}Premium
            </Text>
            <Text
              style={{
                fontFamily: "HankenGrotesk_400Regular",
                fontSize: 15,
                color: "#5A5666",
                textAlign: "center",
                lineHeight: 22,
              }}
            >
              Everything you need for a{"\n"}deeper, more consistent prayer life.
            </Text>
          </View>

          {/* Feature list */}
          <View style={{ backgroundColor: "#FFFFFF", borderRadius: 20, padding: 8, marginBottom: 24 }}>
            {PREMIUM_FEATURES.map((feature, i) => (
              <View
                key={feature.title}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 16,
                  borderBottomWidth: i < PREMIUM_FEATURES.length - 1 ? 1 : 0,
                  borderBottomColor: "#E7E5EF",
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: "#ECEAFA",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 14,
                  }}
                >
                  <Ionicons name={feature.icon as any} size={20} color="#5B53C6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: "HankenGrotesk_600SemiBold", fontSize: 15, color: "#1D1B26" }}>
                    {feature.title}
                  </Text>
                  <Text style={{ fontFamily: "HankenGrotesk_400Regular", fontSize: 13, color: "#9794A4", marginTop: 1 }}>
                    {feature.description}
                  </Text>
                </View>
                <Ionicons name="checkmark-circle" size={20} color="#3FB27F" />
              </View>
            ))}
          </View>

          {/* Tier selection */}
          {loading ? (
            <View style={{ paddingVertical: 28 }}>
              <ActivityIndicator color="#5B53C6" />
            </View>
          ) : packages.length === 0 ? (
            <Text
              style={{
                fontFamily: "HankenGrotesk_400Regular",
                fontSize: 14,
                color: "#9794A4",
                textAlign: "center",
                paddingVertical: 24,
              }}
            >
              Plans are loading from the App Store. Please try again in a moment.
            </Text>
          ) : (
            <View style={{ marginBottom: 20 }}>
              {packages.map((pkg) => {
                const meta = tierMeta(pkg);
                const isSelected = selected?.identifier === pkg.identifier;
                return (
                  <TouchableOpacity
                    key={pkg.identifier}
                    onPress={() => setSelected(pkg)}
                    activeOpacity={0.85}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: "#FFFFFF",
                      borderRadius: 16,
                      borderWidth: 2,
                      borderColor: isSelected ? "#5B53C6" : "#E7E5EF",
                      padding: 16,
                      marginBottom: 12,
                    }}
                  >
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        borderWidth: 2,
                        borderColor: isSelected ? "#5B53C6" : "#C8C5D4",
                        backgroundColor: isSelected ? "#5B53C6" : "transparent",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 14,
                      }}
                    >
                      {isSelected && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Text style={{ fontFamily: "HankenGrotesk_600SemiBold", fontSize: 16, color: "#1D1B26" }}>
                          {meta.title}
                        </Text>
                        {meta.badge && (
                          <View
                            style={{
                              backgroundColor: "#5B53C6",
                              borderRadius: 8,
                              paddingHorizontal: 8,
                              paddingVertical: 2,
                              marginLeft: 8,
                            }}
                          >
                            <Text style={{ fontFamily: "HankenGrotesk_600SemiBold", fontSize: 10, color: "#FFFFFF" }}>
                              {meta.badge}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={{ fontFamily: "HankenGrotesk_400Regular", fontSize: 13, color: "#9794A4", marginTop: 2 }}>
                        {meta.sub}
                      </Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={{ fontFamily: "Newsreader_600SemiBold", fontSize: 20, color: "#1D1B26" }}>
                        {meta.price}
                      </Text>
                      {!!meta.period && (
                        <Text style={{ fontFamily: "HankenGrotesk_400Regular", fontSize: 12, color: "#9794A4" }}>
                          {meta.period}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* CTA */}
          <TouchableOpacity
            onPress={handlePurchase}
            disabled={purchasing || loading || !selected}
            style={{
              backgroundColor: "#5B53C6",
              borderRadius: 100,
              paddingVertical: 18,
              alignItems: "center",
              marginBottom: 14,
              opacity: purchasing || loading || !selected ? 0.6 : 1,
            }}
            activeOpacity={0.85}
          >
            {purchasing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={{ fontFamily: "HankenGrotesk_600SemiBold", fontSize: 16, color: "#FFFFFF" }}>
                {ctaLabel}
              </Text>
            )}
          </TouchableOpacity>

          <Text
            style={{
              fontFamily: "HankenGrotesk_400Regular",
              fontSize: 12,
              color: "#9794A4",
              textAlign: "center",
              marginBottom: 20,
              lineHeight: 18,
            }}
          >
            Subscriptions renew automatically until cancelled. Manage or cancel
            anytime in your App Store account settings.
          </Text>

          {/* Restore */}
          <TouchableOpacity onPress={handleRestore} disabled={restoring} style={{ alignItems: "center" }}>
            <Text style={{ fontFamily: "HankenGrotesk_500Medium", fontSize: 13, color: "#9794A4" }}>
              {restoring ? "Restoring..." : "Restore Purchase"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}
