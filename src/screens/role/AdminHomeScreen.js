import React, { useContext, useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { AuthContext } from "../../context/AuthContext";
import { api } from "../../services/api";

function StatCard({ title, value, subtitle, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: "rgba(0,0,0,0.06)" }}
      style={({ pressed }) => ({
        flex: 1,
        backgroundColor: "rgba(255,255,255,0.95)",
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: "#eee",
        transform: [{ scale: pressed ? 0.99 : 1 }],
        opacity: pressed ? 0.98 : 1,
        overflow: "hidden",
      })}
    >
      <Text style={{ fontSize: 12, fontWeight: "900", color: "#666" }}>{title}</Text>
      <Text style={{ marginTop: 6, fontSize: 22, fontWeight: "900", color: "#111" }}>{value}</Text>
      {!!subtitle && (
        <Text style={{ marginTop: 4, fontSize: 12, fontWeight: "800", color: "#777" }}>
          {subtitle}
        </Text>
      )}
    </Pressable>
  );
}

function ActionCard({ title, subtitle, icon, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: "rgba(0,0,0,0.06)" }}
      style={({ pressed }) => ({
        flex: 1,
        backgroundColor: "rgba(255,255,255,0.95)",
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: "#eee",
        transform: [{ scale: pressed ? 0.99 : 1 }],
        opacity: pressed ? 0.98 : 1,
        overflow: "hidden",
        minHeight: 88,
      })}
    >
      <Text style={{ fontSize: 18 }}>{icon}</Text>
      <Text style={{ marginTop: 8, fontSize: 14, fontWeight: "900", color: "#111" }}>
        {title}
      </Text>
      <Text style={{ marginTop: 4, fontSize: 12, fontWeight: "700", color: "#777" }}>
        {subtitle}
      </Text>
    </Pressable>
  );
}

function StatusPill({ status }) {
  const s = String(status || "pending").toLowerCase();
  const style =
    s === "arrived"
      ? { bg: "#e9fbef", border: "#c8f3d6", text: "#167a34" }
      : s === "done" || s === "completed"
      ? { bg: "#eef2ff", border: "#dfe3ff", text: "#364fc7" }
      : s === "cancelled"
      ? { bg: "#fff1f0", border: "#ffd6d6", text: "#b42318" }
      : s === "upcoming" || s === "confirmed"
      ? { bg: "#eaf2ff", border: "#d7e7ff", text: "#1f6feb" }
      : { bg: "#fff7e6", border: "#ffe3b0", text: "#8a4b00" };

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

function toTime(v) {
  if (!v) return 0;
  if (typeof v === "number") return v;
  const t = Date.parse(v);
  return Number.isFinite(t) ? t : 0;
}

export default function AdminHomeScreen({ navigation }) {
  const { user, logout } = useContext(AuthContext);

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const todayKey = useMemo(() => formatTodayKey(), []);

  const fetchAppointments = useCallback(async () => {
    try {
      setError("");
      setLoading(true);

      const data = await api.get("/appointments/queue");
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

  const stats = useMemo(() => {
    const all = appointments || [];
    let total = all.length;
    let today = 0;
    let pending = 0;
    let upcoming = 0;
    let arrived = 0;
    let done = 0;
    let cancelled = 0;

    all.forEach((a) => {
      const s = String(a.status || "pending").toLowerCase();
      const dKey = normalizeDate(a.date);

      if (dKey === todayKey) today += 1;

      if (s === "cancelled") cancelled += 1;
      else if (s === "done" || s === "completed") done += 1;
      else if (s === "arrived" || s === "checked_in") arrived += 1;
      else if (s === "upcoming" || s === "confirmed") upcoming += 1;
      else pending += 1;
    });

    return { total, today, pending, upcoming, arrived, done, cancelled };
  }, [appointments, todayKey]);

  const recentActivity = useMemo(() => {
    const all = appointments || [];
    const timeOf = (a) => {
      const t1 = toTime(a?.statusUpdatedAt);
      if (t1) return t1;
      const t2 = toTime(a?.createdAt);
      if (t2) return t2;
      return 0;
    };
    return [...all].sort((a, b) => timeOf(b) - timeOf(a)).slice(0, 6);
  }, [appointments]);

  const adminName = String(user?.name || "Admin").trim() || "Admin";

  // ✅ Open Reports with filters
  const goReports = useCallback(
    (filter) => navigation.navigate("Reports", { filter }),
    [navigation]
  );

  const go = (routeName) => navigation.navigate(routeName);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>Loading dashboard…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View
          style={{
            marginBottom: 10,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: "900", color: "#111" }}>
              Admin Dashboard
            </Text>
            <Text style={{ marginTop: 6, color: "#666", fontWeight: "700" }}>
              Welcome, {adminName} • Today: {todayKey}
            </Text>

            {!!error && (
              <Text style={{ marginTop: 8, color: "red", fontWeight: "700" }}>
                {error}
              </Text>
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

        {/* Overview */}
        <Text style={{ marginTop: 6, marginBottom: 10, fontWeight: "900", color: "#111" }}>
          Overview
        </Text>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <StatCard
            title="TOTAL APPOINTMENTS"
            value={stats.total}
            subtitle="from database"
            onPress={() => goReports("all")}
          />
          <StatCard
            title="TODAY"
            value={stats.today}
            subtitle="appointments scheduled"
            onPress={() => goReports("today")}
          />
        </View>

        <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
          <StatCard title="PENDING" value={stats.pending} subtitle="needs action" onPress={() => goReports("pending")} />
          <StatCard title="UPCOMING" value={stats.upcoming} subtitle="confirmed" onPress={() => goReports("upcoming")} />
        </View>

        <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
          <StatCard title="ARRIVED" value={stats.arrived} subtitle="checked-in" onPress={() => goReports("arrived")} />
          <StatCard title="DONE" value={stats.done} subtitle="completed" onPress={() => goReports("done")} />
        </View>

        <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
          <StatCard title="CANCELLED" value={stats.cancelled} subtitle="marked cancelled" onPress={() => goReports("cancelled")} />
          <StatCard title="SYSTEM" value={"OK"} subtitle="api connected" onPress={() => go("Settings")} />
        </View>

        {/* Quick actions */}
        <Text style={{ marginTop: 18, marginBottom: 10, fontWeight: "900", color: "#111" }}>
          Quick Actions
        </Text>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <ActionCard icon="👥" title="Users" subtitle="doctors, reception, roles" onPress={() => go("Users")} />
          <ActionCard icon="📊" title="Reports" subtitle="stats & activity" onPress={() => goReports("all")} />
        </View>

        <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
          <ActionCard icon="⚙️" title="Settings" subtitle="departments, hours" onPress={() => go("Settings")} />
          <ActionCard icon="💬" title="Open Chat" subtitle="staff messages" onPress={() => navigation.navigate("Chat")} />
        </View>

        {/* Recent Activity */}
        <Text style={{ marginTop: 18, marginBottom: 10, fontWeight: "900", color: "#111" }}>
          Recent Activity
        </Text>

        {recentActivity.length === 0 ? (
          <View
            style={{
              backgroundColor: "rgba(255,255,255,0.95)",
              borderRadius: 16,
              padding: 14,
              borderWidth: 1,
              borderColor: "#eee",
            }}
          >
            <Text style={{ fontWeight: "900", color: "#111" }}>No activity yet</Text>
            <Text style={{ marginTop: 6, color: "#666", fontWeight: "700" }}>
              As appointments are created/updated, they’ll show here.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {recentActivity.map((a) => {
              const key = a?._id || a?.id;
              const patient = String(a?.patientName || a?.patient?.name || "Patient").trim() || "Patient";
              const doctor = String(a?.doctorName || a?.doctor?.name || "Doctor").trim() || "Doctor";
              const dept = String(a?.department?.name || a?.department || "Department").trim() || "Department";
              const date = String(a?.date || "-");
              const time = String(a?.time || "-");
              const status = String(a?.status || "pending");

              return (
                <Pressable
                  key={key}
                  onPress={() => goReports("all")}
                  android_ripple={{ color: "rgba(0,0,0,0.06)" }}
                  style={({ pressed }) => ({
                    backgroundColor: "rgba(255,255,255,0.95)",
                    borderRadius: 16,
                    padding: 14,
                    borderWidth: 1,
                    borderColor: "#eee",
                    opacity: pressed ? 0.96 : 1,
                    overflow: "hidden",
                  })}
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
                    <StatusPill status={status} />
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
