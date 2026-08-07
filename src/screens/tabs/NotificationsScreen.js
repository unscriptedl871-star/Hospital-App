import React, { useContext } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useRoute } from "@react-navigation/native";
import { AuthContext } from "../../context/AuthContext";

export default function NotificationsScreen() {
  const route = useRoute();
  const { logout, user } = useContext(AuthContext);

  const title = String(route?.name || "Screen");

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: "900", color: "#111" }}>
              {title}
            </Text>
            <Text style={{ marginTop: 6, color: "#666", fontWeight: "700" }}>
              Coming soon{user?.role ? ` • Role: ${user.role}` : ""}
            </Text>
          </View>

          <Pressable
            onPress={logout}
            android_ripple={{ color: "rgba(0,0,0,0.06)" }}
            style={({ pressed }) => ({
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 999,
              backgroundColor: "#111",
              transform: [{ scale: pressed ? 0.97 : 1 }],
              overflow: "hidden",
            })}
          >
            <Text style={{ color: "white", fontWeight: "900" }}>Logout</Text>
          </Pressable>
        </View>

        <View
          style={{
            marginTop: 16,
            backgroundColor: "rgba(255,255,255,0.95)",
            borderRadius: 16,
            padding: 14,
            borderWidth: 1,
            borderColor: "#eee",
          }}
        >
          <Text style={{ fontWeight: "900", color: "#111" }}>This module isn’t built yet.</Text>
          <Text style={{ marginTop: 8, color: "#666", fontWeight: "700", lineHeight: 20 }}>
            You navigated here because the Admin tabs currently use this placeholder screen.
            Next we can build a real {title} screen (Reports / Users / Settings).
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
