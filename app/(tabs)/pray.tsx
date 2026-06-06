import { useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, SectionList } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { usePrayerList } from "@/hooks/usePrayers";
import { PrayerListItem } from "@/components/prayer/PrayerListItem";
import { PrayerRequest } from "@/types";

export default function PrayScreen() {
  const router = useRouter();
  const { data: prayers = [], isLoading, refetch } = usePrayerList();

  const urgent = prayers.filter((p) => p.is_urgent);
  const active = prayers.filter((p) => !p.is_urgent && p.status === "active");
  const ongoing = prayers.filter((p) => !p.is_urgent && p.status === "ongoing");

  const sections = [
    ...(urgent.length > 0 ? [{ title: "Urgent", data: urgent }] : []),
    ...(active.length > 0 ? [{ title: "Active", data: active }] : []),
    ...(ongoing.length > 0 ? [{ title: "Ongoing", data: ongoing }] : []),
  ];

  return (
    <View style={{ flex: 1, backgroundColor: "#0A0A0A" }}>
      <StatusBar style="light" />

      {/* Header */}
      <View
        style={{
          paddingTop: 60,
          paddingHorizontal: 24,
          paddingBottom: 16,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text style={{ color: "#FFFFFF", fontSize: 28, fontFamily: "PlayfairDisplay-Bold" }}>
          My Prayer List
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/timer")}
          style={{
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: "#1A1A1A",
            alignItems: "center", justifyContent: "center",
          }}
        >
          <Ionicons name="timer-outline" size={20} color="#F5B942" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color="#F5B942" />
        </View>
      ) : prayers.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
          <Ionicons name="list-outline" size={48} color="#2A2A2A" />
          <Text style={{ color: "#9A9A9A", fontSize: 16, fontFamily: "DMSans-Regular", textAlign: "center", marginTop: 16, lineHeight: 24 }}>
            Your prayer list is empty.{"
"}Add a request to begin.
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
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
          renderSectionHeader={({ section: { title, data } }) => (
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10, marginTop: 6 }}>
              {title === "Urgent" && (
                <Ionicons name="alert-circle" size={14} color="#E53E3E" style={{ marginRight: 6 }} />
              )}
              <Text
                style={{
                  fontFamily: "DMSans-SemiBold",
                  fontSize: 11,
                  color: title === "Urgent" ? "#E53E3E" : "#9A9A9A",
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  marginRight: 8,
                }}
              >
                {title}
              </Text>
              <Text style={{ fontFamily: "DMSans-Regular", fontSize: 11, color: "#4A4A4A" }}>
                {data.length}
              </Text>
            </View>
          )}
          renderItem={({ item }) => <PrayerListItem prayer={item as PrayerRequest} />}
          onRefresh={refetch}
          refreshing={isLoading}
        />
      )}
    </View>
  );
}
