import { Stack } from "expo-router";

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="walk" />
      <Stack.Screen name="personalize" />
    </Stack>
  );
}
