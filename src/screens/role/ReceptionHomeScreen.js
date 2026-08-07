import React, { useContext, useMemo, useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, ImageBackground, TextInput, Alert } from "react-native";
import { AuthContext } from "../../context/AuthContext";
import { appointmentsApi } from "../../services/api";

function Card({ title, subtitle, icon, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: "rgba(0,0,0,0.08)" }}
      style={({ pressed }) => ({
        flex: 1,
        backgroundColor: "rgba(255,255,255,0.95)",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "#eee",
        transform: [{ scale: pressed ? 0.98 : 1 }],
        opacity: pressed ? 0.95 : 1,
        overflow: "hidden",
      })}
    >
      <Text style={{ fontSize: 22 }}>{icon}</Text>
      <Text style={{ marginTop: 10, fontSize: 16, fontWeight: "900" }}>{title}</Text>
      <Text style={{ marginTop: 4, opacity: 0.7 }}>{subtitle}</Text>
    </Pressable>
  );
}

function StatBox({ label, value }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "rgba(255,255,255,0.95)",
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: "#eee",
      }}
    >
      <Text style={{ opacity: 0.7 }}>{label}</Text>
      <Text style={{ fontSize: 22, fontWeight: "900", marginTop: 6 }}>{value}</Text>
    </View>
  );
}

function QueueRow({ item, onConfirm, onArrived, onCancel, onChat }) {
  return (
    <View
      style={{
        backgroundColor: "rgba(255,255,255,0.95)",
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: "#eee",
        marginTop: 10,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: "900", fontSize: 15 }} numberOfLines={1}>
            {item.patientName}
          </Text>
          <Text style={{ marginTop: 4, opacity: 0.75 }} numberOfLines={1}>
            {item.doctorName} • {item.department}
          </Text>
          <Text style={{ marginTop: 6, fontWeight: "800" }}>
            📅 {item.date}  ⏰ {item.time}  •  {String(item.status).toUpperCase()}
          </Text>
        </View>

        <Pressable
          onPress={onChat}
          android_ripple={{ color: "rgba(0,0,0,0.06)" }}
          style={({ pressed }) => ({
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 999,
            backgroundColor: "white",
            borderWidth: 1,
            borderColor: "#eee",
            opacity: pressed ? 0.92 : 1,
            overflow: "hidden",
            alignSelf: "flex-start",
          })}
        >
          <Text style={{ fontWeight: "900" }}>💬 Chat</Text>
        </Pressable>
      </View>

      <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
        <Pressable
          onPress={onConfirm}
          android_ripple={{ color: "rgba(0,0,0,0.06)" }}
          style={({ pressed }) => ({
            flex: 1,
            backgroundColor: "white",
            padding: 12,
            borderRadius: 14,
            alignItems: "center",
            borderWidth: 1,
            borderColor: "#eee",
            opacity: pressed ? 0.92 : 1,
            overflow: "hidden",
          })}
        >
          <Text style={{ fontWeight: "900" }}>Confirm</Text>
        </Pressable>

        <Pressable
          onPress={onArrived}
          android_ripple={{ color: "rgba(0,0,0,0.06)" }}
          style={({ pressed }) => ({
            flex: 1,
            backgroundColor: "white",
            padding: 12,
            borderRadius: 14,
            alignItems: "center",
            borderWidth: 1,
            borderColor: "#eee",
            opacity: pressed ? 0.92 : 1,
            overflow: "hidden",
          })}
        >
          <Text style={{ fontWeight: "900" }}>Arrived</Text>
        </Pressable>

        <Pressable
          onPress={onCancel}
          android_ripple={{ color: "rgba(0,0,0,0.06)" }}
          style={({ pressed }) => ({
            flex: 1,
            backgroundColor: "white",
            padding: 12,
            borderRadius: 14,
            alignItems: "center",
            borderWidth: 1,
            borderColor: "#eee",
            opacity: pressed ? 0.92 : 1,
            overflow: "hidden",
          })}
        >
          <Text style={{ fontWeight: "900" }}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function ReceptionHomeScreen({ navigation }) {
  const { user, logout } = useContext(AuthContext);

  const [appointments, setAppointments] = useState([]);
  const [search, setSearch] = useState("");
  const q = search.trim().toLowerCase();

  // ✅ Load queue from backend
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const list = await appointmentsApi.queue(); // backend returns array
        if (!mounted) return;
        setAppointments(list || []);
      } catch (e) {
        if (!mounted) return;
        setAppointments([]);
        Alert.alert("Error", e?.message || "Failed to load queue");
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!q) return appointments;
    return appointments.filter((a) => {
      const p = String(a.patientName || a.patient || "").toLowerCase();
      const d = String(a.doctorName || "").toLowerCase();
      const dep = String(a.department || "").toLowerCase();
      return p.includes(q) || d.includes(q) || dep.includes(q);
    });
  }, [appointments, q]);

  const pending = useMemo(
    () => filtered.filter((a) => (a.status || "pending") === "pending"),
    [filtered]
  );
  const upcoming = useMemo(
    () => filtered.filter((a) => (a.status || "upcoming") === "upcoming"),
    [filtered]
  );
  const checkedIn = useMemo(
    () => filtered.filter((a) => (a.status || "") === "arrived"),
    [filtered]
  );

  const queueList = useMemo(() => [...pending, ...upcoming].slice(0, 8), [pending, upcoming]);

  const idOf = (a) => a._id || a.id;

  const confirmAppt = async (a) => {
    try {
      const id = idOf(a);
      await appointmentsApi.updateStatus(id, "upcoming");
      setAppointments((prev) => prev.map((x) => (idOf(x) === id ? { ...x, status: "upcoming" } : x)));
    } catch (e) {
      Alert.alert("Error", e?.message || "Failed to confirm");
    }
  };

  const arrivedAppt = async (a) => {
    try {
      const id = idOf(a);
      await appointmentsApi.updateStatus(id, "arrived");
      setAppointments((prev) => prev.map((x) => (idOf(x) === id ? { ...x, status: "arrived" } : x)));
    } catch (e) {
      Alert.alert("Error", e?.message || "Failed to mark arrived");
    }
  };

  const cancelAppt = async (a) => {
    try {
      const id = idOf(a);
      await appointmentsApi.cancel(id);
      setAppointments((prev) => prev.map((x) => (idOf(x) === id ? { ...x, status: "cancelled" } : x)));
    } catch (e) {
      Alert.alert("Error", e?.message || "Failed to cancel");
    }
  };

  return (
    <ImageBackground source={require("../../../assets/home.jpg")} style={{ flex: 1 }} resizeMode="cover">
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.25)" }}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 28 }}>
          {/* Header */}
          <View style={{ marginTop: 6, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={{ fontSize: 22, fontWeight: "900", color: "white" }}>
                Reception 👋
              </Text>
              <Text style={{ marginTop: 4, opacity: 0.85, color: "white" }}>
                {user?.name ? user.name : "Dashboard"} • Queue & scheduling
              </Text>
            </View>

            <Pressable
              onPress={logout}
              android_ripple={{ color: "rgba(255,255,255,0.25)" }}
              style={({ pressed }) => ({
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: 999,
                backgroundColor: "rgba(0,0,0,0.8)",
                transform: [{ scale: pressed ? 0.97 : 1 }],
                overflow: "hidden",
              })}
            >
              <Text style={{ color: "white", fontWeight: "900" }}>Logout</Text>
            </Pressable>
          </View>

          {/* Search */}
          <View style={{ marginTop: 14 }}>
            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.95)",
                borderRadius: 14,
                borderWidth: 1,
                borderColor: "#eee",
                paddingHorizontal: 12,
                paddingVertical: 10,
              }}
            >
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search patient / doctor / department..."
                style={{ fontSize: 15 }}
              />
            </View>
          </View>

          {/* Queue stats */}
          <View style={{ flexDirection: "row", gap: 12, marginTop: 14 }}>
            <StatBox label="Pending" value={pending.length} />
            <StatBox label="Upcoming" value={upcoming.length} />
            <StatBox label="Checked-in" value={checkedIn.length} />
          </View>

          {/* Quick actions */}
          <Text style={{ marginTop: 18, marginBottom: 10, fontSize: 16, fontWeight: "900", color: "white" }}>
            Quick Actions
          </Text>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <Card icon="🗂️" title="Appointments" subtitle="View full queue" onPress={() => navigation.navigate("Queue")} />
            <Card icon="💬" title="Chat" subtitle="Patients & doctors" onPress={() => navigation.navigate("Chat")} />
          </View>

          <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
            <Card icon="✅" title="Mark Status" subtitle="Confirm / arrived" onPress={() => navigation.navigate("Queue")} />
            <Card icon="💳" title="Payments" subtitle="Coming soon" onPress={() => navigation.navigate("Payments")} />
          </View>

          {/* Today queue */}
          <View style={{ marginTop: 14 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontSize: 16, fontWeight: "900", color: "white" }}>Today’s Queue</Text>

              <Pressable
                onPress={() => navigation.navigate("Queue")}
                android_ripple={{ color: "rgba(255,255,255,0.15)" }}
                style={({ pressed }) => ({
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  borderRadius: 999,
                  opacity: pressed ? 0.92 : 1,
                  overflow: "hidden",
                })}
              >
                <Text style={{ fontWeight: "900", color: "white" }}>View all</Text>
              </Pressable>
            </View>

            {queueList.length === 0 ? (
              <View
                style={{
                  marginTop: 10,
                  backgroundColor: "rgba(255,255,255,0.95)",
                  borderRadius: 18,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: "#eee",
                }}
              >
                <Text style={{ fontWeight: "900" }}>No items in queue</Text>
                <Text style={{ marginTop: 6, opacity: 0.7 }}>
                  When patients book appointments, they will appear here.
                </Text>
              </View>
            ) : (
              <View style={{ marginTop: 10 }}>
                {queueList.map((a) => (
                  <QueueRow
                    key={idOf(a)}
                    item={{
                      id: idOf(a),
                      patientName: a.patientName || a.patient || "Patient",
                      doctorName: a.doctorName || "Doctor",
                      department: a.department || "Department",
                      date: a.date || "-",
                      time: a.time || "-",
                      status: a.status || "pending",
                    }}
                    onChat={() => navigation.navigate("Chat")}
                    onConfirm={() => confirmAppt(a)}
                    onArrived={() => arrivedAppt(a)}
                    onCancel={() => cancelAppt(a)}
                  />
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </ImageBackground>
  );
}
