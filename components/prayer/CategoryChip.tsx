import { View, Text } from "react-native";
import { Category } from "@/types";
import { Theme } from "@/constants/theme";

interface CategoryChipProps {
  category: Category;
  dark?: boolean;
}

export function CategoryChip({ category, dark = false }: CategoryChipProps) {
  return (
    <View
      style={{
        paddingHorizontal: 11,
        paddingVertical: 4,
        borderRadius: Theme.radius.pill,
        backgroundColor: dark ? "rgba(255,255,255,0.07)" : (category.color_bg ?? Theme.primarySoft),
        marginRight: 6,
        marginBottom: 6,
      }}
    >
      <Text
        style={{
          fontFamily: Theme.font.sansSemi,
          fontSize: 12,
          color: dark ? Theme.darkMuted : (category.color_border ?? Theme.primary),
        }}
      >
        {category.name}
      </Text>
    </View>
  );
}
