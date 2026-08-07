import React from "react";
import { Pressable, Text } from "react-native";

export default function SoftButton({ text, onPress, danger, disabled, full = true }) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      android_ripple={{ color: "rgba(0,0,0,0.06)" }}
      style={({ pressed }) => ({
        ...(full ? { flex: 1 } : {}),
        backgroundColor: "white",
        borderWidth: 1,
        borderColor: danger ? "#ffd6d6" : "#eee",
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 14,
        alignItems: "center",
        opacity: disabled ? 0.45 : pressed ? 0.92 : 1,
        overflow: "hidden",
      })}
    >
      <Text style={{ fontWeight: "900", color: danger ? "#b42318" : "#111" }}>
        {text}
      </Text>
    </Pressable>
  );
}
