import { useThemeStore } from "@/stores/themeStore";
import { LightTheme, DarkTheme, AppTheme } from "@/constants/theme";

/** Returns the active palette (light or dark) and re-renders on theme change. */
export function useTheme(): AppTheme {
  const isDark = useThemeStore((s) => s.isDark);
  return isDark ? DarkTheme : LightTheme;
}
