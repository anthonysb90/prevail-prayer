import { View, Text } from "react-native";
import { Category } from "@/types";

interface CategoryChipProps {
  category: Category;
  dark?: boolean;
}

export function CategoryChip({ category, dark = false }: CategoryChipProps) {
  return (
    <View
      style={{
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 100,
        backgroundColor: dark ? "#2A2A2A" : category.color_bg,
        borderLeftWidth: 2.5,
        borderLeftColor: category.color_border,
        marginRight: 6,
        marginBottom: 4,
      }}
    >
      <Text
        style={{
          fontFamily: "DMSans-Medium",
          fontSize: 11,
          color: dark ? "#9A9A9A" : category.color_border,
        }}
      >
        {category.name}
      </Text>
    </View>
  );
}
