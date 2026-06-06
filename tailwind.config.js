/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        cream: {
          50: "#FDFBF7",
          100: "#F5F0E8",
          200: "#EDE5D8",
        },
        amber: {
          400: "#F5B942",
          500: "#E8A830",
        },
        charcoal: {
          400: "#8A8A8A",
          600: "#4A4A4A",
          900: "#1A1A1A",
        },
        dark: {
          bg: "#0A0A0A",
          surface: "#1A1A1A",
          border: "#2A2A2A",
        },
        urgent: "#E53E3E",
        // Category colors
        category: {
          familyBg: "#E8F5E9",
          familyBorder: "#4CAF50",
          churchBg: "#E3F2FD",
          churchBorder: "#2196F3",
          healingBg: "#FCE4EC",
          healingBorder: "#E91E63",
          financesBg: "#FFF8E1",
          financesBorder: "#FFC107",
          missionsBg: "#E0F7FA",
          missionsBorder: "#00BCD4",
          nationBg: "#EDE7F6",
          nationBorder: "#673AB7",
          salvationBg: "#FBE9E7",
          salvationBorder: "#FF5722",
          workBg: "#F3E5F5",
          workBorder: "#9C27B0",
          personalBg: "#E8EAF6",
          personalBorder: "#3F51B5",
          friendsBg: "#F1F8E9",
          friendsBorder: "#8BC34A",
        },
      },
      fontFamily: {
        "playfair-bold": ["PlayfairDisplay-Bold"],
        "playfair-semibold": ["PlayfairDisplay-SemiBold"],
        "dm-regular": ["DMSans-Regular"],
        "dm-medium": ["DMSans-Medium"],
        "dm-semibold": ["DMSans-SemiBold"],
      },
    },
  },
  plugins: [],
};
