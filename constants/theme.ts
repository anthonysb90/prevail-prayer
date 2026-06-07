// ── Prevail design system ───────────────────────────────────────────
// Indigo + Newsreader/Hanken Grotesk. Soft cards, calm surfaces.

export const Theme = {
  // Surfaces
  bgTop: "#F6F5FB",
  bgBottom: "#E6E3F2",
  bg: "#F1EFF9", // solid fallback / average of the gradient
  card: "#FFFFFF",
  cardBorder: "#E7E5EF",

  // Brand
  primary: "#5B53C6",
  primaryDeep: "#4A43B0",
  primarySoft: "#ECEAFA",
  accentOnDark: "#9C94F7",

  // Text
  text: "#1D1B26",
  textMuted: "#5A5666",
  textFaint: "#9794A4",

  // Dark surfaces (Prayer List + Focus) — deep plum-black to sit with indigo
  dark: "#141220",
  darkSurface: "#211E2E",
  darkBorder: "#2E2A3D",
  darkText: "#FFFFFF",
  darkMuted: "#A8A2BC",

  // State
  urgent: "#E0556B",
  success: "#3FB27F",

  // Shape
  radius: { card: 24, inner: 16, sm: 12, pill: 100 },

  // Type — names match the @expo-google-fonts keys loaded in _layout.tsx
  font: {
    serif: "Newsreader_600SemiBold",
    serifMed: "Newsreader_500Medium",
    serifReg: "Newsreader_400Regular",
    sans: "HankenGrotesk_400Regular",
    sansMed: "HankenGrotesk_500Medium",
    sansSemi: "HankenGrotesk_600SemiBold",
    sansBold: "HankenGrotesk_700Bold",
  },

  // Shadow preset for white cards on the lavender bg
  shadow: {
    shadowColor: "#282250",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
} as const;
