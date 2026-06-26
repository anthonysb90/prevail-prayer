// ── Prevail design system ───────────────────────────────────────────
// Indigo + Newsreader/Hanken Grotesk. Light + Dark palettes share one shape.

const font = {
  serif: "Newsreader_600SemiBold",
  serifMed: "Newsreader_500Medium",
  serifReg: "Newsreader_400Regular",
  sans: "HankenGrotesk_400Regular",
  sansMed: "HankenGrotesk_500Medium",
  sansSemi: "HankenGrotesk_600SemiBold",
  sansBold: "HankenGrotesk_700Bold",
} as const;

const radius = { card: 24, inner: 16, sm: 12, pill: 100 } as const;

export const LightTheme = {
  isDark: false,

  // Surfaces
  bgTop: "#F6F5FB",
  bgBottom: "#E6E3F2",
  bg: "#F1EFF9",
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

  // Dark immersive surfaces (Prayer List + Focus) — same in both modes
  dark: "#141220",
  darkSurface: "#211E2E",
  darkBorder: "#2E2A3D",
  darkText: "#FFFFFF",
  darkMuted: "#A8A2BC",

  // State
  urgent: "#E0556B",
  success: "#3FB27F",

  radius,
  font,

  shadow: {
    shadowColor: "#282250",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
} as const;

export const DarkTheme: typeof LightTheme = {
  isDark: true,

  // Surfaces
  bgTop: "#15131F",
  bgBottom: "#100E18",
  bg: "#121019",
  card: "#1E1B29",
  cardBorder: "#2E2A3D",

  // Brand
  primary: "#7B73E0",
  primaryDeep: "#9C94F7",
  primarySoft: "#272340",
  accentOnDark: "#9C94F7",

  // Text
  text: "#F4F2FA",
  textMuted: "#B6B1C7",
  textFaint: "#7C7790",

  // Dark immersive surfaces — same in both modes
  dark: "#141220",
  darkSurface: "#211E2E",
  darkBorder: "#2E2A3D",
  darkText: "#FFFFFF",
  darkMuted: "#A8A2BC",

  // State
  urgent: "#F06A7E",
  success: "#4FC08D",

  radius,
  font,

  shadow: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 4,
  },
};

export type AppTheme = typeof LightTheme;

// Backwards-compatible default (light). Screens use the useTheme() hook so the
// palette swaps at runtime; this static export is only a fallback for any
// module-scope styles (e.g. pre-auth screens) that read the palette once.
export const Theme = LightTheme;
