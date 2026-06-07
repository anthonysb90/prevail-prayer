import { View, Text, TouchableOpacity, StyleProp, ViewStyle } from "react-native";
import { Theme } from "@/constants/theme";
import { Icon } from "@/components/ui/Icon";
import { Category } from "@/types";

// Small-caps section label ───────────────────────────────────────────
export function Eyebrow({ children, color, style }: { children: React.ReactNode; color?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <Text
      style={[
        {
          fontFamily: Theme.font.sansBold,
          fontSize: 12,
          letterSpacing: 1.5,
          textTransform: "uppercase",
          color: color ?? Theme.primary,
        },
        style as any,
      ]}
    >
      {children}
    </Text>
  );
}

// White card surface ──────────────────────────────────────────────────
export function Card({ children, style, onPress }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  const content = (
    <View
      style={[
        {
          backgroundColor: Theme.card,
          borderRadius: Theme.radius.card,
          borderWidth: 1,
          borderColor: Theme.cardBorder,
          padding: 18,
          ...Theme.shadow,
        },
        style as any,
      ]}
    >
      {children}
    </View>
  );
  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
}

// Category / topic tag pill ─────────────────────────────────────────────
export function Tag({ category, small, dark }: { category: Category; small?: boolean; dark?: boolean }) {
  return (
    <View
      style={{
        backgroundColor: dark ? "rgba(255,255,255,0.08)" : (category.color_bg ?? Theme.primarySoft),
        borderRadius: Theme.radius.pill,
        paddingHorizontal: small ? 9 : 11,
        paddingVertical: small ? 3 : 4,
        alignSelf: "flex-start",
      }}
    >
      <Text
        style={{
          fontFamily: Theme.font.sansSemi,
          fontSize: small ? 11 : 12,
          color: dark ? Theme.darkMuted : (category.color_border ?? Theme.primary),
        }}
      >
        {category.name}
      </Text>
    </View>
  );
}

// Round icon button (header actions) ────────────────────────────────────
export function RoundButton({
  name, onPress, dot, dark, size = 22,
}: { name: string; onPress?: () => void; dot?: boolean; dark?: boolean; size?: number }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        width: 42, height: 42, borderRadius: 21,
        backgroundColor: dark ? Theme.darkSurface : Theme.card,
        borderWidth: 1, borderColor: dark ? Theme.darkBorder : Theme.cardBorder,
        alignItems: "center", justifyContent: "center",
      }}
    >
      <Icon name={name} size={size} color={dark ? Theme.darkText : Theme.text} />
      {dot && (
        <View
          style={{
            position: "absolute", top: 9, right: 9,
            width: 8, height: 8, borderRadius: 4,
            backgroundColor: Theme.primary,
            borderWidth: 1.5, borderColor: dark ? Theme.darkSurface : Theme.card,
          }}
        />
      )}
    </TouchableOpacity>
  );
}

// Rotating verse block ──────────────────────────────────────────────────
export function VerseBlock({
  text, reference, onRefresh, dark,
}: { text: string; reference: string; onRefresh?: () => void; dark?: boolean }) {
  return (
    <Card style={dark ? { backgroundColor: Theme.darkSurface, borderColor: Theme.darkBorder } : undefined}>
      <View style={{ opacity: 0.3, marginBottom: 6 }}>
        <Icon name="quote" size={22} color={dark ? Theme.darkText : Theme.primary} />
      </View>
      <Text
        style={{
          fontFamily: Theme.font.serifReg,
          fontSize: 18,
          lineHeight: 27,
          color: dark ? Theme.darkText : Theme.text,
          marginBottom: 12,
        }}
      >
        {text}
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 13, color: dark ? Theme.darkMuted : Theme.textMuted }}>
          {reference}
        </Text>
        {onRefresh && (
          <TouchableOpacity onPress={onRefresh} style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <Icon name="sparkle" size={14} color={Theme.primary} />
            <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 13, color: Theme.primary }}>New verse</Text>
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );
}

// Home section header with count + actions ──────────────────────────────
export function SectionHeader({
  title, count, onAll, onAdd,
}: { title: string; count?: number; onAll?: () => void; onAdd?: () => void }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Text style={{ fontFamily: Theme.font.serif, fontSize: 20, color: Theme.text }}>{title}</Text>
        {count !== undefined && (
          <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 13, color: Theme.textFaint }}>{count}</Text>
        )}
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        {onAll && (
          <TouchableOpacity onPress={onAll} style={{ paddingHorizontal: 6, paddingVertical: 4 }}>
            <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 13, color: Theme.primary }}>All</Text>
          </TouchableOpacity>
        )}
        {onAdd && (
          <TouchableOpacity
            onPress={onAdd}
            style={{
              width: 28, height: 28, borderRadius: 14,
              backgroundColor: Theme.primarySoft,
              alignItems: "center", justifyContent: "center",
            }}
          >
            <Icon name="plus" size={16} color={Theme.primary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
