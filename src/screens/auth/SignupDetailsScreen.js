import React, { useContext, useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { AuthContext } from "../../context/AuthContext";

export default function SignupDetailsScreen({ navigation }) {
  const { signup } = useContext(AuthContext);

  const [name, setName] = useState("");
  const [id, setId] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Patient");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const validate = () => {
    const trimmedName = name.trim();
    const trimmedId = id.trim();
    const trimmedPhone = phone.trim();
    const trimmedEmail = email.trim();
    const trimmedPass = password.trim();

    if (!trimmedName || !trimmedId || !trimmedPhone || !trimmedEmail || !trimmedPass) {
      return "All fields are required";
    }
    if (!/^[A-Za-z ]+$/.test(trimmedName)) {
      return "Full name must contain alphabets only";
    }
    if (!/^[0-9]+$/.test(trimmedId)) {
      return "Hospital ID must be numeric";
    }
    if (!/^[0-9]+$/.test(trimmedPhone)) {
      return "Phone number must be numeric";
    }
    if (!/^[^@\s]+@[^@\s]+\.com$/.test(trimmedEmail)) {
      return "Email must end with .com";
    }
    if (trimmedPass.length < 6) {
      return "Password must be at least 6 characters";
    }
    return null;
  };

  const normalizeRole = (r) => String(r || "patient").trim().toLowerCase();

  const onSignup = async () => {
    setMsg("");

    const err = validate();
    if (err) {
      setMsg(err);
      return;
    }

    const res = await signup({
      id: id.trim(),
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      password: password.trim(),
      role: normalizeRole(role),
    });

    if (!res.ok) {
      setMsg(res.message);
      return;
    }

    // after signup, go back to login
    navigation.goBack();
  };

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: "center", gap: 10 }}>
      <Text style={{ fontSize: 24, fontWeight: "800" }}>Create account</Text>

      {msg ? <Text style={{ color: "crimson", fontWeight: "600" }}>{msg}</Text> : null}

      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Full name"
        style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 12, padding: 12 }}
      />

      <TextInput
        value={id}
        onChangeText={setId}
        placeholder="Hospital ID"
        keyboardType="numeric"
        style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 12, padding: 12 }}
      />

      <TextInput
        value={phone}
        onChangeText={setPhone}
        placeholder="Phone number"
        keyboardType="phone-pad"
        style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 12, padding: 12 }}
      />

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email (must end with .com)"
        autoCapitalize="none"
        keyboardType="email-address"
        style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 12, padding: 12 }}
      />

      <TextInput
        value={role}
        onChangeText={setRole}
        placeholder="Role (patient/doctor/admin/reception)"
        autoCapitalize="none"
        style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 12, padding: 12 }}
      />

      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password (min 6 chars)"
        secureTextEntry
        style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 12, padding: 12 }}
      />

      <Pressable
        onPress={onSignup}
        android_ripple={{ color: "rgba(255,255,255,0.25)" }}
        style={({ pressed }) => ({
          backgroundColor: "black",
          padding: 14,
          borderRadius: 12,
          alignItems: "center",
          marginTop: 6,
          opacity: pressed ? 0.92 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        })}
      >
        <Text style={{ color: "white", fontWeight: "700" }}>Create account</Text>
      </Pressable>
    </View>
  );
}
