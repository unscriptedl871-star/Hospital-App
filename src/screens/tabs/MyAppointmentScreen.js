import React, { useContext, useMemo, useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, Alert } from "react-native";
import { AuthContext } from "../../context/AuthContext";
import { appointmentsApi } from "../../services/api";

import StatusPill from "../../components/common/StatusPill";
import SoftButton from "../../components/common/SoftButton";
import { normalizeDate, safeText } from "../../utils/helpers";

function SectionTitle({ title, count }) {
  return (
    <View style={{ marginTop: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
      <Text style={{ fontSize: 14, fontWeight: "900", color: "#111" }}>{title}</Text>
      <Text style={{ fontSize: 12, fontWeight: "900", color: "#666" }}>{count}</Text>
    </View>
  );
}

function CardWrap({ children }) {
  return (
    <View
      style={{
        marginTop: 10,
        padding: 12,
        borderWidth: 1,
        borderColor: "#eee",
        borderRadius: 14,
        backgroundColor: "white",
      }}
    >
      {children}
    </View>
  );
}

export default function MyAppointmentScreen() {
  const { user } = useContext(AuthContext);
  const role = String(user?.role || "patient").trim().toLowerCase();

  const isReception = role === "reception" || role === "receptionist";
  const isDoctor = role === "doctor";
  const isPatient = role === "patient";
  const isAdmin = role === "admin";

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Reception/Admin view mode
  const [queueMode, setQueueMode] = useState("active"); // active | all

  const todayKey = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);

      let res;
      if (isDoctor) {
        const r = await appointmentsApi.today(); // { date, items }
        res = r?.items || [];
      } else if (isReception || isAdmin) {
        res = await appointmentsApi.queue(); // []
      } else {
        res = await appointmentsApi.myAppointments(); // []
      }

      setAppointments(Array.isArray(res) ? res : []);
    } catch (e) {
      Alert.alert("Error", e?.message || "Failed to load appointments");
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [isDoctor, isReception, isAdmin]);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (id, status) => {
    try {
      await appointmentsApi.updateStatus(id, status);
      setAppointments((prev) =>
        prev.map((a) => (String(a._id || a.id) === String(id) ? { ...a, status } : a))
      );
    } catch (e) {
      Alert.alert("Error", e?.message || "Failed to update status");
    }
  };

  const cancel = async (id) => {
    if (isDoctor) {
      Alert.alert("Not allowed", "Doctors cannot cancel appointments.");
      return;
    }

    Alert.alert("Cancel Appointment", "Are you sure you want to cancel this appointment?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: async () => {
          try {
            await appointmentsApi.cancel(id);
            setAppointments((prev) =>
              prev.map((a) =>
                String(a._id || a.id) === String(id) ? { ...a, status: "cancelled" } : a
              )
            );
          } catch (e) {
            Alert.alert("Error", e?.message || "Failed to cancel appointment");
          }
        },
      },
    ]);
  };

  const title = isDoctor
    ? "Today"
    : isReception || isAdmin
    ? "Appointments Queue"
    : "My Appointments";

  // -------- Doctor: group by status (Waiting / Arrived / Done) ----------
  const doctorToday = useMemo(() => {
    if (!isDoctor) return [];

    const list = (appointments || [])
      .filter((a) => normalizeDate(a.date) === todayKey)
      .filter((a) => String(a.status || "").toLowerCase() !== "cancelled")
      .sort((a, b) => String(a.time || "").localeCompare(String(b.time || "")));

    return list;
  }, [appointments, isDoctor, todayKey]);

  const doctorGroups = useMemo(() => {
    if (!isDoctor) return { waiting: [], arrived: [], done: [] };

    const waiting = [];
    const arrived = [];
    const done = [];

    for (const a of doctorToday) {
      const s = String(a.status || "pending").toLowerCase();
      if (s === "done" || s === "completed") done.push(a);
      else if (s === "arrived" || s === "checked_in") arrived.push(a);
      else waiting.push(a); // pending/upcoming etc.
    }

    return { waiting, arrived, done };
  }, [doctorToday, isDoctor]);

  const renderDoctorRow = (a) => {
    const id = a._id || a.id;
    const status = String(a.status || "pending").toLowerCase();

    const canArrive = status === "pending" || status === "upcoming" || status === "confirmed";
    const canDone = status === "arrived" || status === "checked_in";

    return (
      <CardWrap key={id}>
        <Text style={{ fontWeight: "900", color: "#111" }}>
          {safeText(a.time)} • {safeText(a.patientName || a.patient?.name || "Patient")}
        </Text>

        <Text style={{ marginTop: 4, opacity: 0.75 }} numberOfLines={1}>
          {safeText(a.department?.name || a.department || "Department")}
        </Text>

        <View style={{ marginTop: 8 }}>
          <StatusPill status={a.status} />
        </View>

        <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
          {canArrive && (
            <SoftButton text="Arrived" onPress={() => updateStatus(id, "arrived")} />
          )}
          {canDone && (
            <SoftButton text="Done" onPress={() => updateStatus(id, "done")} />
          )}
          {!canArrive && !canDone && <SoftButton text="No Action" disabled />}
        </View>
      </CardWrap>
    );
  };

  // -------- Reception/Admin: queue filtering ----------
  const queueList = useMemo(() => {
    if (!(isReception || isAdmin)) return [];

    const list = [...(appointments || [])].sort((a, b) => {
      const da = String(a.date || "");
      const db = String(b.date || "");
      if (da !== db) return db.localeCompare(da);
      return String(a.time || "").localeCompare(String(b.time || ""));
    });

    if (queueMode === "all") return list;

    // active mode => pending + upcoming only (not arrived/done/cancelled)
    return list.filter((a) => {
      const s = String(a.status || "pending").toLowerCase();
      return s === "pending" || s === "upcoming" || s === "confirmed";
    });
  }, [appointments, isReception, isAdmin, queueMode]);

  const renderQueueOrPatientRow = (a) => {
    const id = a._id || a.id;
    const status = String(a.status || "pending").toLowerCase();

    const leftTitle =
      isReception || isAdmin
        ? `${safeText(a.patientName || a.patient?.name || "Patient")}`
        : `${safeText(a.doctorName || a.doctor?.name || "Doctor")}`;

    const subtitle = `${safeText(a.department?.name || a.department || "Department")} • ${safeText(
      a.date
    )} • ${safeText(a.time)}`;

    const canConfirm = (isReception || isAdmin) && status === "pending";
    const canArrive =
      (isReception || isAdmin) && (status === "pending" || status === "upcoming" || status === "confirmed");

    const canCancel =
      (isPatient || isReception || isAdmin) &&
      status !== "cancelled" &&
      status !== "done" &&
      status !== "completed";

    return (
      <CardWrap key={id}>
        <Text style={{ fontWeight: "900", color: "#111" }}>{leftTitle}</Text>
        <Text style={{ marginTop: 4, opacity: 0.75 }} numberOfLines={2}>
          {subtitle}
        </Text>

        <View style={{ marginTop: 8 }}>
          <StatusPill status={a.status} />
        </View>

        <View style={{ flexDirection: "row", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
          {canConfirm && <SoftButton text="Confirm" onPress={() => updateStatus(id, "upcoming")} />}
          {canArrive && <SoftButton text="Arrived" onPress={() => updateStatus(id, "arrived")} />}
          {canCancel && <SoftButton danger text="Cancel" onPress={() => cancel(id)} />}
          {!canConfirm && !canArrive && !canCancel && <SoftButton text="No Action" disabled />}
        </View>
      </CardWrap>
    );
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: "900", color: "#111" }}>{title}</Text>
          {(isReception || isAdmin) && (
            <Text style={{ marginTop: 4, color: "#666", fontWeight: "700" }}>
              View: {queueMode === "active" ? "Active (Pending/Upcoming)" : "All"}
            </Text>
          )}
        </View>

        <SoftButton text={loading ? "Loading..." : "Refresh"} onPress={load} disabled={loading} />
      </View>

      {/* Reception/Admin toggle */}
      {(isReception || isAdmin) && (
        <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
          <SoftButton
            text={queueMode === "active" ? "Active ✓" : "Active"}
            onPress={() => setQueueMode("active")}
            disabled={queueMode === "active"}
          />
          <SoftButton
            text={queueMode === "all" ? "All ✓" : "All"}
            onPress={() => setQueueMode("all")}
            disabled={queueMode === "all"}
          />
        </View>
      )}

      {/* Doctor view */}
      {isDoctor ? (
        doctorToday.length === 0 ? (
          <Text style={{ marginTop: 12, opacity: 0.75 }}>No appointments for today.</Text>
        ) : (
          <>
            <SectionTitle title="Waiting" count={doctorGroups.waiting.length} />
            {doctorGroups.waiting.length === 0 ? (
              <Text style={{ marginTop: 8, opacity: 0.7 }}>No waiting patients.</Text>
            ) : (
              doctorGroups.waiting.map(renderDoctorRow)
            )}

            <SectionTitle title="Arrived" count={doctorGroups.arrived.length} />
            {doctorGroups.arrived.length === 0 ? (
              <Text style={{ marginTop: 8, opacity: 0.7 }}>No arrived patients yet.</Text>
            ) : (
              doctorGroups.arrived.map(renderDoctorRow)
            )}

            <SectionTitle title="Done" count={doctorGroups.done.length} />
            {doctorGroups.done.length === 0 ? (
              <Text style={{ marginTop: 8, opacity: 0.7 }}>No completed appointments yet.</Text>
            ) : (
              doctorGroups.done.map(renderDoctorRow)
            )}
          </>
        )
      ) : isReception || isAdmin ? (
        queueList.length === 0 ? (
          <Text style={{ marginTop: 12, opacity: 0.75 }}>No appointments found.</Text>
        ) : (
          queueList.map(renderQueueOrPatientRow)
        )
      ) : appointments.length === 0 ? (
        <Text style={{ marginTop: 12, opacity: 0.75 }}>No appointments found.</Text>
      ) : (
        appointments.map(renderQueueOrPatientRow)
      )}
    </ScrollView>
  );
}
