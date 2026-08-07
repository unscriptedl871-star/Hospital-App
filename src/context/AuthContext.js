import React, { createContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../services/api/api"; // ✅ make sure this path matches your project

export const AuthContext = createContext(null);

const TOKEN_KEY = "token";
const USER_KEY = "user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  const normalizeUser = (u) => {
    if (!u) return u;
    return {
      ...u,
      name: String(u.name || "").trim(),
      email: String(u.email || "").trim(),
      role: String(u.role || "patient").trim().toLowerCase(),
    };
  };

  // ✅ Restore session on app start
  useEffect(() => {
    (async () => {
      try {
        const storedUser = await AsyncStorage.getItem(USER_KEY);
        if (storedUser) setUser(normalizeUser(JSON.parse(storedUser)));
      } catch (e) {
        // ignore
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  // ✅ LOGIN (MongoDB backend)
 const login = async (phone, password) => {
  try {
    const data = await api.post("/auth/login", {
      phone: String(phone || "").trim(),
      password: String(password || ""),
    });

    if (data?.token) await AsyncStorage.setItem(TOKEN_KEY, data.token);
    if (data?.user) await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));

    setUser(normalizeUser(data.user));
    return { ok: true };
  } catch (e) {
    return { ok: false, message: e?.message || "Login failed" };
  }
};


  // ✅ SIGNUP (MongoDB backend)
  const signup = async (newUser) => {
    try {
      const payload = {
        name: String(newUser?.name || "").trim(),
        email: String(newUser?.email || "").trim(),
        password: String(newUser?.password || ""),
        phone: String(newUser?.phone || "").trim(),
        hospitalId: String(newUser?.id || "").trim(), // map your 'id' -> hospitalId in backend
        role: String(newUser?.role || "patient").trim().toLowerCase(),
      };

      const data = await api.post("/auth/register", payload);

      if (data?.token) await AsyncStorage.setItem(TOKEN_KEY, data.token);
      if (data?.user) await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));

      setUser(normalizeUser(data.user));
      return { ok: true };
    } catch (e) {
      return { ok: false, message: e?.message || "Signup failed" };
    }
  };

  const logout = async () => {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    setUser(null);
  };

  

  const value = useMemo(
    () => ({ user, booting, login, signup, logout }),
    [user, booting]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
