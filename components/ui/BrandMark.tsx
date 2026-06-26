import { Image } from "react-native";

/**
 * The Prevail Prayer app icon, used anywhere we need a small brand mark
 * (welcome/onboarding, modals, devotion placeholders) instead of a glyph.
 */
export function BrandMark({ size = 32, radius }: { size?: number; radius?: number }) {
  return (
    <Image
      source={require("@/assets/images/icon.png")}
      style={{
        width: size,
        height: size,
        borderRadius: radius ?? Math.round(size * 0.22),
      }}
      resizeMode="cover"
    />
  );
}
