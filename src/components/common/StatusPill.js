import React from "react";
import { View, Text } from "react-native";

export default function StatusPill({ status }) {
  const s = String(status || "pending").toLowerCase();
  const style =
    s === "arrived"
      ? { bg: "#e9fbef", border: "#c8f3d6", text: "#167a34" }
      : s === "done" || s === "completed"
      ? { bg: "#eef2ff", border: "#dfe3ff", text: "#364fc7" }
      : s === "upcoming" || s === "confirmed"
      ? { bg: "#eaf2ff", border: "#d7e7ff", text: "#1f6feb" }
      : s === "cancelled"
      ? { bg: "#fff1f0", border: "#ffd6d6", text: "#b42318" }
      : { bg: "#fff7e6", border: "#ffe3b0", text: "#8a4b00" }; // pending

  return (
    <View
      style={{
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: style.bg,
        borderWidth: 1,
        borderColor: style.border,
      }}
    >
      <Text style={{ fontWeight: "900", fontSize: 12, color: style.text }}>
        {s.toUpperCase()}
      </Text>
    </View>
  );
}
