import React from "react";
import { View, Text } from "react-native";

export default function StatCard({ label, value, hint }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#fff",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#eee",
        padding: 12,
      }}
    >
      <Text style={{ color: "#666", fontWeight: "800", fontSize: 12 }}>{label}</Text>
      <Text style={{ marginTop: 6, fontSize: 20, fontWeight: "900", color: "#111" }}>
        {value}
      </Text>
      {!!hint && (
        <Text style={{ marginTop: 2, color: "#777", fontWeight: "700", fontSize: 12 }}>
          {hint}
        </Text>
      )}
    </View>
  );
}
