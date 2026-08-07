import React, { useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, FlatList } from "react-native";
import { dummyDepartments } from "../../data/dummyDepartments";

function DeptCard({ name, desc, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: "white",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "#eee",
        transform: [{ scale: pressed ? 0.99 : 1 }],
      })}
    >
      <Text style={{ fontSize: 16, fontWeight: "800" }}>{name}</Text>
      <Text style={{ marginTop: 6, opacity: 0.7 }}>{desc}</Text>

      <View style={{ marginTop: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ fontWeight: "700", opacity: 0.9 }}>View doctors</Text>
        <Text style={{ fontSize: 18, opacity: 0.5 }}>›</Text>
      </View>
    </Pressable>
  );
}

export default function DepartmentsScreen({ navigation }) {
  const [q, setQ] = useState("");

  const data = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return dummyDepartments;
    return dummyDepartments.filter((d) => d.name.toLowerCase().includes(query));
  }, [q]);

  return (
    <View style={{ flex: 1, backgroundColor: "#f7f7f7", padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: "800" }}>Departments</Text>
      <Text style={{ marginTop: 4, opacity: 0.7 }}>Choose a department to find doctors</Text>

      <View
        style={{
          marginTop: 12,
          backgroundColor: "white",
          borderRadius: 14,
          borderWidth: 1,
          borderColor: "#eee",
          paddingHorizontal: 12,
          paddingVertical: 10,
        }}
      >
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search departments..."
          style={{ fontSize: 15 }}
        />
      </View>

      <FlatList
        style={{ marginTop: 12 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        data={data}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => (
          <DeptCard
            name={item.name}
            desc={item.desc}
            onPress={() => navigation.navigate("Find Doctor", { department: item.name })}
          />
        )}
      />
    </View>
  );
}
