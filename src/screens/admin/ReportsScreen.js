import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, RefreshControl } from "react-native";
import { api } from "../../services/api";
import StatusPill from "../../components/common/StatusPill";

function formatTodayKey() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function normalizeDate(v) {
  const s = String(v || "").trim();
  if (!s) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  const m = s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if (m) {
    const dd = String(Number(m[1])).padStart(2, "0");
    const mm = String(Number(m[2])).padStart(2, "0");
    const yyyy = m[3];
    return `${yyyy}-${mm}-${dd}`;
  }
  return s;
}

export default function ReportsScreen({ route }) {
  const filter = String(route?.params?.filter || "all").trim().toLowerCase();
  const todayKey = useMemo(() => formatTodayKey(), []);

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchAll = useCallback(async () => {
    try {
      setError("");
      setLoading(true);
      const data = await api.get("/appointments/queue"); // admin access
      setAppointments(Array.isArray(data) ? data : []);
    } catch (e) {
      setAppointments([]);
      setError(e?.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  }, [fetchAll]);

  const title = useMemo(() => {
    if (filter === "today") return "Today’s Appointments";
    if (filter === "pending") return "Pending Appointments";
    if (filter === "upcoming") return "Upcoming Appointments";
    if (filter === "arrived") return "Arrived Appointments";
    if (filter === "done") return "Done Appointments";
    if (filter === "cancelled") return "Cancelled Appointments";
    return "Reports";
  }, [filter]);

  const filtered = useMemo(() => {
    const list = appointments || [];
    if (filter === "all") return list;

    if (filter === "today") {
      return list.filter((a) => normalizeDate(a.date) === todayKey);
    }

    return list.filter((a) => String(a.status || "pending").toLowerCase() === filter);
  }, [appointments, filter, todayKey]);

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
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={{ fontSize: 20, fontWeight: "900", color: "#111" }}>{title}</Text>
        {!!error && <Text style={{ marginTop: 8, color: "red", fontWeight: "700" }}>{error}</Text>}
        <Text style={{ marginTop: 8, color: "#666", fontWeight: "700" }}>
          Showing: {filtered.length} items
        </Text>

        {filtered.length === 0 ? (
          <Text style={{ marginTop: 14, opacity: 0.75 }}>No appointments found.</Text>
        ) : (
          filtered.map((a) => {
            const id = a._id || a.id;
            const patient = String(a.patientName || a.patient?.name || "Patient");
            const doctor = String(a.doctorName || a.doctor?.name || "Doctor");
            const dept = String(a.department?.name || a.department || "Department");
            const date = String(a.date || "-");
            const time = String(a.time || "-");

            return (
              <View
                key={id}
                style={{
                  marginTop: 12,
                  padding: 14,
                  borderRadius: 16,
                  backgroundColor: "white",
                  borderWidth: 1,
                  borderColor: "#eee",
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "900", color: "#111" }} numberOfLines={1}>
                      {patient} • {time}
                    </Text>
                    <Text style={{ marginTop: 4, color: "#666", fontWeight: "700" }} numberOfLines={1}>
                      {doctor} • {dept}
                    </Text>
                    <Text style={{ marginTop: 8, fontWeight: "800", color: "#111" }}>
                      📅 {date}  ⏰ {time}
                    </Text>
                  </View>
                  <StatusPill status={a.status} />
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
