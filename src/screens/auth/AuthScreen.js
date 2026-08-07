import React, { useContext, useEffect, useRef, useState } from "react";
import { View, Text, TextInput, Pressable, ImageBackground, Animated } from "react-native";
import { BlurView } from "expo-blur";
import { AuthContext } from "../../context/AuthContext";

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

export default function AuthScreen({ navigation }) {
  const { login } = useContext(AuthContext);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const blurAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    blurAnim.setValue(0);
    Animated.timing(blurAnim, { toValue: 1, duration: 350, useNativeDriver: false }).start();
  }, [blurAnim]);

  const blurIntensity = blurAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 40] });

  const onLogin = async () => {
    setMsg("");

    if (!phone.trim() || !password.trim()) {
      setMsg("Phone and password are required");
      return;
    }

    const res = await login(phone.trim(), password.trim());
    setMsg(res.ok ? "" : res.message);
  };

  return (
    <ImageBackground
      source={require("../../../assets/hospbg.jpg")}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <AnimatedBlurView intensity={blurIntensity} tint="dark" style={{ flex: 1 }}>
        <View style={{ flex: 1, padding: 20, justifyContent: "center" }}>
          <Text style={{ fontSize: 30, fontWeight: "900", color: "white" }}>Hospital App</Text>
          <Text style={{ marginTop: 6, color: "rgba(255,255,255,0.85)" }}>
            Login with phone & password
          </Text>

          <View
            style={{
              marginTop: 14,
              backgroundColor: "rgba(255,255,255,0.95)",
              borderRadius: 14,
              paddingHorizontal: 12,
              paddingVertical: 10,
            }}
          >
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="Phone"
              keyboardType="phone-pad"
              style={{ fontSize: 15 }}
            />
          </View>

          <View
            style={{
              marginTop: 10,
              backgroundColor: "rgba(255,255,255,0.95)",
              borderRadius: 14,
              paddingHorizontal: 12,
              paddingVertical: 10,
            }}
          >
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              secureTextEntry
              style={{ fontSize: 15 }}
            />
          </View>

          {msg ? (
            <Text style={{ color: "#ffb4b4", marginTop: 10, fontWeight: "800" }}>{msg}</Text>
          ) : null}

          <Pressable
            onPress={onLogin}
            android_ripple={{ color: "rgba(255,255,255,0.25)" }}
            style={({ pressed }) => ({
              marginTop: 12,
              backgroundColor: "black",
              padding: 14,
              borderRadius: 14,
              alignItems: "center",
              transform: [{ scale: pressed ? 0.98 : 1 }],
              opacity: pressed ? 0.92 : 1,
            })}
          >
            <Text style={{ color: "white", fontWeight: "800" }}>Login</Text>
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate("SignupDetails")}
            android_ripple={{ color: "rgba(255,255,255,0.18)" }}
            style={({ pressed }) => ({
              marginTop: 10,
              padding: 14,
              borderRadius: 14,
              alignItems: "center",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.6)",
              transform: [{ scale: pressed ? 0.98 : 1 }],
              opacity: pressed ? 0.92 : 1,
            })}
          >
            <Text style={{ color: "white", fontWeight: "800" }}>Sign up</Text>
          </Pressable>
        </View>
      </AnimatedBlurView>
    </ImageBackground>
  );
}
