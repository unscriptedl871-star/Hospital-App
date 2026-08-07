import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { AuthContext } from "../../context/AuthContext";
import { api } from "../../services/api"; // ✅ named export

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

function PatientRow({ name, subtitle, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: "rgba(0,0,0,0.06)" }}
      style={({ pressed }) => ({
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 14,
        backgroundColor: "white",
        borderWidth: 1,
        borderColor: "#eee",
        opacity: pressed ? 0.92 : 1,
        overflow: "hidden",
        marginTop: 10,
      })}
    >
      <Text style={{ fontWeight: "900" }}>{name}</Text>
      <Text style={{ marginTop: 4, opacity: 0.75 }} numberOfLines={1}>
        {subtitle}
      </Text>
    </Pressable>
  );
}

export default function DoctorHomeScreen({ navigation }) {
  const { user, logout } = useContext(AuthContext);

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const doctorName = String(user?.name || "").trim().toLowerCase();

  const normalizeDate = (v) => {
    const s = String(v || "").trim();
    if (!s) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

    const m = s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
    if (m) {
      const dd = String(m[1]).padStart(2, "0");
      const mm = String(m[2]).padStart(2, "0");
      const yyyy = m[3];
      return `${yyyy}-${mm}-${dd}`;
    }
    return s;
  };

  const todayKey = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const doctorMatches = (apptDoctorName) => {
    const a = String(apptDoctorName || "").toLowerCase();
    if (!doctorName) return true;
    if (!a) return true;
    return a.includes(doctorName) || doctorName.includes(a);
  };

 const fetchAppointments = useCallback(async () => {
  try {
    setError("");
    setLoading(true);

    const data = await api.get("/appointments/today");
    const list = Array.isArray(data?.items) ? data.items : [];

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

  const todaysAppts = useMemo(() => {
    return (appointments || [])
      .filter((a) => {
        const status = String(a.status || "").toLowerCase();
        if (status === "cancelled") return false;

        const dateKey = normalizeDate(a.date);
        const isToday = dateKey === todayKey;

        const matchesByDoctorId =
          a?.doctor?._id && user?._id ? String(a.doctor._id) === String(user._id) : false;

        const matchesByEmail =
          a?.doctorEmail && user?.email
            ? String(a.doctorEmail).toLowerCase() === String(user.email).toLowerCase()
            : false;

        const matchesByName = doctorMatches(a?.doctorName || a?.doctor?.name);

        return isToday && (matchesByDoctorId || matchesByEmail || matchesByName);
      })
      .sort((a, b) => String(a.time || "").localeCompare(String(b.time || "")));
  }, [appointments, todayKey, user?._id, user?.email]);

  const patients = useMemo(() => {
    const seen = new Set();
    const out = [];
    for (const a of todaysAppts) {
      const p = String(a.patientName || a.patient?.name || a.patient || "Patient").trim();
      if (!p || seen.has(p)) continue;
      seen.add(p);
      out.push({
        name: p,
        last: `${a.time || "-"} • ${a.department?.name || a.department || "Department"}`,
        apptId: a._id,
      });
    }
    return out;
  }, [todaysAppts]);

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
        contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View
          style={{
            marginTop: 6,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 22, fontWeight: "900", color: "#111" }}>
              Doctor 👨‍⚕️
            </Text>
            <Text style={{ marginTop: 4, color: "#666", fontWeight: "700" }}>
              {user?.name ? `${user.name} • ` : ""}Today: {todaysAppts.length} appointments
            </Text>
            {!!error && (
              <Text style={{ marginTop: 6, color: "red", fontWeight: "700" }}>{error}</Text>
            )}
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

        <Text style={{ marginTop: 16, fontSize: 16, fontWeight: "900" }}>Quick Actions</Text>

        <View style={{ flexDirection: "row", gap: 12, marginTop: 10 }}>
          <Card
            icon="📅"
            title="Today"
            subtitle="See today’s schedule"
            onPress={() => navigation.navigate("Tabs", { screen: "Today" })}
          />
          <Card
            icon="💬"
            title="Chat"
            subtitle="Talk to patients"
            onPress={() => navigation.navigate("Tabs", { screen: "Chat" })}
          />
        </View>

        <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
          <Card
            icon="🧾"
            title="Prescriptions"
            subtitle="Dummy"
            onPress={() => navigation.navigate("Tabs", { screen: "Prescriptions" })}
          />
          <Card icon="👥" title="Patients" subtitle={`${patients.length} today`} onPress={() => {}} />
        </View>

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
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontSize: 16, fontWeight: "900" }}>Today’s Appointments</Text>

            <Pressable
              onPress={() => navigation.navigate("Tabs", { screen: "Today" })}
              android_ripple={{ color: "rgba(0,0,0,0.06)" }}
              style={({ pressed }) => ({
                paddingHorizontal: 10,
                paddingVertical: 8,
                borderRadius: 999,
                opacity: pressed ? 0.92 : 1,
                overflow: "hidden",
              })}
            >
              <Text style={{ fontWeight: "900" }}>Open</Text>
            </Pressable>
          </View>

          {todaysAppts.length === 0 ? (
            <Text style={{ marginTop: 10, opacity: 0.75 }}>No appointments scheduled for today.</Text>
          ) : (
            <View style={{ marginTop: 10 }}>
              {todaysAppts.slice(0, 4).map((a) => {
                const patient = a.patientName || a.patient?.name || a.patient || "Patient";
                return (
                  <PatientRow
                    key={a._id}
                    name={`${a.time || "-"} • ${patient}`}
                    subtitle={`${a.department?.name || a.department || "Department"} • ${String(
                      a.status || "upcoming"
                    )}`}
                    onPress={() =>
                      navigation.navigate("PatientProfile", {
                        patientName: patient,
                        patientId: a?.patient?._id || null,
                      })
                    }
                  />
                );
              })}
            </View>
          )}
        </View>

        <Text style={{ marginTop: 18, fontSize: 16, fontWeight: "900" }}>Patient List (Today)</Text>

        {patients.length === 0 ? (
          <Text style={{ marginTop: 8, opacity: 0.75 }}>No patients for today.</Text>
        ) : (
          <View style={{ marginTop: 4 }}>
            {patients.map((p) => (
              <PatientRow
                key={p.name}
                name={p.name}
                subtitle={p.last}
                onPress={() => navigation.navigate("PatientProfile", { patientName: p.name })}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
