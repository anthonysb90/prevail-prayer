import { View, Text, TouchableOpacity, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

export default function PrayScreen() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: "#0A0A0A" }}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={{ paddingTop: 60, paddingHorizontal: 24, paddingBottom: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ color: "#FFFFFF", fontSize: 28, fontFamily: "PlayfairDisplay-Bold" }}>
          My Prayer List
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/timer")}
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#1A1A1A", alignItems: "center", justifyContent: "center" }}
        >
          <Ionicons name="timer-outline" size={20} color="#F5B942" />
        </TouchableOpacity>
      </View>

      {/* Empty state */}
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
        <Ionicons name="list-outline" size={48} color="#2A2A2A" />
        <Text style={{ color: "#9A9A9A", fontSize: 16, fontFamily: "DMSans-Regular", textAlign: "center", marginTop: 16, lineHeight: 24 }}>
          Your prayer list is empty.{"\n"}Add a request to begin.
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/prayer/new")}
          style={{ marginTop: 24, backgroundColor: "#F5B942", borderRadius: 100, paddingVertical: 14, paddingHorizontal: 28 }}
        >
          <Text style={{ color: "#FFFFFF", fontFamily: "DMSans-SemiBold", fontSize: 15 }}>
            Add Prayer Request
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
