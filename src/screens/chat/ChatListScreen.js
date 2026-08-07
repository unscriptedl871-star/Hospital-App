import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from "react-native";

const dummyChats = [
  { id: "1", name: "Dr. Ahmed", last: "Please share your reports", time: "2m", unread: 2, online: true },
  { id: "2", name: "Reception", last: "Your appointment is confirmed", time: "1h", unread: 0, online: false },
  { id: "3", name: "Dr. Sara", last: "I reviewed your lab results.", time: "Yesterday", unread: 1, online: true },
];

function initials(name = "") {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export default function ChatListScreen({ navigation }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return dummyChats;
    return dummyChats.filter((c) => {
      return (
        c.name.toLowerCase().includes(q) ||
        (c.last ?? "").toLowerCase().includes(q)
      );
    });
  }, [query]);

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchWrap}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search chats…"
          placeholderTextColor="#777"
          style={styles.search}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={filtered.length === 0 ? { flex: 1 } : undefined}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No chats found</Text>
            <Text style={styles.emptySub}>Try a different search.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.row}
            onPress={() =>
              navigation.navigate("ChatRoom", { chatId: item.id, name: item.name })
            }
          >
            {/* Avatar */}
            <View style={styles.avatarWrap}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials(item.name)}</Text>
              </View>

              {/* Online dot */}
              {item.online ? <View style={styles.onlineDot} /> : null}
            </View>

            {/* Text */}
            <View style={{ flex: 1 }}>
              <View style={styles.topLine}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.time}>{item.time}</Text>
              </View>

              <View style={styles.bottomLine}>
                <Text style={styles.last} numberOfLines={1}>
                  {item.last}
                </Text>

                {item.unread > 0 ? (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>
                      {item.unread > 9 ? "9+" : String(item.unread)}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 14, backgroundColor: "#fff" },

  searchWrap: {
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 14,
    backgroundColor: "#f7f7f7",
  },
  search: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },

  sep: { height: 1, backgroundColor: "#f0f0f0" },

  avatarWrap: { marginRight: 12 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e6eefc",
  },
  avatarText: { fontWeight: "800", fontSize: 14, color: "#163b8f" },
  onlineDot: {
    position: "absolute",
    right: 2,
    bottom: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#22c55e",
    borderWidth: 2,
    borderColor: "#fff",
  },

  topLine: { flexDirection: "row", alignItems: "center", gap: 10 },
  name: { flex: 1, fontWeight: "800", fontSize: 15, color: "#111" },
  time: { fontSize: 12, color: "#777" },

  bottomLine: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
    gap: 10,
  },
  last: { flex: 1, color: "#666" },

  unreadBadge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: "#1f6feb",
    alignItems: "center",
    justifyContent: "center",
  },
  unreadText: { color: "#fff", fontWeight: "900", fontSize: 12 },

  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  emptyTitle: { fontSize: 16, fontWeight: "900", color: "#111" },
  emptySub: { marginTop: 6, color: "#666" },
});
