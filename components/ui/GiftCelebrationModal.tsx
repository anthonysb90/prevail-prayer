import { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, TouchableOpacity, Modal, Animated, Easing, Dimensions } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthStore } from "@/stores/authStore";
import { useTheme } from "@/hooks/useTheme";
import { Icon } from "@/components/ui/Icon";
import { analytics } from "@/lib/analytics";
import { isComped } from "@/lib/trial";

const KEY = "prevail.gift_celebrated_for"; // stores the comp_until we already celebrated
const LIFETIME_YEAR = 2999;

const PERKS = [
  "Prayer Journal",
  "Prayer Timer with music",
  "Scripture Library",
  "Daily Devotions",
  "Prayer Reminders",
];

/** Friendly description of how long the gift lasts. */
function durationLabel(compUntil: string): string {
  const d = new Date(compUntil);
  if (d.getFullYear() >= LIFETIME_YEAR) return "Yours for life";
  return `Active through ${d.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}`;
}

const CONFETTI_COLORS = ["#F5B942", "#E86A92", "#5BC0BE", "#9C94F7", "#7BD389", "#FF8C42"];
const CONFETTI_COUNT = 44;
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

interface Piece {
  left: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
  sway: number;
  rounded: boolean;
}

function ConfettiPiece({ piece, progress }: { piece: Piece; progress: Animated.Value }) {
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [-30, SCREEN_H + 40] });
  const translateX = progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, piece.sway, 0] });
  const rotate = progress.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "720deg"] });
  const opacity = progress.interpolate({ inputRange: [0, 0.85, 1], outputRange: [1, 1, 0] });
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: 0,
        left: piece.left,
        width: piece.size,
        height: piece.size * 0.6,
        backgroundColor: piece.color,
        borderRadius: piece.rounded ? piece.size : 2,
        opacity,
        transform: [{ translateY }, { translateX }, { rotate }],
      }}
    />
  );
}

/**
 * Shown once when an admin has gifted the user Pro. Celebrates the gift,
 * lists what they get, how long it lasts, and that it's from the developer.
 * Confetti is hand-rolled with Animated (no native dependency) so the whole
 * feature can ship over-the-air.
 */
export function GiftCelebrationModal() {
  const Theme = useTheme();
  const { user, profile } = useAuthStore();
  const [visible, setVisible] = useState(false);
  const compUntil = profile?.comp_until ?? null;

  const pieces = useMemo<Piece[]>(
    () =>
      Array.from({ length: CONFETTI_COUNT }).map(() => ({
        left: Math.random() * SCREEN_W,
        size: 8 + Math.random() * 8,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        delay: Math.random() * 600,
        duration: 2200 + Math.random() * 1600,
        sway: (Math.random() - 0.5) * 120,
        rounded: Math.random() > 0.6,
      })),
    [],
  );
  const progress = useRef(pieces.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    (async () => {
      if (!user || !compUntil) return;
      if (!isComped(profile)) return; // expired gift — don't celebrate
      const seen = await AsyncStorage.getItem(KEY);
      if (seen === compUntil) return; // already celebrated this exact gift
      setVisible(true);
      analytics.capture("gift_pro_celebrated");
      try { await AsyncStorage.setItem(KEY, compUntil); } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, compUntil]);

  useEffect(() => {
    if (!visible) return;
    const anims = pieces.map((p, i) =>
      Animated.timing(progress[i], {
        toValue: 1,
        duration: p.duration,
        delay: p.delay,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    );
    progress.forEach((v) => v.setValue(0));
    Animated.stagger(20, anims).start();
  }, [visible, pieces, progress]);

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => setVisible(false)}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", paddingHorizontal: 28 }}>
        {pieces.map((p, i) => (
          <ConfettiPiece key={i} piece={p} progress={progress[i]} />
        ))}

        <View style={{ backgroundColor: Theme.bg, borderRadius: 28, padding: 28, alignItems: "center" }}>
          <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: Theme.primary, alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
            <Icon name="sparkle" size={30} color="#FFFFFF" />
          </View>

          <Text style={{ fontFamily: Theme.font.serif, fontSize: 26, color: Theme.text, textAlign: "center", marginBottom: 8 }}>
            You've been gifted Pro!
          </Text>
          <Text style={{ fontFamily: Theme.font.sans, fontSize: 15, color: Theme.textMuted, textAlign: "center", lineHeight: 22, marginBottom: 20 }}>
            A gift from the Prevail Prayer team. Everything in Pro is unlocked for you, no payment needed.
          </Text>

          <View style={{ alignSelf: "stretch", backgroundColor: Theme.card, borderWidth: 1, borderColor: Theme.cardBorder, borderRadius: Theme.radius.inner, padding: 16, marginBottom: 18 }}>
            {PERKS.map((perk) => (
              <View key={perk} style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 5 }}>
                <Icon name="check" size={16} color={Theme.primary} />
                <Text style={{ fontFamily: Theme.font.sans, fontSize: 15, color: Theme.text }}>{perk}</Text>
              </View>
            ))}
          </View>

          {compUntil && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 22 }}>
              <Icon name="clock" size={15} color={Theme.textMuted} />
              <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 14, color: Theme.textMuted }}>{durationLabel(compUntil)}</Text>
            </View>
          )}

          <TouchableOpacity onPress={() => setVisible(false)} activeOpacity={0.88} style={{ alignSelf: "stretch", backgroundColor: Theme.primary, borderRadius: Theme.radius.pill, paddingVertical: 16, alignItems: "center" }}>
            <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 16, color: "#FFFFFF" }}>Start exploring</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
