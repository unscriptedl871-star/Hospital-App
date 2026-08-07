import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { AuthContext } from "../../context/AuthContext";
import { api } from "../../services/api"; // ✅ named export

export default function PatientProfileScreen({ route, navigation }) {
  const { user } = useContext(AuthContext);

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const patientName = String(route?.params?.patientName || "Patient").trim();
  const patientId = route?.params?.patientId || null;

const fetchAppointments = useCallback(async () => {
  try {
    setError("");
    setLoading(true);

    const data = await api.get("/appointments/my");
    const list = Array.isArray(data) ? data : [];

    setAppointments(list);
  } catch (e) {
    setAppointments([]);
    setError(e?.message || "Failed to load appointments");
  } finally {
    setLoading(false);
  }
}, []);


  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAppointments();
    setRefreshing(false);
  }, [fetchAppointments]);

  const patientAppts = useMemo(() => {
    const list = appointments || [];
    const targetName = patientName.toLowerCase();
    const targetId = patientId ? String(patientId) : null;

    return list
      .filter((a) => {
        const pName = String(a.patientName || a.patient?.name || a.patient || "").trim();
        const pId = a?.patient?._id ? String(a.patient._id) : null;

        if (targetId && pId) return pId === targetId;
        return pName.toLowerCase() === targetName;
      })
      .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  }, [appointments, patientName, patientId]);

  const latestAppt = patientAppts[0];

  const openChat = () => {
    const chatId = latestAppt?._id || patientId || patientName;

    navigation.navigate("Chat", {
      screen: "ChatRoom",
      params: { chatId, name: patientName },
    });
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>Loading…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 22 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: "900", color: "#111" }}>{patientName}</Text>
            <Text style={{ marginTop: 4, color: "#666", fontWeight: "700" }}>Patient Profile</Text>
            {!!error && (
              <Text style={{ marginTop: 6, color: "red", fontWeight: "700" }}>{error}</Text>
            )}
          </View>

          <Pressable
            onPress={openChat}
            android_ripple={{ color: "rgba(0,0,0,0.06)" }}
            style={({ pressed }) => ({
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 999,
              backgroundColor: "#111",
              opacity: pressed ? 0.92 : 1,
              overflow: "hidden",
            })}
          >
            <Text style={{ color: "white", fontWeight: "900" }}>💬 Chat</Text>
          </Pressable>
        </View>

        {/* Summary */}
        <View
          style={{
            marginTop: 14,
            backgroundColor: "rgba(255,255,255,0.95)",
            borderRadius: 18,
            padding: 16,
            borderWidth: 1,
            borderColor: "#eee",
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "900" }}>Summary</Text>
          <Text style={{ marginTop: 10, color: "#666", fontWeight: "700" }}>
            Total appointments: {patientAppts.length}
          </Text>

          {latestAppt ? (
            <View style={{ marginTop: 10 }}>
              <Text style={{ fontWeight: "900" }}>Latest appointment</Text>
              <Text style={{ marginTop: 6, color: "#666", fontWeight: "700" }}>
                Doctor: {latestAppt.doctorName || latestAppt.doctor?.name || "Doctor"}
              </Text>
              <Text style={{ marginTop: 4, color: "#666", fontWeight: "700" }}>
                Department: {latestAppt.department?.name || latestAppt.department || "Department"}
              </Text>
              <Text style={{ marginTop: 4, color: "#666", fontWeight: "700" }}>
                Date/Time: {latestAppt.date || "-"} • {latestAppt.time || "-"}
              </Text>
              <Text style={{ marginTop: 4, color: "#666", fontWeight: "700" }}>
                Status: {String(latestAppt.status || "pending").toUpperCase()}
              </Text>
            </View>
          ) : (
            <Text style={{ marginTop: 10, color: "#666", fontWeight: "700" }}>
              No appointment history found.
            </Text>
          )}
        </View>

        {/* Appointment history */}
        <Text style={{ marginTop: 18, fontSize: 16, fontWeight: "900" }}>Appointment History</Text>

        {patientAppts.length === 0 ? (
          <Text style={{ marginTop: 8, color: "#666", fontWeight: "700" }}>
            Nothing to show yet.
          </Text>
        ) : (
          <View style={{ marginTop: 8 }}>
            {patientAppts.map((a) => (
              <Pressable
                key={a._id}
                onPress={() => {
                  Alert.alert(
                    "Appointment Details",
                    `Doctor: ${a.doctorName || a.doctor?.name || "Doctor"}\nDepartment: ${
                      a.department?.name || a.department || "Department"
                    }\nDate: ${a.date || "-"}\nTime: ${a.time || "-"}\nStatus: ${String(
                      a.status || "pending"
                    ).toUpperCase()}`,
                    [{ text: "OK" }]
                  );
                }}
                android_ripple={{ color: "rgba(0,0,0,0.06)" }}
                style={({ pressed }) => ({
                  marginTop: 10,
                  padding: 14,
                  borderRadius: 16,
                  backgroundColor: "white",
                  borderWidth: 1,
                  borderColor: "#eee",
                  opacity: pressed ? 0.92 : 1,
                  overflow: "hidden",
                })}
              >
                <Text style={{ fontWeight: "900" }}>
                  {a.date || "-"} • {a.time || "-"}
                </Text>
                <Text style={{ marginTop: 4, color: "#666", fontWeight: "700" }} numberOfLines={1}>
                  {(a.doctorName || a.doctor?.name || "Doctor")} •{" "}
                  {(a.department?.name || a.department || "Department")} •{" "}
                  {String(a.status || "pending").toUpperCase()}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
