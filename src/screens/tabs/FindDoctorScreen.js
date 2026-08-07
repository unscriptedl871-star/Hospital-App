import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  ImageBackground,
} from "react-native";
import { api } from "../../services/api";

function DoctorCard({ doc, onBook }) {
  return (
    <View
      style={{
        backgroundColor: "rgba(255,255,255,0.95)",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "#eee",
      }}
    >
      <Text style={{ fontSize: 16, fontWeight: "800" }}>{doc.name}</Text>
      <Text style={{ marginTop: 6, opacity: 0.7 }}>{doc.department}</Text>

      <View style={{ flexDirection: "row", gap: 12, marginTop: 10 }}>
        <Text style={{ opacity: 0.75 }}>⭐ {doc.rating}</Text>
        <Text style={{ opacity: 0.75 }}>🧠 {doc.experience} yrs</Text>
        <Text style={{ opacity: 0.75 }}>💳 Rs {doc.fee}</Text>
      </View>

      <View
        style={{
          marginTop: 10,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text style={{ opacity: 0.7 }}>🕒 {doc.availability}</Text>

        <Pressable
          onPress={onBook}
          style={{
            backgroundColor: "black",
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: "white", fontWeight: "700" }}>Book</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function FindDoctorScreen({ navigation, route }) {
  const selectedDept = route?.params?.department || "";
  const [q, setQ] = useState("");
  const [dept, setDept] = useState(selectedDept);
  const [doctors, setDoctors] = useState([]);

  // ✅ FETCH DOCTORS FROM BACKEND (REAL MongoDB IDs)
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const list = await api.get("/users/doctors");

        if (!mounted) return;

        setDoctors(
          list.map((d) => ({
            ...d,
            id: d.id || d._id, // ensure id exists for navigation
            department: d.department || "General",
            rating: d.rating || 4.5,
            experience: d.experience || 5,
            fee: d.fee || 1500,
            availability: d.availability || "09:00 AM - 05:00 PM",
          }))
        );
      } catch (e) {
        console.log("❌ Failed to load doctors", e?.message);
        setDoctors([]);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    const dep = dept.trim().toLowerCase();

    return doctors.filter((d) => {
      const matchesSearch =
        !query ||
        d.name.toLowerCase().includes(query) ||
        d.department.toLowerCase().includes(query);

      const matchesDept = !dep || d.department.toLowerCase() === dep;
      return matchesSearch && matchesDept;
    });
  }, [q, dept, doctors]);

  return (
    <ImageBackground
      source={require("../../../assets/finddoctor.jpg")}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.25)", padding: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: "white" }}>
          Find a Doctor
        </Text>

        <View
          style={{
            marginTop: 12,
            backgroundColor: "white",
            borderRadius: 14,
            padding: 10,
          }}
        >
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search doctor..."
          />
        </View>

        <FlatList
          style={{ marginTop: 12 }}
          data={list}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item }) => (
            <DoctorCard
              doc={item}
              onBook={() =>
                navigation.navigate("Tabs", {
                  screen: "Book",
                  params: { doctorId: item.id },
                })
              }
            />
          )}
        />
      </View>
    </ImageBackground>
  );
}
