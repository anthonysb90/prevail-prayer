export const Colors = {
  // Backgrounds
  cream50: "#FDFBF7",
  cream100: "#F5F0E8",
  cream200: "#EDE5D8",

  // Accent
  amber400: "#F5B942",
  amber500: "#E8A830",

  // Text
  charcoal900: "#1A1A1A",
  charcoal600: "#4A4A4A",
  charcoal400: "#8A8A8A",

  // Surface
  white: "#FFFFFF",
  urgent: "#E53E3E",

  // Prayer List (always dark)
  darkBg: "#0A0A0A",
  darkSurface: "#1A1A1A",
  darkBorder: "#2A2A2A",
  darkText: "#FFFFFF",
  darkMuted: "#9A9A9A",

  // Categories
  categories: {
    Family:     { bg: "#E8F5E9", border: "#4CAF50" },
    Church:     { bg: "#E3F2FD", border: "#2196F3" },
    Healing:    { bg: "#FCE4EC", border: "#E91E63" },
    Finances:   { bg: "#FFF8E1", border: "#FFC107" },
    Missions:   { bg: "#E0F7FA", border: "#00BCD4" },
    Nation:     { bg: "#EDE7F6", border: "#673AB7" },
    Salvation:  { bg: "#FBE9E7", border: "#FF5722" },
    Work:       { bg: "#F3E5F5", border: "#9C27B0" },
    Personal:   { bg: "#E8EAF6", border: "#3F51B5" },
    Friends:    { bg: "#F1F8E9", border: "#8BC34A" },
  },
} as const;
