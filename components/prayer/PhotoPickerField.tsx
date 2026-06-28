import { View, Text, TouchableOpacity, Image, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from "@/hooks/useTheme";
import { Icon } from "@/components/ui/Icon";
import { useSignedImage } from "@/hooks/useSignedImage";

type Props = {
  /** A freshly picked local file:// uri, if any. */
  localUri: string | null;
  /** An already-saved storage path (edit screen), shown until the user replaces it. */
  existingPath?: string | null;
  onPick: (uri: string) => void;
  onClear: () => void;
};

/** Attach / preview / remove a single photo on a prayer request. */
export function PhotoPickerField({ localUri, existingPath, onPick, onClear }: Props) {
  const Theme = useTheme();
  const { data: existingUrl } = useSignedImage(existingPath && !localUri ? existingPath : null);
  const preview = localUri ?? existingUrl ?? null;

  const pick = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Photo access needed", "Allow photo access in Settings to attach a picture.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!res.canceled && res.assets?.[0]?.uri) onPick(res.assets[0].uri);
  };

  if (preview) {
    return (
      <View style={{ marginBottom: 14 }}>
        <Image
          source={{ uri: preview }}
          style={{ width: "100%", height: 200, borderRadius: Theme.radius.inner, backgroundColor: Theme.card }}
          resizeMode="cover"
        />
        <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
          <TouchableOpacity onPress={pick} style={btn(Theme)}>
            <Icon name="image" size={15} color={Theme.primary} />
            <Text style={btnText(Theme)}>Change</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClear} style={btn(Theme)}>
            <Icon name="trash" size={15} color={Theme.urgent} />
            <Text style={[btnText(Theme), { color: Theme.urgent }]}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={pick}
      activeOpacity={0.8}
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        borderWidth: 1,
        borderColor: Theme.cardBorder,
        borderStyle: "dashed",
        borderRadius: Theme.radius.inner,
        paddingVertical: 18,
        marginBottom: 14,
        backgroundColor: Theme.card,
      }}
    >
      <Icon name="image" size={18} color={Theme.primary} />
      <Text style={{ fontFamily: Theme.font.sansSemi, fontSize: 15, color: Theme.primary }}>Add a photo</Text>
    </TouchableOpacity>
  );
}

const btn = (Theme: ReturnType<typeof useTheme>) =>
  ({
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    backgroundColor: Theme.card,
    borderWidth: 1,
    borderColor: Theme.cardBorder,
    borderRadius: Theme.radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 14,
  });
const btnText = (Theme: ReturnType<typeof useTheme>) =>
  ({ fontFamily: Theme.font.sansSemi as string, fontSize: 13, color: Theme.primary });
