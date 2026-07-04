import { View, Text, StyleProp, ViewStyle } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { Icon } from "@/components/ui/Icon";

interface PrivacyNoteProps {
  /** Override the default message. */
  text?: string;
  /** Use light-on-dark colors (e.g. the Prayer List screen). */
  dark?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Small lock + reassurance line reminding the user their prayers and journal
 * are private. Shown anywhere requests or entries are created or listed.
 */
export function PrivacyNote({ text, dark, style }: PrivacyNoteProps) {
  const Theme = useTheme();
  const color = dark ? Theme.darkMuted : Theme.textMuted;
  return (
    <View style={[{ flexDirection: "row", alignItems: "flex-start", gap: 7 }, style]}>
      <View style={{ marginTop: 2 }}>
        <Icon name="lock" size={13} color={color} />
      </View>
      <Text style={{ flex: 1, fontFamily: Theme.font.sans, fontSize: 12.5, color, lineHeight: 18 }}>
        {text ?? "Completely private. Only you can see this — no one else, ever."}
      </Text>
    </View>
  );
}
