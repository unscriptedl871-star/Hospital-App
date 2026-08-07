import React from "react";
import { Pressable, Text } from "react-native";

export default function TabChip({ label, active, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: "rgba(0,0,0,0.06)" }}
      style={({ pressed }) => ({
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 999,
        backgroundColor: active ? "black" : "rgba(255,255,255,0.95)",
        borderWidth: 1,
        borderColor: active ? "black" : "#eee",
        opacity: pressed ? 0.92 : 1,
        overflow: "hidden",
      })}
    >
      <Text style={{ fontWeight: "900", color: active ? "white" : "#111" }}>
        {label}
      </Text>
    </Pressable>
  );
}
