import React, { useMemo, useState } from "react";
import { View, Text, Pressable, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { appointmentsApi } from "../../services/api";

const TIME_SLOTS = [
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
];

function formatDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function BookAppointmentScreen({ route, navigation }) {
  const doctorId = route?.params?.doctorId;

  const [dateObj, setDateObj] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [time, setTime] = useState(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  // ✅ CONFIRM → BACKEND
  const onConfirm = async () => {
    if (!doctorId || !time) return;

    try {
      setErr("");
      setSaving(true);

      await appointmentsApi.create({
        doctorId,
        department: "General",
        date: formatDate(dateObj),
        time,
      });

      navigation.navigate("Tabs", { screen: "Appointments" });
    } catch (e) {
      setErr(e?.message || "Failed to book appointment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#f7f7f7", padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: "800" }}>Book Appointment</Text>

      <Pressable onPress={() => setShowPicker(true)} style={{ marginTop: 16 }}>
        <Text>{formatDate(dateObj)}</Text>
      </Pressable>

      {showPicker && (
        <DateTimePicker
          value={dateObj}
          mode="date"
          onChange={(_, d) => {
            setShowPicker(Platform.OS === "ios");
            if (d) setDateObj(d);
          }}
        />
      )}

      <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 16 }}>
        {TIME_SLOTS.map((slot) => (
          <Pressable key={slot} onPress={() => setTime(slot)} style={{ margin: 6 }}>
            <Text
              style={{
                padding: 10,
                backgroundColor: time === slot ? "black" : "white",
                color: time === slot ? "white" : "black",
              }}
            >
              {slot}
            </Text>
          </Pressable>
        ))}
      </View>

      {err ? <Text style={{ color: "crimson", marginTop: 12 }}>{err}</Text> : null}

      <Pressable
        onPress={onConfirm}
        disabled={!doctorId || !time || saving}
        style={{
          marginTop: 24,
          backgroundColor: !doctorId || !time ? "#ccc" : "black",
          padding: 16,
          borderRadius: 14,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "white", fontWeight: "800" }}>
          {saving ? "Saving..." : "Confirm Appointment"}
        </Text>
      </Pressable>
    </View>
  );
}
